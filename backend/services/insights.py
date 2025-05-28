# services/insights.py

from db.databases import engine
from sqlalchemy import text
from io import BytesIO
import pickle
from utils.helpers import get_aqi_category, is_threshold_exceeded
import pandas as pd
from utils.helpers import download_from_supabase_storage
from typing import Optional
from utils.email_utils import send_email_alert
from utils.helpers import setup_logger

POLLUTANTS = ["no2_conc", "o3_conc", "so2_conc", "co_conc", "no_conc"]
logger = setup_logger(__name__)

async def evaluate_all_subscriptions():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT a.id AS sub_id, a.user_id, a.region, a.pollutant, a.threshold, u.email
            FROM aqi_subscriptions a
            JOIN users u ON a.user_id = u.id
        """))
        subscriptions = [dict(row._mapping) for row in result.fetchall()]

    triggered_alerts = []

    for sub in subscriptions:
        try:
            model_id = f"{sub['region']}_{sub['pollutant']}_model.pkl"
            model_bytes = await download_from_supabase_storage(model_id, bucket="models")
            model = pickle.load(model_bytes)

            future = model.make_future_dataframe(periods=3, freq="Y")
            forecast = model.predict(future).tail(3)

            for _, row in forecast.iterrows():
                category = get_aqi_category(sub["pollutant"], row["yhat"])
                if is_threshold_exceeded(category, sub["threshold"]):
                    alert = {
                        "user_id": sub["user_id"],
                        "email": sub["email"],
                        "region": sub["region"],
                        "pollutant": sub["pollutant"],
                        "date": row["ds"],
                        "value": round(row["yhat"], 2),
                        "category": category,
                        "threshold": sub["threshold"]
                    }
                    triggered_alerts.append(alert)

                    subject = f"[AQI Alert] Forecast for {sub['region']} exceeds your threshold"
                    body = (
                        f"Dear user,\n\n"
                        f"The forecasted AQI level for {sub['pollutant']} in {sub['region']} "
                        f"on {row['ds'].date()} is {alert['value']} ({category}), "
                        f"which exceeds your threshold: {sub['threshold']}.\n\n"
                        f"Stay safe,\nThessAir Team"
                    )
                    send_email_alert(sub["email"], subject, body)
                    break
        except Exception as e:
            print(f"❌ Error evaluating subscription for {sub['email']}: {str(e)}")
            continue

    return triggered_alerts

async def get_personalized_pollutant_insights(user_id: str, region: str, pollutant: str):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT * FROM profiles WHERE user_id = :uid
        """), {"uid": user_id})
        row = result.fetchone()

    if not row:
        return {"error": "User profile not found."}
    profile = dict(row._mapping)

    risk_factor = 1.0
    if profile.get("has_asthma"):
        risk_factor += 0.4
    if profile.get("has_heart_disease"):
        risk_factor += 0.3
    if profile.get("is_smoker"):
        risk_factor += 0.3

    # 🩹 FIX: get latest year from datasets
    with engine.connect() as conn:
        year_row = conn.execute(text("""
            SELECT year FROM datasets WHERE region = :region
            ORDER BY year DESC LIMIT 1
        """), {"region": region}).fetchone()
    if not year_row:
        return {"error": "No available dataset year for region"}
    year = year_row[0]

    trend = await get_yearly_trend(region, pollutant, year)
    if "error" in trend:
        return trend

    trend["adjusted_values"] = [
        round(v * risk_factor, 2) if v is not None else None for v in trend["values"]
    ]
    trend["meta"]["type"] = "personalized_trend"
    trend["meta"]["user_id"] = user_id

    return trend

async def get_multi_year_personalized_trend(user_id: str, region: str, pollutant: str):
    # 1. Fetch user profile for risk adjustments
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT * FROM profiles WHERE user_id = :uid
        """), {"uid": user_id}).fetchone()
    profile = dict(row._mapping) if row else {}

    # Risk multiplier
    risk_factor = 1.0
    if profile.get("has_asthma"): risk_factor += 0.4
    if profile.get("has_heart_disease"): risk_factor += 0.3
    if profile.get("is_smoker"): risk_factor += 0.3

    # 2. Load all datasets for this region
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT filename, year FROM datasets
            WHERE region = :region
            ORDER BY year
        """), {"region": region})
        rows = result.fetchall()

    if not rows:
        return {"error": "No datasets available for this region."}

    combined = []
    for row in rows:
        filename = row._mapping["filename"]
        year = row._mapping["year"]
        try:
            csv_bytes = await download_from_supabase_storage(filename, bucket="datasets")
            df = pd.read_csv(csv_bytes)
            if "time" not in df.columns:
                continue
            df["time"] = pd.to_datetime(df["time"], errors="coerce")
            df.dropna(subset=["time"], inplace=True)
            df = df[df["time"].dt.year == year]

            if pollutant.lower() == "pollution":
                valid_cols = [p for p in POLLUTANTS if p in df.columns]
                if not valid_cols:
                    continue
                df["value"] = df[valid_cols].mean(axis=1)
            elif pollutant in df.columns:
                df["value"] = df[pollutant]
            else:
                continue

            df.dropna(subset=["value"], inplace=True)
            avg = df["value"].mean()
            combined.append((year, avg))

        except Exception as e:
            continue

    if not combined:
        return {"error": "No valid pollutant data found."}

    # 3. Structure results
    combined.sort(key=lambda x: x[0])
    labels = [str(y) for y, _ in combined]
    values = [round(v, 2) for _, v in combined]
    adjusted_values = [round(v * risk_factor, 2) for v in values]
    deltas = [round(values[i] - values[i - 1], 2) if i > 0 else 0.0 for i in range(len(values))]

    return {
        "labels": labels,
        "values": values,
        "adjusted_values": adjusted_values,
        "deltas": deltas,
        "unit": "μg/m³",
        "meta": {
            "type": "personalized_trend",
            "region": region,
            "pollutant": pollutant,
            "user_id": user_id,
            "years": labels
        }
    }

async def get_historical_data_by_region_year(region: str, year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT filename FROM datasets
            WHERE region = :region AND year = :year
            ORDER BY created_at DESC LIMIT 1
        """), {"region": region, "year": year})
        row = result.fetchone()

    if not row:
        return {"error": "No dataset found for this region and year."}
    row = dict(row._mapping)

    csv_bytes = await download_from_supabase_storage(row["filename"], bucket="datasets")
    df = pd.read_csv(csv_bytes)

    return {
        "columns": list(df.columns),
        "preview": df.head(10).to_dict(orient="records"),
        "summary": df.describe(include="all").to_dict()
    }

async def get_monthly_forecast_calendar(region: str, pollutant: str):
    model_id = f"{region}_{pollutant}_model.pkl"
    try:
        model_bytes = await download_from_supabase_storage(model_id, bucket="models")
        model = pickle.load(model_bytes)
    except Exception:
        return {"error": f"No trained model available for {region} - {pollutant}"}

    future = model.make_future_dataframe(periods=12, freq="M")
    forecast = model.predict(future)

    upcoming = forecast[["ds", "yhat"]].tail(12).copy()
    upcoming["month"] = upcoming["ds"].dt.strftime("%B %Y")
    upcoming["value"] = upcoming["yhat"].round(2)
    upcoming["category"] = upcoming["value"].apply(lambda val: get_aqi_category(pollutant, val))

    return upcoming[["month", "value", "category"]].to_dict(orient="records")

async def get_yearly_trend(region: str, pollutant: str, year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT filename FROM datasets
            WHERE LOWER(region) = LOWER(:region) AND year = :year
            ORDER BY created_at DESC LIMIT 1
        """), {"region": region, "year": year})
        row = result.fetchone()

    if not row:
        return {"error": "No dataset found for this region and year."}
    row = dict(row._mapping)
    csv_bytes = await download_from_supabase_storage(row["filename"], bucket="datasets")
    df = pd.read_csv(csv_bytes)

    if pollutant.lower() == "pollution":
        available = [p for p in POLLUTANTS if p in df.columns]
        if not available:
            return {"error": "No pollutant data available in dataset."}
        df["value"] = df[available].mean(axis=1)
    else:
        if pollutant not in df.columns:
            logger.warning(f"Pollutant {pollutant} not found in dataset columns: {df.columns}")
            return {"error": f"{pollutant} not found in dataset."}
        df["value"] = df[pollutant]

    if "time" not in df.columns:
        return {"error": "Missing 'time' column."}

    df["time"] = pd.to_datetime(df["time"], errors="coerce")
    df.dropna(subset=["value", "time"], inplace=True)
    df["year"] = df["time"].dt.year

    if df.empty:
        return {"error": "No data available for chart."}

    df = df.groupby("year")["value"].mean().reset_index()
    df["delta"] = df["value"].diff().round(2)

    return {
        "labels": df["year"].astype(str).tolist(),
        "values": df["value"].round(2).tolist(),
        "deltas": df["delta"].fillna(0).tolist(),
        "unit": "μg/m³",
        "meta": {
            "type": "trend",
            "region": region,
            "pollutant": pollutant,
            "year": year
        }
    }

async def get_daily_trend(region: str, pollutant: str, start_date: Optional[str], end_date: Optional[str]):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT filename FROM datasets
            WHERE region = :region
            ORDER BY year DESC LIMIT 1
        """), {"region": region})
        row = result.fetchone()

    if not row:
        return {"error": "No dataset found."}
    row = dict(row._mapping)

    csv_bytes = await download_from_supabase_storage(row["filename"], bucket="datasets")
    df = pd.read_csv(csv_bytes)

    if "time" not in df.columns:
        return {"error": "Dataset missing 'time' column."}
    df["time"] = pd.to_datetime(df["time"])

    # Filter by pollutant
    if pollutant.lower() == "pollution":
        available = [p for p in POLLUTANTS if p in df.columns]
        if not available:
            return {"error": "No pollutant data available in dataset."}
        df["value"] = df[available].mean(axis=1)
    else:
        if pollutant not in df.columns:
            logger.warning(f"Pollutant {pollutant} not found in dataset columns: {df.columns}")
            return {"error": f"{pollutant} not found in dataset."}
        df["value"] = df[pollutant]

    # Optional date filtering
    if start_date:
        df = df[df["time"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["time"] <= pd.to_datetime(end_date)]

    df = df[["time", "value"]].dropna().sort_values("time")

    return {
        "labels": df["time"].dt.strftime("%Y-%m-%d").tolist(),
        "values": df["value"].round(2).tolist(),
        "unit": "μg/m³",
        "meta": {
            "type": "daily_trend",
            "region": region,
            "pollutant": pollutant,
            "start_date": start_date,
            "end_date": end_date
        }
    }
    
async def get_daily_trend_by_year(region: str, pollutant: str, year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT filename FROM datasets
            WHERE LOWER(region) = LOWER(:region) AND year = :year
            ORDER BY created_at DESC LIMIT 1
        """), {"region": region, "year": year})
        row = result.fetchone()

    if not row:
        return {"error": "No dataset found for this region and year."}
    row = dict(row._mapping)

    csv_bytes = await download_from_supabase_storage(row["filename"], bucket="datasets")
    df = pd.read_csv(csv_bytes)

    if "time" not in df.columns:
        return {"error": "Dataset missing 'time' column."}
    df["time"] = pd.to_datetime(df["time"])
    df = df[df["time"].dt.year == year]

    if pollutant.lower() == "pollution":
        available = [p for p in POLLUTANTS if p in df.columns]
        if not available:
            return {"error": "No pollutant data available in dataset."}
        df["value"] = df[available].mean(axis=1)
    else:
        if pollutant not in df.columns:
            logger.warning(f"Pollutant {pollutant} not found in dataset columns: {df.columns}")
            return {"error": f"{pollutant} not found in dataset."}
        df["value"] = df[pollutant]

    df = df[["time", "value"]].dropna().sort_values("time")

    return {
        "labels": df["time"].dt.strftime("%Y-%m-%d").tolist(),
        "values": df["value"].round(2).tolist(),
        "unit": "μg/m³",
        "meta": {
            "type": "daily_trend",
            "region": region,
            "pollutant": pollutant,
            "year": year
        }
    }

async def get_top_polluted_regions(year: int, pollutant: str, limit: int = 5):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT region, filename FROM datasets WHERE year = :year
        """), {"year": year})
        rows = result.fetchall()

    scores = []
    for row in rows:
        row = dict(row._mapping)
        csv_bytes = await download_from_supabase_storage(row["filename"], bucket="datasets")
        df = pd.read_csv(csv_bytes)

        if pollutant.lower() == "pollution":
            available = [p for p in POLLUTANTS if p in df.columns]
            if not available:
                continue
            avg = df[available].dropna().mean(axis=1).mean()
        else:
            if pollutant not in df.columns:
                logger.warning(f"Pollutant {pollutant} not found in dataset columns: {df.columns}")
                continue
            avg = df[pollutant].dropna().mean()

        if pd.isna(avg):
            continue

        scores.append((row["region"], round(avg, 2)))

    top = sorted(scores, key=lambda x: x[1], reverse=True)[:limit]

    return {
        "labels": [r[0] for r in top],
        "values": [r[1] for r in top],
        "unit": "μg/m³",
        "meta": {
            "type": "ranking",
            "year": year,
            "pollutant": pollutant,
            "top_n": limit
        }
    }


async def get_seasonal_variation(region: str, pollutant: str, year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT filename FROM datasets
            WHERE LOWER(region) = LOWER(:region) AND year = :year
            ORDER BY created_at DESC LIMIT 1
        """), {"region": region, "year": year})
        row = result.fetchone()

    if not row:
        return {"error": "Dataset not found."}
    row = dict(row._mapping)
    csv_bytes = await download_from_supabase_storage(row["filename"], bucket="datasets")
    df = pd.read_csv(csv_bytes)

    if "time" not in df.columns:
        return {"error": "Missing 'time' column in dataset."}

    df["time"] = pd.to_datetime(df["time"], errors="coerce")
    df.dropna(subset=["time"], inplace=True)
    df["month"] = df["time"].dt.month_name()

    month_order = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    df = df[df["month"].isin(month_order)]
    df["month"] = pd.Categorical(df["month"], categories=month_order, ordered=True)

    if pollutant.lower() == "pollution":
        available = [p for p in POLLUTANTS if p in df.columns]
        if not available:
            return {"error": "No pollutant data available in dataset."}
        df["value"] = df[available].mean(axis=1)
    else:
        if pollutant not in df.columns:
            logger.warning(f"Pollutant {pollutant} not found in dataset columns: {df.columns}")
            return {"error": "Dataset must contain selected pollutant."}
        df["value"] = df[pollutant]

    df.dropna(subset=["value"], inplace=True)
    if df.empty:
        return {"error": "No data available for chart."}

    monthly_avg = df.groupby("month")["value"].mean().round(2).sort_index()

    return {
        "labels": monthly_avg.index.tolist(),
        "values": monthly_avg.values.tolist(),
        "unit": "μg/m³",
        "meta": {
            "type": "seasonality",
            "region": region,
            "pollutant": pollutant,
            "year": year
        }
    }