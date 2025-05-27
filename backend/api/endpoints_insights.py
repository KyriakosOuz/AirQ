from fastapi import APIRouter, Query, Depends, HTTPException
from core.auth import get_current_user_id
from db.databases import engine
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from collections import defaultdict
from uuid import uuid4
from datetime import datetime
from services.insights import (
    get_yearly_trend,
    get_top_polluted_regions,
    get_seasonal_variation,
    get_personalized_pollutant_insights,
    get_historical_data_by_region_year,
    get_monthly_forecast_calendar,
    get_daily_trend,
    get_daily_trend_by_year
)
import pandas as pd
from utils.helpers import download_from_supabase_storage
from typing import Union, List
from schemas.insights import (
    TrendResponse,
    TopPollutedResponse,
    SeasonalityResponse,
    FullSummaryResponse,
    HistoricalDataResponse,
    PersonalizedInsightResponse,
    MonthlyForecastResponse,
    AQISubscriptionIn,
    AQISubscriptionOut,
    DailyTrendResponse
)
from utils.helpers import setup_logger

router = APIRouter()
logger = setup_logger(__name__)

POLLUTANTS = ["no2_conc", "o3_conc", "so2_conc", "co_conc", "no_conc"]
DATASET_BUCKET = "datasets"

@router.get("/available-datasets/")
async def get_available_datasets():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, region, year, available_pollutants FROM datasets
        """))
        rows = result.fetchall()

    data = defaultdict(lambda: defaultdict(set))

    for row in rows:
        row = dict(row._mapping)
        region = row["region"]
        year = row["year"]
        try:
            available = row.get("available_pollutants") or []
            for pollutant in available:
                data[region][pollutant].add(year)
            if available:
                data[region]["pollution"].add(year)  # virtual feature
        except Exception as e:
            logger.warning(f"⚠️ Skipping dataset {row['id']} due to error: {e}")
            continue

    return {
        region: {
            pollutant: sorted(list(years))
            for pollutant, years in pollutants.items()
        }
        for region, pollutants in data.items()
    }

@router.get("/trend/", response_model=DailyTrendResponse)
async def trend_over_time(region: str, pollutant: str, year: int, user=Depends(get_current_user_id)):
    logger.info(f"\ud83d\udcc8 Daily trend for {region} - {pollutant} in {year}")
    result = await get_daily_trend_by_year(region, pollutant, year)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return {
        "region": region,
        "pollutant": pollutant,
        "trend": result
    }

@router.get("/seasonality/", response_model=SeasonalityResponse)
async def seasonal_pattern(region: str, pollutant: str, year: int, user=Depends(get_current_user_id)):
    logger.info(f"\ud83d\uddd5\ufe0f Seasonality for {region} - {pollutant} ({year})")
    result = await get_seasonal_variation(region, pollutant, year)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {
        "region": region,
        "pollutant": pollutant,
        "seasonal_avg": result
    }

@router.get("/top-polluted/", response_model=List[Dict[str, Any]])
async def top_polluted_regions(pollutant: str, year: int, top_n: int = 5, user=Depends(get_current_user_id)):
    logger.info(f"\ud83c\udfc6 Top polluted regions for {pollutant} in {year}")
    result = await get_top_polluted_regions(year, pollutant, top_n)
    return [
        {"name": name, "value": value}
        for name, value in zip(result["labels"], result["values"])
    ]

@router.get("/summary/", response_model=FullSummaryResponse)
async def pollution_summary(region: str, pollutant: str, year: int, top_n: int = 5, user=Depends(get_current_user_id)):
    logger.info(f"\ud83d\udcca Summary for {region} - {pollutant} ({year})")
    trend = await get_yearly_trend(region, pollutant, year)
    top = await get_top_polluted_regions(year, pollutant, top_n)
    seasonality = await get_seasonal_variation(region, pollutant, year)

    if "error" in trend:
        raise HTTPException(status_code=404, detail=trend["error"])
    if "error" in seasonality:
        raise HTTPException(status_code=400, detail=seasonality["error"])

    return {
        "region": region,
        "pollutant": pollutant,
        "summary": {
            "trend": trend,
            "top_regions": top,
            "seasonality": seasonality
        }
    }

@router.get("/historical/", response_model=HistoricalDataResponse)
async def historical_data(region: str, year: int):
    logger.info(f"📜 Historical view for {region} ({year})")
    result = await get_historical_data_by_region_year(region, year)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return {"region": region, "year": year, "data": result}


@router.get("/personalized/", response_model=PersonalizedInsightResponse)
async def personalized_insights(region: str, pollutant: str, user=Depends(get_current_user_id)):
    logger.info(f"🧬 Personalized insight for user {user['user_id']}, region={region}, pollutant={pollutant}")
    result = await get_personalized_pollutant_insights(user["user_id"], region, pollutant)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {
        "region": region,
        "pollutant": pollutant,
        "profile_adjusted_insights": result
    }


@router.get("/forecast-calendar/", response_model=MonthlyForecastResponse)
async def forecast_calendar(region: str, pollutant: str, user=Depends(get_current_user_id)):
    logger.info(f"📆 Calendar forecast for {region} - {pollutant}")
    result = await get_monthly_forecast_calendar(region, pollutant)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return {
        "region": region,
        "pollutant": pollutant,
        "monthly_forecast": result
    }

    
@router.post("/subscribe-alert/", response_model=AQISubscriptionOut, summary="Subscribe to AQI alerts")
async def subscribe_to_alert(
    sub: AQISubscriptionIn,
    user=Depends(get_current_user_id)
):
    logger.info(f"🔔 Creating AQI subscription for user {user['user_id']}: {sub.region} - {sub.pollutant}")
    with engine.connect() as conn:
        sub_id = str(uuid4())
        conn.execute(text("""
            INSERT INTO aqi_subscriptions (id, user_id, region, pollutant, threshold, created_at)
            VALUES (:id, :uid, :region, :pollutant, :threshold, :created_at)
        """), {
            "id": sub_id,
            "uid": user["user_id"],
            "region": sub.region,
            "pollutant": sub.pollutant,
            "threshold": sub.threshold,
            "created_at": datetime.utcnow()
        })
    logger.info(f"✅ Subscription {sub_id} created")
    return {**sub.dict(), "id": sub_id, "created_at": datetime.utcnow()}


@router.get("/subscriptions/", response_model=List[AQISubscriptionOut], summary="View my AQI subscriptions")
async def list_my_subscriptions(user=Depends(get_current_user_id)):
    logger.info(f"📥 Fetching subscriptions for user {user['user_id']}")
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, region, pollutant, threshold, created_at
            FROM aqi_subscriptions
            WHERE user_id = :uid
            ORDER BY created_at DESC
        """), {"uid": user["user_id"]})
        subs = [dict(row._mapping) for row in result.fetchall()]
        logger.info(f"✅ {len(subs)} subscriptions returned")
        return subs
    
@router.get("/triggered-alerts/", summary="Check triggered AQI alerts")
async def check_triggered_alerts(user=Depends(get_current_user_id)):
    from services.subscription_checker import evaluate_all_subscriptions
    logger.info("🔍 Checking triggered AQI alerts")
    from services.subscription_checker import evaluate_all_subscriptions
    alerts = await evaluate_all_subscriptions()
    logger.info(f"✅ {len(alerts)} alerts triggered")
    return {"total_triggered": len(alerts), "alerts": alerts}
