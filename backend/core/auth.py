import os
import requests
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from core.config import settings
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()
ALGORITHM = "HS256"
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_SIGNUP_URL = f"{settings.supabase_url}/auth/v1/signup"
SUPABASE_LOGIN_URL = f"{settings.supabase_url}/auth/v1/token?grant_type=password"

if not SUPABASE_JWT_SECRET:
    raise RuntimeError("SUPABASE_JWT_SECRET is missing. Check your .env file.")

from db.databases import engine
from sqlalchemy import text


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        email = payload.get("email")

        # Fetch role from 'profiles' table
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT role FROM profiles WHERE user_id = :uid"),
                {"uid": user_id}
            )
            row = result.fetchone()
            role = dict(row._mapping).get("role", "user") if row else "user"

        return {
            "user_id": user_id,
            "email": email,
            "role": role,
            "token": token
        }

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    
async def signup_user(email: str, password: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(SUPABASE_SIGNUP_URL, json={"email": email, "password": password})
        if response.status_code != 200:
            return {"msg": response.json().get("msg", "Signup failed")}, response.status_code
        return response.json(), 200

async def login_user(email: str, password: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(SUPABASE_LOGIN_URL, json={"email": email, "password": password})
        if response.status_code != 200:
            return {"msg": response.json().get("msg", "Login failed")}, response.status_code
        return response.json(), 200