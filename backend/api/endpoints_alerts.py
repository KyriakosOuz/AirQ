from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from uuid import uuid4
from core.auth import get_current_user_id
from db.databases import engine
from sqlalchemy import text
from typing import List
from datetime import datetime
from services.subscription_checker import evaluate_all_subscriptions
from utils.helpers import setup_logger

router = APIRouter()
logger = setup_logger(__name__)

class AQISubscriptionIn(BaseModel):
    region: str
    pollutant: str
    threshold: str

class AQISubscriptionOut(AQISubscriptionIn):
    id: str
    created_at: datetime

@router.post("/subscribe/", response_model=AQISubscriptionOut)
async def create_subscription(sub: AQISubscriptionIn, user=Depends(get_current_user_id)):
    logger.info(f"🔔 New AQI subscription for {sub.region}-{sub.pollutant}, user={user['user_id']}")
    sub_id = str(uuid4())
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO aqi_subscriptions (id, user_id, region, pollutant, threshold, created_at)
            VALUES (:id, :user_id, :region, :pollutant, :threshold, NOW())
        """), {
            "id": sub_id,
            "user_id": user["user_id"],
            "region": sub.region,
            "pollutant": sub.pollutant,
            "threshold": sub.threshold
        })
    logger.info(f"✅ Subscription {sub_id} created")
    return {**sub.dict(), "id": sub_id, "created_at": datetime.utcnow()}

@router.get("/my-subscriptions/", response_model=List[AQISubscriptionOut])
async def list_user_subscriptions(user=Depends(get_current_user_id)):
    logger.info(f"📥 Fetching subscriptions for user {user['user_id']}")
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, region, pollutant, threshold, created_at
            FROM aqi_subscriptions
            WHERE user_id = :uid
            ORDER BY created_at DESC
        """), {"uid": user["user_id"]})
        subscriptions = [dict(row._mapping) for row in result.fetchall()]
    logger.info(f"✅ {len(subscriptions)} subscriptions returned")
    return subscriptions

@router.delete("/unsubscribe/{sub_id}")
async def delete_subscription(sub_id: str, user=Depends(get_current_user_id)):
    logger.info(f"🗑️ Unsubscribe requested for {sub_id}, user={user['user_id']}")
    with engine.connect() as conn:
        conn.execute(text("""
            DELETE FROM aqi_subscriptions
            WHERE id = :sub_id AND user_id = :uid
        """), {"sub_id": sub_id, "uid": user["user_id"]})
    logger.info("✅ Subscription deleted")
    return {"message": f"Subscription {sub_id} deleted."}

@router.get("/check-alerts/")
async def check_triggered_alerts(send_email: bool = Query(True), user=Depends(get_current_user_id)):
    logger.info(f"🔍 Checking alerts, send_email={send_email}")
    if user["role"] != "admin":
        logger.warning("❌ Unauthorized alert check attempt")
        raise HTTPException(status_code=403, detail="Only admins can trigger alert checks.")
    alerts = await evaluate_all_subscriptions(send_email=send_email)
    logger.info(f"✅ {len(alerts)} alerts triggered")
    return {"total_triggered": len(alerts), "alerts": alerts}
