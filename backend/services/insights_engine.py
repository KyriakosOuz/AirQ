from utils.helpers import download_from_supabase_storage, get_aqi_category
from db.databases import engine
from sqlalchemy import text
from typing import Optional
import pandas as pd
import pickle
from io import BytesIO

RISK_WEIGHTS = {
    "asthma": 1.5,
    "heart_disease": 1.3,
    "smoker": 1.2,
    "diabetes": 1.3,
    "lung_disease": 1.4,
    "base": 1.0
}

FRONTEND_LABELS = {
    "Good": "good",
    "Moderate": "moderate",
    "Unhealthy for Sensitive Groups": "unhealthy-sensitive",
    "Unhealthy": "unhealthy",
    "Very Unhealthy": "very-unhealthy"
}

def calculate_risk_score(category: str, weight: float) -> int:
    base_score = {
        "Good": 0,
        "Moderate": 1,
        "Unhealthy for Sensitive Groups": 2,
        "Unhealthy": 3,
        "Very Unhealthy": 4
    }.get(category, 0)
    return round(base_score * weight)

async def build_risk_timeline(
    user_id: str,
    region: str,
    pollutant: str,
    start_date: str,
    end_date: str
):
    # Load profile
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM profiles WHERE user_id = :uid"), {"uid": user_id})
        profile = result.fetchone()
    profile = dict(profile._mapping) if profile else {}

    weight = RISK_WEIGHTS["base"]
    if profile.get("has_asthma"):
        weight *= RISK_WEIGHTS["asthma"]
    if profile.get("has_heart_disease"):
        weight *= RISK_WEIGHTS["heart_disease"]
    if profile.get("is_smoker"):
        weight *= RISK_WEIGHTS["smoker"]
    if profile.get("has_diabetes"):
        weight *= RISK_WEIGHTS["diabetes"]
    if profile.get("has_lung_disease"):
        weight *= RISK_WEIGHTS["lung_disease"]

    # Load latest model
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT model_blob FROM models
            WHERE region = :region AND pollutant = :pollutant
            ORDER BY created_at DESC LIMIT 1
        """), {"region": region, "pollutant": pollutant}).fetchone()

    if not row or not row._mapping["model_blob"]:
        return {"error": "No trained model for this pollutant in this region."}

    model = pickle.loads(row._mapping["model_blob"])
    history_end = model.history["ds"].max()

    # Generate full forecast
    full_range_days = (pd.to_datetime(end_date) - history_end).days + 30  # buffer
    future_df = model.make_future_dataframe(periods=full_range_days, freq="D")
    forecast = model.predict(future_df)

    # Filter forecast for date range only
    forecast = forecast[forecast["ds"] > history_end]
    forecast = forecast[
        (forecast["ds"] >= pd.to_datetime(start_date)) &
        (forecast["ds"] <= pd.to_datetime(end_date))
    ]
    forecast = forecast[["ds", "yhat"]]

    # Annotate with AQI and risk
    forecast["category"] = forecast["yhat"].apply(lambda val: get_aqi_category(pollutant, val))
    forecast["frontend_label"] = forecast["category"].map(FRONTEND_LABELS)
    forecast["risk_score"] = forecast["category"].apply(lambda cat: calculate_risk_score(cat, weight))
    forecast["ds"] = forecast["ds"].astype(str)

    return forecast[["ds", "yhat", "category", "frontend_label", "risk_score"]].to_dict(orient="records")