from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from core.auth import get_current_user_id
from db.databases import engine
from utils.helpers import download_from_supabase_storage
from utils.helpers import get_aqi_category
from services.evaluation import get_prophet_forecast
from services.insights import get_multi_year_personalized_trend
from services.mistral_ai import generate_health_tip
from services.insights_engine import build_risk_timeline
from datetime import datetime, timedelta
import pandas as pd
import pickle
import logging
import asyncio
import time
import os

router = APIRouter()
logger = logging.getLogger(__name__)

DEFAULT_REGION = "thessaloniki"
DEFAULT_POLLUTANTS = ["no2_conc", "o3_conc", "co_conc"]

@router.get("/overview/")
async def get_dashboard_overview(user=Depends(get_current_user_id)):
    start_time = time.time()
    region = DEFAULT_REGION
    pollutant = "pollution"
    user_id = user["user_id"]

    # 1. Load latest dataset
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT filename, year FROM datasets
            WHERE region = :region
            ORDER BY year DESC LIMIT 1
        """), {"region": region}).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="No dataset found for region")

    filename, year = row
    csv_bytes = await download_from_supabase_storage(filename, bucket="datasets")
    df = pd.read_csv(csv_bytes)
    df["time"] = pd.to_datetime(df["time"])
    df = df.sort_values("time")

    # 2. Current values
    latest = df.iloc[-1]
    current_values = {p: latest[p] for p in DEFAULT_POLLUTANTS if p in df.columns}
    current_aqi = max(
        [get_aqi_category(p, val) for p, val in current_values.items()],
        key=lambda cat: ["Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"].index(cat)
    )

    # 3. Forecast preview
    forecast = []
    try:
        with engine.connect() as conn:
            model_row = conn.execute(text("""
                SELECT file_path FROM models
                WHERE region = :region AND pollutant = :pollutant
                ORDER BY created_at DESC LIMIT 1
            """), {"region": region, "pollutant": pollutant}).fetchone()

        if model_row:
            model_filename = model_row[0]

            # Avoid double prefix
            model_path = model_filename if model_filename.startswith("local_models/") else os.path.join("local_models", model_filename)

            if os.path.exists(model_path):
                with open(model_path, "rb") as f:
                    model = pickle.load(f)

                forecast_df = get_prophet_forecast(model, pollutant=pollutant, periods=7)

                if isinstance(forecast_df, pd.DataFrame):
                    forecast_records = forecast_df.to_dict(orient="records")
                    for row in forecast_records:
                        try:
                            forecast.append({
                                "ds": str(row["ds"]),
                                "yhat": round(row["yhat"], 2),
                                "category": get_aqi_category(pollutant, row["yhat"])
                            })
                        except Exception as e:
                            logger.warning(f"⚠️ Skipping forecast row due to error: {e}")
                else:
                    logger.warning("⚠️ Forecast output was not a DataFrame")
            else:
                logger.warning(f"⚠️ Local model file not found: {model_path}")
        else:
            logger.warning(f"⚠️ No model found for {region} - {pollutant}")
    except Exception as e:
        logger.warning(f"⚠️ Forecast model error: {e}")

    # 4. Personalized insights
    personalized = await get_multi_year_personalized_trend(user_id, region, pollutant)

    # 5. AI Tip with timeout fallback
    try:
        # Get profile from DB
        with engine.connect() as conn:
            profile_row = conn.execute(text("""
                SELECT * FROM profiles WHERE user_id = :uid
            """), {"uid": user_id}).fetchone()
            profile = dict(profile_row._mapping) if profile_row else None

        # Fetch risk forecast for riskLevel
        start_date = datetime.now().date().isoformat()
        end_date = (datetime.now().date() + timedelta(days=6)).isoformat()
        
        try:
            risk_forecast = await build_risk_timeline(user_id, region, pollutant, start_date, end_date)
            risk_level_category = risk_forecast[-1]["category"] if risk_forecast else "Unknown"
        except Exception as e:
            logger.warning(f"⚠️ Risk timeline fetch failed: {e}")
            risk_level_category = "Unknown"

        health_tip = await generate_health_tip(region, pollutant, forecast, profile)
        health_tip["riskLevel"] = risk_level_category

    except asyncio.TimeoutError:
        logger.warning("⚠️ Mistral tip generation timed out.")
        health_tip = {
            "tip": "Air quality insights are currently delayed. Avoid outdoor activities if unsure.",
            "riskLevel": "Unknown",
            "personalized": bool(profile)
        }
    except Exception as e:
        logger.warning(f"⚠️ Mistral generation failed: {e}")
        health_tip = {
            "tip": "Air quality health tips are temporarily unavailable.",
            "riskLevel": "Unknown",
            "personalized": bool(profile)
        }

    duration = time.time() - start_time
    logger.info(f"✅ Dashboard overview completed in {duration:.2f}s")

    return {
        "region": region,
        "current": {
            "pollutants": current_values,
            "aqi_category": current_aqi
        },
        "forecast": forecast,
        "personalized": personalized,
        "ai_tip": health_tip
    }

@router.get("/alerts/")
async def get_dashboard_alerts(user=Depends(get_current_user_id)):
    user_id = user["user_id"]
    return {
        "active_alerts": [],
        "subscribed_regions": [],
        "status": "No alerts configured yet"
    }