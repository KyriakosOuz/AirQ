# --- services/prediction.py ---

import pickle
import pandas as pd
from io import BytesIO
from db.databases import engine
from utils.helpers import download_from_supabase_storage, get_aqi_category
from sqlalchemy import text

async def load_forecast_model(region: str, pollutant: str):
    """Download and load a trained Prophet model."""
    model_id = f"{region}_{pollutant}_model.pkl"
    try:
        model_bytes: BytesIO = await download_from_supabase_storage(model_id, bucket="models")
        model = pickle.load(model_bytes)
        return model
    except Exception:
        return None


async def forecast_pollutant(region: str, pollutant: str, periods: int = 168):
    """
    Forecast pollutant levels using a trained model.
    Forecast horizon: 168 hours (~7 days)
    """
    model = await load_forecast_model(region, pollutant)
    if not model:
        return {"error": "Trained model not found for the given region and pollutant."}

    try:
        future = model.make_future_dataframe(periods=periods, freq="H")
        forecast = model.predict(future)
        forecast_result = forecast[["ds", "yhat"]].tail(periods)
        forecast_result["category"] = forecast_result["yhat"].apply(lambda v: get_aqi_category(pollutant, v))
        return forecast_result.to_dict(orient="records")

    except Exception as e:
        return {"error": str(e)}


async def list_available_models():
    """Return list of all trained models (region + pollutant)."""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT region, pollutant FROM models"))
        return [dict(row._mapping) for row in result]
