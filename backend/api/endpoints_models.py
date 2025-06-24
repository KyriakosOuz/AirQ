from fastapi import APIRouter, Depends, HTTPException, Query, Path
from core.auth import get_current_user_id
from services.model_training import train_forecast_model
from services.evaluation import load_forecast_model, get_prophet_forecast
from db.databases import engine
from typing import Optional, List
from sqlalchemy import text
from utils.helpers import delete_from_supabase_storage, download_from_supabase_storage
from utils.helpers import get_aqi_category
from services.insights_engine import build_risk_timeline, FRONTEND_LABELS
from services.mistral_ai import generate_health_tip
import pickle
from pydantic import BaseModel
import pandas as pd
from core.config import settings
import json


from utils.helpers import setup_logger
from fastapi.responses import JSONResponse
logger = setup_logger(__name__)

router = APIRouter()


@router.post("/train/")
async def train_pollutant_model(
    region: str = Query(..., description="Region name (e.g. Kalamaria)"),
    pollutant: str = Query(..., description="Pollutant name (e.g. NO2, O3, SO2)"),
    frequency: str = Query("D", description="Forecast frequency: D, W, M, Y"),
    periods: int = Query(365, description="Number of forecast steps (e.g., 365 days)"),
    overwrite: bool = Query(False, description="Overwrite existing model if one exists"),
    user=Depends(get_current_user_id)
):
    if user["role"] != "admin":
        logger.warning("❌ Unauthorized training attempt")
        raise HTTPException(status_code=403, detail="Only admins can train models.")

    frequency = frequency.lower()
    logger.info(f"🚀 Training model for {region} - {pollutant} ({frequency}, {periods}) by user {user['user_id']} | Overwrite: {overwrite}")

    # Check if model exists when overwrite is False
    if not overwrite:
        with engine.connect() as conn:
            count = conn.execute(text("""
                SELECT COUNT(*) FROM models WHERE region = :region AND pollutant = :pollutant AND frequency = :frequency
            """), {
                "region": region,
                "pollutant": pollutant,
                "frequency": frequency
            }).scalar()
        if count and count > 0:
            logger.warning("⚠️ Model already exists. Use overwrite to retrain.")
            raise HTTPException(status_code=400, detail="Model already exists. Enable overwrite to retrain.")

    result = await train_forecast_model(
        region=region,
        pollutant=pollutant,
        frequency=frequency,
        periods=periods,
        user_id=user["user_id"],
        overwrite=overwrite
    )

    if not result or "error" in result:
        error_msg = result.get("error", "Unknown error")
        logger.error(f"❌ Training failed: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)

    logger.info(f"✅ Training completed for {region} - {pollutant} ({frequency})")
    return result

from fastapi import Query
from datetime import datetime

@router.get("/predict/")
async def predict_pollutant(
    region: str = Query(..., description="Region name (e.g. Thessaloniki)"),
    pollutant: str = Query(..., description="Pollutant column name (e.g. no2_conc)"),
    frequency: str = Query("D", description="Forecast frequency: D (daily), W (weekly), M (monthly), Y (yearly)"),
    limit: int = Query(6, description="Number of future points if no date range is given"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    user=Depends(get_current_user_id)
):
    logger.info(f"📈 Predicting {pollutant} for {region} ({frequency}) | User: {user['user_id']}")

    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT file_path FROM models
            WHERE region = :region AND pollutant = :pollutant AND frequency = :frequency
            ORDER BY created_at DESC LIMIT 1
        """), {
            "region": region,
            "pollutant": pollutant,
            "frequency": frequency
        }).mappings().fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Trained model not found for this frequency")

    filename = row["file_path"]
    model_bytes = await download_from_supabase_storage(filename, bucket=settings.bucket_models)
    model = pickle.load(model_bytes)

    # Parse optional dates
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None

    forecast_df = get_prophet_forecast(
        model=model,
        pollutant=pollutant,
        frequency=frequency,
        periods=limit,
        start_date=start,
        end_date=end
    )

    return {
        "region": region,
        "pollutant": pollutant,
        "frequency": frequency,
        "forecast": forecast_df.to_dict(orient="records") if hasattr(forecast_df, "to_dict") else forecast_df
    }



@router.get("/list/")
async def list_models(user=Depends(get_current_user_id)):
    logger.info(f"\U0001F4C2 Listing models for user {user['user_id']}")
    if user["role"] != "admin":
        logger.warning("⚠️ Unauthorized model listing attempt")
        raise HTTPException(status_code=403, detail="Admin only")

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, region, pollutant, model_type, file_path, frequency, forecast_periods, mae AS accuracy_mae, rmse AS accuracy_rmse, status, created_at
            FROM models
            ORDER BY created_at DESC
        """))
        models = [dict(row._mapping) for row in result.fetchall()]
        logger.info(f"✅ {len(models)} models found")
        return models

@router.get("/forecast/{model_id}")
async def get_forecast_from_model(model_id: str, user=Depends(get_current_user_id)):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT region, pollutant, frequency FROM models WHERE id = :id"),
            {"id": model_id}
        ).mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Model not found")

    model = await load_forecast_model(row["region"], row["pollutant"], row["frequency"])
    if not model:
        raise HTTPException(status_code=404, detail="Model file not found")

    forecast_df = get_prophet_forecast(model, row["pollutant"], frequency=row["frequency"])
    return {
        "region": row["region"],
        "pollutant": row["pollutant"],
        "frequency": row["frequency"],
        "forecast": forecast_df.to_dict(orient="records")
    }

@router.get("/forecast-range/")
async def forecast_from_model(
    region: str = Query(...),
    pollutant: str = Query(...),
    frequency: str = Query(...),
    limit: int = Query(7)
):
    logger.info(f"📈 Forecast request for {region}-{pollutant} [{frequency}]")

    freq_map = {"daily": "D", "monthly": "M", "yearly": "Y"}
    normalized_freq = freq_map.get(frequency.lower(), frequency.upper())

    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT model_blob FROM models
            WHERE region = :region AND pollutant = :pollutant AND frequency = :frequency
            ORDER BY created_at DESC LIMIT 1
        """), {
            "region": region,
            "pollutant": pollutant,
            "frequency": frequency.lower()
        }).fetchone()

    if not row or not row._mapping["model_blob"]:
        logger.warning("⚠️ No model found in DB for that combination.")
        raise HTTPException(status_code=404, detail="Model not found.")
    
    try:
        model = pickle.loads(row._mapping["model_blob"])
        print("🔍 Training target range (y):", model.history["y"].describe())
    except Exception as e:
        logger.error(f"❌ Failed to load model blob: {e}")
        raise HTTPException(status_code=500, detail="Model loading failed.")

    try:
        forecast_df = get_prophet_forecast(model, pollutant, frequency=normalized_freq, periods=limit)
        return {"forecast": json.loads(forecast_df.to_json(orient="records"))}
    except Exception as e:
        logger.error(f"❌ Forecast generation failed: {e}")
        raise HTTPException(status_code=500, detail="Forecast failed.")

@router.get("/forecast/risk-timeline/")
async def get_risk_timeline(
    region: str,
    pollutant: str,
    start_date: str = Query(...),
    end_date: str = Query(...),
    user=Depends(get_current_user_id)
):
    if pollutant.lower() == "pollution":
        combined = []
        for pol in ["no2_conc", "o3_conc", "so2_conc", "co_conc", "no_conc"]:
            logger.info(f"🔁 Sub-forecast for {pol}")
            sub_result = await build_risk_timeline(user["user_id"], region, pol, start_date, end_date)
            if "error" in sub_result:
                logger.warning(f"⚠️ {pol} skipped: {sub_result['error']}")
                continue
            combined.append(pd.DataFrame(sub_result))

        if not combined:
            raise HTTPException(status_code=404, detail="No forecast data for any pollutants.")

        # Merge and average
        merged = pd.concat(combined).groupby("ds").agg({
            "yhat": "mean",
            "risk_score": "mean"
        }).reset_index()

        # Compute simplified category and frontend label from average yhat
        merged["category"] = merged["yhat"].apply(lambda v: get_aqi_category("NO2", v))
        merged["frontend_label"] = merged["category"].map(FRONTEND_LABELS)
        merged["risk_score"] = merged["risk_score"].round().astype(int)
        merged["ds"] = merged["ds"].astype(str)

        return JSONResponse({
            "forecast": merged.to_dict(orient="records"),
            "current": merged.iloc[0].to_dict() if not merged.empty else None
        })

    # Regular single-pollutant flow
    result = await build_risk_timeline(
        user_id=user["user_id"],
        region=region,
        pollutant=pollutant,
        start_date=start_date,
        end_date=end_date
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return JSONResponse({
        "forecast": result,
        "current": result[0] if result else None
    })

@router.delete("/delete/{model_id}")
async def delete_model(model_id: str = Path(...), user=Depends(get_current_user_id)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete models.")

    # Fetch model info from DB
    with engine.begin() as conn:
        result = conn.execute(text("SELECT file_path FROM models WHERE id = :id"), {"id": model_id})
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Model not found.")

        filename = row._mapping["file_path"]

        # Delete DB record
        conn.execute(text("DELETE FROM models WHERE id = :id"), {"id": model_id})

    # Delete from Supabase storage
    bucket = settings.bucket_models
    await delete_from_supabase_storage(filename, bucket)

    return {"message": f"Model {model_id} deleted successfully."}

@router.patch("/status/{model_id}")
async def update_model_status(
    model_id: str = Path(...),
    status: str = Query(..., description="New status (e.g., ready, in_progress, failed)"),
    user=Depends(get_current_user_id)
):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update model status.")

    with engine.begin() as conn:
        result = conn.execute(text("""
            UPDATE models SET status = :status WHERE id = :id
        """), {"status": status, "id": model_id})

    return {"message": f"✅ Model {model_id} status updated to '{status}'."}

@router.get("/check-exists/")
async def check_model_exists(region: str, pollutant: str, frequency: str):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) AS count FROM models
            WHERE region = :region AND pollutant = :pollutant AND frequency = :frequency
        """), {
            "region": region,
            "pollutant": pollutant,
            "frequency": frequency
        })
        row = result.mappings().fetchone()
        count = row["count"] if row else 0

    return {"exists": count > 0}

# @router.get("/info/{model_id}")
# async def get_model_info(model_id: str, user=Depends(get_current_user_id)):
#     """Deprecated duplicate endpoint kept for reference."""
#     with engine.connect() as conn:
#         row = conn.execute(text("""
#             SELECT * FROM models WHERE id = :id
#         """), {"id": model_id}).mappings().fetchone()
#
#     if not row:
#         raise HTTPException(status_code=404, detail="Model not found.")
#
#     return dict(row)

class CompareModelsRequest(BaseModel):
    model_ids: List[str]

@router.post("/compare/")
async def compare_models(
    request: CompareModelsRequest,
    user=Depends(get_current_user_id)
):
    model_ids = request.model_ids
    forecasts = []

    metadata = []
    for model_id in model_ids:
        with engine.connect() as conn:
            meta = conn.execute(text("SELECT * FROM models WHERE id = :id"), {"id": model_id}).mappings().fetchone()
        if not meta:
            continue
        metadata.append(meta)

    pollutants = set(m["pollutant"] for m in metadata)
    frequencies = set(m["frequency"] for m in metadata)
    if len(pollutants) > 1 or len(frequencies) > 1:
        raise HTTPException(status_code=400, detail="Models must have the same pollutant and frequency for comparison.")

    for meta in metadata:
        model = await load_forecast_model(meta["region"], meta["pollutant"], meta["frequency"])
        if model:
            forecast_df = get_prophet_forecast(
                model, meta["pollutant"], frequency=meta["frequency"], periods=90
            )
            forecasts.append({
                "model_id": meta["id"],
                "region": meta["region"],
                "pollutant": meta["pollutant"],
                "forecast": forecast_df.to_dict(orient="records")
            })

    return {"models": forecasts}

@router.get("/metadata/filters")
async def get_model_filters():
    regions = [
        "thessaloniki",
        "kalamaria",
        "sykeon",
        "pylaia",
        "toumba",
        "center"
    ]

    pollutants = [
        "no2_conc",
        "o3_conc",
        "so2_conc",
        "co_conc",
        "no_conc"
    ]

    frequencies = [
        "daily",
        "monthly",
        "yearly"
    ]

    return JSONResponse({
        "regions": regions,
        "pollutants": pollutants,
        "frequencies": frequencies
    })
    
@router.get("/info/{model_id}")
async def get_model_info(model_id: str):
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT 
                id, region, pollutant, frequency, forecast_periods,
                mae, rmse, status, created_at
            FROM models
            WHERE id = :model_id
        """), {"model_id": model_id}).mappings().fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Model not found")

    # Defensive casting with fallbacks
    return {
        "id": str(row.get("id")),
        "region": row.get("region"),
        "pollutant": row.get("pollutant"),
        "frequency": row.get("frequency"),
        "forecast_periods": int(row["forecast_periods"]) if row.get("forecast_periods") is not None else None,
        "mae": float(row["mae"]) if isinstance(row.get("mae"), (int, float)) else None,
        "rmse": float(row["rmse"]) if isinstance(row.get("rmse"), (int, float)) else None,
        "status": row.get("status"),
        "created_at": row["created_at"].isoformat() if hasattr(row.get("created_at"), "isoformat") else None
    }



@router.get("/preview/{model_id}")
async def preview_model_forecast(model_id: str, limit: int = 7):
    logger.info(f"🔮 Preview forecast for model {model_id} with limit={limit}")

    with engine.connect() as conn:
        row = conn.execute(text("SELECT * FROM models WHERE id = :id"), {"id": model_id}).mappings().fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Model not found")

    # Load model from blob
    model = pickle.loads(row["model_blob"])
    freq_map = {"daily": "D", "weekly": "W", "monthly": "M", "yearly": "Y"}
    freq_code = freq_map.get(row["frequency"].lower(), "D")

    forecast = get_prophet_forecast(
        model=model,
        pollutant=row["pollutant"],
        frequency=freq_code,
        periods=limit
    )
    return forecast.to_dict(orient="records")

@router.get("/forecast/health-tip/")
async def get_health_tip(
    region: str,
    pollutant: str,
    start_date: str,
    end_date: str,
    user=Depends(get_current_user_id)
):
    logger.info(f"🧠 Generating health tip for {region}, pollutant: {pollutant}")

    # 👉 Load user profile
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM profiles WHERE user_id = :uid"),
            {"uid": user["user_id"]}
        ).fetchone()
    profile = dict(result._mapping) if result else {}

    if pollutant.lower() == "pollution":
        combined = []
        POLLUTANTS = ["no2_conc", "o3_conc", "so2_conc", "co_conc", "no_conc"]
        for pol in POLLUTANTS:
            logger.info(f"🔁 Sub-forecast for {pol}")
            sub_result = await build_risk_timeline(user["user_id"], region, pol, start_date, end_date)
            if "error" in sub_result:
                logger.warning(f"⚠️ {pol} skipped: {sub_result['error']}")
                continue
            combined.append(pd.DataFrame(sub_result))

        if not combined:
            raise HTTPException(status_code=404, detail="No forecast data for any pollutants.")

        # 📊 Merge on ds and average yhat/risk
        merged = pd.concat(combined).groupby("ds").agg({
            "yhat": "mean",
            "risk_score": "mean"
        }).reset_index()

        # Optional: pick main pollutant for AQI label logic
        merged["category"] = merged["yhat"].apply(lambda v: get_aqi_category("NO2", v))  # use weighted logic later
        merged["risk_score"] = merged["risk_score"].round().astype(int)
        merged["ds"] = merged["ds"].astype(str)
        forecast = merged.to_dict(orient="records")

    else:
        # 👉 Regular single-pollutant forecast
        forecast = await build_risk_timeline(
            user_id=user["user_id"],
            region=region,
            pollutant=pollutant,
            start_date=start_date,
            end_date=end_date
        )

        if isinstance(forecast, dict) and "error" in forecast:
            raise HTTPException(status_code=404, detail=forecast["error"])
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast is empty.")

    logger.info(f"📬 Forecast rows to Mistral: {len(forecast)}")

    # 🔁 Generate AI health suggestions
    try:
        tip = await generate_health_tip(region, pollutant, forecast, profile)
        logger.info(f"✅ Mistral call successful: {tip}")
    except Exception as e:
        logger.error(f"❌ Mistral call failed: {e}")
        tip = {
            "tip": "Air quality data is currently unavailable. Consider staying indoors as a precaution.",
            "riskLevel": "Unknown",
            "personalized": bool(profile)
        }

    return tip