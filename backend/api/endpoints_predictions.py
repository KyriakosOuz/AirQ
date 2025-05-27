from fastapi import APIRouter, Query, Depends, HTTPException
from core.auth import get_current_user_id
from utils.helpers import download_from_supabase_storage, get_aqi_category
from db.databases import engine
from sqlalchemy import text
from io import BytesIO
import pandas as pd
import pickle
from utils.helpers import setup_logger

router = APIRouter()
logger = setup_logger(__name__)

@router.get("/forecast/")
async def predict_pollutant(region: str = Query(...), pollutant: str = Query(...), user=Depends(get_current_user_id)):
    model_id = f"{region}_{pollutant}_model.pkl"
    logger.info(f"📈 Predicting {pollutant} for {region}, user={user['user_id']}")

    try:
        model_bytes: BytesIO = await download_from_supabase_storage(model_id, bucket="models")
        model = pickle.load(model_bytes)
        logger.info("✅ Model loaded successfully")
    except Exception as e:
        logger.error(f"❌ Model load failed: {e}", exc_info=True)
        raise HTTPException(status_code=404, detail=f"Model not found for {region} - {pollutant}")

    forecast = model.predict(model.make_future_dataframe(periods=3, freq="Y"))
    forecast_tail = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(90)
    forecast_tail["category"] = forecast_tail["yhat"].apply(lambda val: get_aqi_category(pollutant, val))

    logger.info("✅ Forecast generated")
    return {
        "region": region,
        "pollutant": pollutant,
        "forecast": forecast_tail.to_dict(orient="records")
    }

@router.post("/compare/")
async def compare_regions_pollutant(pollutant: str = Query(...), regions: list[str] = Query(...), user=Depends(get_current_user_id)):
    logger.info(f"📊 Comparing {pollutant} across regions: {regions}")
    from api.endpoints_predictions import predict_pollutant

    comparison = []
    for region in regions:
        try:
            forecast = await predict_pollutant(region=region, pollutant=pollutant, user=user)
            logger.info(f"✅ Forecast success for region: {region}")
            comparison.append({"region": region, "forecast": forecast["forecast"]})
        except HTTPException as e:
            logger.warning(f"⚠️ Failed forecast for region: {region} — {e.detail}")
            comparison.append({"region": region, "error": e.detail})

    logger.info("✅ Comparison complete")
    return {"pollutant": pollutant, "comparison": comparison}
