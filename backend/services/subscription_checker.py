# services/subscription_checker.py

from db.databases import engine
from sqlalchemy import text
from utils.helpers import download_from_supabase_storage, get_aqi_category, is_threshold_exceeded
from utils.email_utils import send_email_alert
import pickle
import pandas as pd
from io import BytesIO

async def evaluate_all_subscriptions(send_email: bool = True):
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
            model_bytes: BytesIO = await download_from_supabase_storage(model_id, bucket="models")
            model = pickle.load(model_bytes)

            future = model.make_future_dataframe(periods=3, freq="Y")
            forecast = model.predict(future).tail(3)

            for _, row in forecast.iterrows():
                category = get_aqi_category(sub["pollutant"], row["yhat"])
                if is_threshold_exceeded(category, sub["threshold"]):
                    message = (
                        f"📍 *Region:* {sub['region']}\n"
                        f"💨 *Pollutant:* {sub['pollutant']}\n"
                        f"📅 *Forecasted Date:* {row['ds'].date()}\n"
                        f"📊 *Predicted Value:* {round(row['yhat'], 2)} → *{category}*\n"
                        f"⚠️ *Threshold set:* {sub['threshold']}"
                    )

                    alert = {
                        "user_id": sub["user_id"],
                        "email": sub["email"],
                        "region": sub["region"],
                        "pollutant": sub["pollutant"],
                        "date": row["ds"],
                        "value": round(row["yhat"], 2),
                        "category": category,
                        "threshold": sub["threshold"],
                        "message": message
                    }

                    triggered_alerts.append(alert)

                    if send_email:
                        subject = f"[AQI Alert] {sub['pollutant']} forecast for {sub['region']}"
                        send_email_alert(sub["email"], subject, message)

                    break  # only alert once per subscription

        except Exception as e:
            print(f"⚠️ Skipping alert for {sub['email']}: {str(e)}")
            continue

    return triggered_alerts