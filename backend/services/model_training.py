from prophet import Prophet
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from uuid import uuid4
import pickle
import os
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import text
from db.databases import engine
from services.evaluation import get_prophet_forecast
from utils.helpers import (
    upload_to_supabase_storage,
    download_from_supabase_storage,
    setup_logger, get_aqi_category
)
from core.config import settings
from io import BytesIO

MODEL_BUCKET = "models"
logger = setup_logger(__name__)


def preprocess_dataset_for_prophet(df: pd.DataFrame, date_col: str, value_col: str) -> pd.DataFrame:
    df[date_col] = pd.to_datetime(df[date_col])
    df = df[[date_col, value_col]].dropna()
    df.columns = ["ds", "y"]
    df = df.sort_values("ds")
    return df


def aggregate_to_frequency(df: pd.DataFrame, frequency: str) -> pd.DataFrame:
    if frequency == "daily":
        return df.resample("D", on="ds").mean().reset_index()
    elif frequency == "monthly":
        return df.resample("M", on="ds").mean().reset_index()
    elif frequency == "yearly":
        return df.resample("Y", on="ds").mean().reset_index()
    else:
        raise ValueError(f"Unsupported frequency: {frequency}")


LOCAL_MODEL_DIR = "local_models"
os.makedirs(LOCAL_MODEL_DIR, exist_ok=True)

async def train_forecast_model(
    region: str,
    pollutant: str,
    frequency: str,
    periods: int,
    user_id: str,
    overwrite: bool = False
):
    logs = []
    try:
        allowed_freqs = {"daily", "monthly", "yearly"}
        frequency = frequency.lower()
        if frequency not in allowed_freqs:
            return {"error": f"Invalid frequency '{frequency}'"}

        freq_map = {"daily": "D", "monthly": "M", "yearly": "Y"}
        normalized_freq = freq_map[frequency]

        # Step 1: Check for existing model
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, frequency, forecast_periods FROM models
                WHERE region = :region AND pollutant = :pollutant AND frequency = :frequency
            """), {
                "region": region,
                "pollutant": pollutant,
                "frequency": normalized_freq
            })
            existing = [dict(row._mapping) for row in result.fetchall()]

        if not overwrite:
            for m in existing:
                if m["forecast_periods"] == periods:
                    return {
                        "error": f"Model already exists for {region} - {pollutant} ({frequency}, {periods}). Use overwrite=True."
                    }

        # Step 2: Load datasets
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT filename, id FROM datasets
                WHERE region = :region ORDER BY year ASC
            """), {"region": region})
            rows = result.fetchall()

        if not rows:
            return {"error": "No dataset found for this region."}

        dataset_id = rows[-1]._mapping["id"]
        dfs = [
            pd.read_csv(await download_from_supabase_storage(r._mapping["filename"], bucket="datasets"))
            for r in rows
        ]
        df = pd.concat(dfs, ignore_index=True)

        # Step 3: Preprocess
        expected_datetime_col = "time"
        valid_pollutants = ["no2_conc", "o3_conc", "co_conc", "no_conc", "so2_conc"]

        pollutant = pollutant.lower()
        if pollutant == "pollution":
            available = [p for p in valid_pollutants if p in df.columns]
            if not available:
                return {"error": "No pollutants found to compute pollution average."}
            df["y"] = df[available].mean(axis=1)
        elif pollutant in valid_pollutants and pollutant in df.columns:
            df["y"] = df[pollutant]
        else:
            return {"error": f"Invalid pollutant: '{pollutant}'"}

        if expected_datetime_col not in df.columns:
            return {"error": f"Missing column: '{expected_datetime_col}'"}

        df["ds"] = pd.to_datetime(df[expected_datetime_col])
        df = df[["ds", "y"]].dropna()
        df = df.set_index("ds").resample(normalized_freq).mean().dropna().reset_index()

        # Step 4: Train
        split_index = int(len(df) * 0.8)
        train_df, test_df = df.iloc[:split_index], df.iloc[split_index:]
        model = Prophet(daily_seasonality=True, yearly_seasonality=True)
        model.fit(train_df)

        # Step 5: Evaluate
        forecast_full = model.predict(df[["ds"]])
        df["yhat"] = forecast_full["yhat"]
        df.dropna(subset=["y", "yhat"], inplace=True)

        test_df = df.iloc[int(len(df) * 0.8):]
        if not test_df.empty:
            mae = mean_absolute_error(test_df["y"], test_df["yhat"])
            rmse = mean_squared_error(test_df["y"], test_df["yhat"]) ** 0.5
        else:
            mae, rmse = None, None
            logs.append("⚠️ Skipped metric evaluation: empty test set")

        logger.info(f"✅ Total rows after aggregation: {len(df)}")
        logger.info(f"🔍 Test set size: {len(test_df)}")
        logger.info(f"📉 Columns: {df.columns.tolist()}")

        # Step 6: Save model locally
        model_id = str(uuid4())
        created_at = datetime.now(timezone.utc)
        filename_model = f"{region}_{pollutant}_{frequency}_{periods}_model.pkl"
        model_path = os.path.join(LOCAL_MODEL_DIR, filename_model)

        with open(model_path, "wb") as f:
            pickle.dump(model, f)

        # Step 7: Save to DB
        model_blob = pickle.dumps(model)

        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO models (
                    id, dataset_id, model_type, file_path, trained_by,
                    region, pollutant, frequency, forecast_periods,
                    mae, rmse, status, created_at, model_blob
                ) VALUES (
                    :id, :dataset_id, :model_type, :file_path, :trained_by,
                    :region, :pollutant, :frequency, :forecast_periods,
                    :mae, :rmse, :status, :created_at, :model_blob
                )
            """), {
                "id": model_id,
                "dataset_id": dataset_id,
                "model_type": "Prophet",
                "file_path": model_path,
                "trained_by": user_id,
                "region": region,
                "pollutant": pollutant,
                "frequency": frequency,
                "forecast_periods": periods,
                "mae": mae,
                "rmse": rmse,
                "status": "ready",
                "created_at": created_at,
                "model_blob": model_blob
            })

        # Step 8: Return forecast
        preview = get_prophet_forecast(
            model=model,
            pollutant=pollutant,
            frequency=frequency,
            periods=periods
        )

        return {
            "message": f"Model trained for {region} - {pollutant}",
            "trained_at": created_at.isoformat(),
            "metrics": {
                "mae": round(mae, 3) if mae is not None else None,
                "rmse": round(rmse, 3) if rmse is not None else None,
                "test_samples": len(test_df)
            },
            "forecast_preview": preview,
            "logs": logs
        }

    except Exception as e:
        logger.exception("🚨 Training failed")
        return {"error": str(e)}