from utils.helpers import download_from_supabase_storage, get_aqi_category
from io import BytesIO
from typing import Optional
from sqlalchemy import text
from db.databases import engine
from core.config import settings
import pickle
import pandas as pd
from utils.helpers import setup_logger

MODEL_BUCKET = "models"
logger = setup_logger(__name__)

async def load_forecast_model(region: str, pollutant: str, frequency: str):
    freq_map = {"daily": "D", "weekly": "W", "monthly": "M", "yearly": "Y"}
    normalized_freq = freq_map.get(frequency.lower(), frequency.upper())

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT model_blob FROM models
            WHERE region = :region AND pollutant = :pollutant AND frequency = :frequency
            ORDER BY created_at DESC LIMIT 1
        """), {
            "region": region,
            "pollutant": pollutant,
            "frequency": frequency.lower()
        }).fetchone()

    if result and result._mapping["model_blob"]:
        return pickle.loads(result._mapping["model_blob"])
    else:
        return None


def get_prophet_forecast(model, pollutant: str, frequency: str = "D", periods: Optional[int] = None):
    try:
        freq_map = {
            "daily": "D", "weekly": "W", "monthly": "M", "yearly": "Y",
            "d": "D", "w": "W", "m": "M", "y": "Y"
        }
        normalized_freq = freq_map.get(frequency.lower(), frequency.upper())
        
        # ✅ Get last date from training
        last_training_date = model.history["ds"].max()
        logger.info(f"🧠 Model trained up to: {last_training_date}")

        # ✅ Generate full future dataframe
        full_future = model.make_future_dataframe(periods=periods or 7, freq=normalized_freq)

        # ✅ Keep only rows after the training data
        future = full_future[full_future["ds"] > last_training_date]

        # Predict
        forecast = model.predict(future)
        result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
        result["ds"] = result["ds"].dt.strftime("%Y-%m-%dT%H:%M:%S")
        result["category"] = result["yhat"].apply(lambda v: get_aqi_category(pollutant, v))
        logger.info(f"📅 Forecast starts at {result['ds'].iloc[0]} with {len(result)} points")

        return result
    except Exception as e:
        logger.error(f"❌ Forecast generation failed: {str(e)}")
        return pd.DataFrame()
