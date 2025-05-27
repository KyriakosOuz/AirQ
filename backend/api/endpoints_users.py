from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from db.databases import engine
from core.auth import get_current_user_id
from services.insights_engine import build_risk_timeline
from core.auth import signup_user, login_user
from utils.helpers import setup_logger

router = APIRouter()
logger = setup_logger(__name__)

# ----------- MODELS -----------

class UserProfileIn(BaseModel):
    age: int
    has_asthma: bool
    has_heart_disease: bool
    is_smoker: bool
    has_diabetes: bool
    has_lung_disease: bool

class AuthRequest(BaseModel):
    email: EmailStr
    password: str

# ----------- ENDPOINTS -----------
@router.post("/profile/")
async def save_user_profile(profile: UserProfileIn, user=Depends(get_current_user_id)):
    logger.info(f"🔄 Saving profile for user {user['user_id']}")
    with engine.begin() as conn:
        result = conn.execute(text("SELECT 1 FROM profiles WHERE user_id = :uid"), {"uid": user["user_id"]})
        if result.fetchone():
            logger.info("Profile exists — performing update")
            conn.execute(text("""
                UPDATE profiles
                SET age = :age,
                    has_asthma = :asthma,
                    has_heart_disease = :heart,
                    is_smoker = :smoker,
                    has_diabetes = :diabetes,
                    has_lung_disease = :lung,
                    updated_at = NOW()
                WHERE user_id = :uid
            """), {
                "uid": user["user_id"],
                "age": profile.age,
                "asthma": profile.has_asthma,
                "heart": profile.has_heart_disease,
                "smoker": profile.is_smoker,
                "diabetes": profile.has_diabetes,
                "lung": profile.has_lung_disease
            })
        else:
            logger.info("No existing profile — creating new")
            conn.execute(text("""
                INSERT INTO profiles (
                    user_id, age, has_asthma, has_heart_disease,
                    is_smoker, has_diabetes, has_lung_disease
                )
                VALUES (:uid, :age, :asthma, :heart, :smoker, :diabetes, :lung)
            """), {
                "uid": user["user_id"],
                "age": profile.age,
                "asthma": profile.has_asthma,
                "heart": profile.has_heart_disease,
                "smoker": profile.is_smoker,
                "diabetes": profile.has_diabetes,
                "lung": profile.has_lung_disease
            })

    logger.info("✅ Profile saved")
    return {"message": "Profile saved successfully."}


@router.get("/profile/")
async def get_user_profile(user=Depends(get_current_user_id)):
    logger.info(f"📥 Fetching profile for user {user['user_id']}")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM profiles WHERE user_id = :uid"), {"uid": user["user_id"]})
        row = result.fetchone()
        if not row:
            logger.warning("❌ Profile not found")
            raise HTTPException(status_code=404, detail="Profile not found.")
        logger.info("✅ Profile fetched")
        return dict(row._mapping)


@router.get("/risk-timeline/")
async def get_risk_timeline(
    region: str = Query(...),
    pollutant: str = Query(...),
    user=Depends(get_current_user_id)
):
    logger.info(f"📊 Generating risk timeline for user {user['user_id']} in {region}, pollutant={pollutant}")
    result = await build_risk_timeline(user["user_id"], region, pollutant)
    if "error" in result:
        logger.error(f"❌ Failed to generate risk timeline: {result['error']}")
        raise HTTPException(status_code=400, detail=result["error"])
    logger.info("✅ Risk timeline generated")
    return {
        "region": region,
        "pollutant": pollutant,
        "timeline": result
    }


@router.post("/users/signup/")
async def signup(data: AuthRequest):
    logger.info(f"📝 New signup attempt for {data.email}")
    result, status = await signup_user(data.email, data.password)
    if status >= 400:
        logger.error(f"❌ Signup failed for {data.email}: {result.get('msg')}")
        raise HTTPException(status_code=status, detail=result.get("msg", "Signup failed"))
    logger.info(f"✅ Signup successful for {data.email}")
    return result


@router.post("/users/login/")
async def login(data: AuthRequest):
    logger.info(f"🔐 Login attempt for {data.email}")
    result, status = await login_user(data.email, data.password)
    if status >= 400:
        logger.warning(f"❌ Login failed for {data.email}: {result.get('msg')}")
        raise HTTPException(status_code=status, detail=result.get("msg", "Login failed"))
    logger.info(f"✅ Login successful for {data.email}")
    return result


@router.get("/users/me/")
async def get_me(user=Depends(get_current_user_id)):
    logger.info(f"👤 Getting current user profile for {user['user_id']}")
    with engine.connect() as conn:
        profile = conn.execute(
            text("SELECT * FROM profiles WHERE user_id = :uid"),
            {"uid": user["user_id"]}
        ).fetchone()
    logger.info("✅ Profile and user info returned")
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "profile": dict(profile._mapping) if profile else None
    }
