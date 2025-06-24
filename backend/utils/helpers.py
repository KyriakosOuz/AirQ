import httpx
from supabase import create_client
import os
from dotenv import load_dotenv
from io import BytesIO
# import httpx  # duplicate import
from core.config import settings
import logging

load_dotenv()
logger = logging.getLogger(__name__)
    
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger

async def upload_to_supabase_storage(data: bytes, filename: str, bucket: str, token: str, overwrite: bool = True):
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{filename}"
        if overwrite:
            url += "?upsert=true"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, content=data, headers=headers)

        if response.status_code in (200, 201):
            logger.info(f"✅ Uploaded {filename} to Supabase bucket '{bucket}'")
            return {"success": True, "status": response.status_code}
        else:
            logger.error(f"❌ Upload failed: {response.status_code} - {response.text}")
            return {"success": False, "status": response.status_code, "error": response.text}

    except Exception as e:
        logger.exception(f"❌ Exception during upload: {e}")
        return {"success": False, "error": str(e)}

async def download_from_supabase_storage(filename: str, bucket: str) -> BytesIO:
    # Compose public download URL
    url = f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{filename}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
    
    if response.status_code != 200:
        raise Exception(f"❌ Failed to fetch '{filename}' from bucket '{bucket}': {response.status_code} - {response.text}")

    return BytesIO(response.content)

async def delete_from_supabase_storage(filename: str, bucket: str = "datasets") -> None:
    supabase_admin = create_client(settings.supabase_url, settings.supabase_service_key)

    response = supabase_admin.storage.from_(bucket).remove([filename])
    
    if hasattr(response, "error") and response.error:
        raise RuntimeError(f"Failed to delete {filename} from Supabase: {response['error']['message']}")


AQI_CATEGORIES_ORDER = [
    "Good",
    "Moderate",
    "Unhealthy for Sensitive Groups",
    "Unhealthy",
    "Very Unhealthy"
]

def is_threshold_exceeded(current_category: str, user_threshold: str) -> bool:
    try:
        return AQI_CATEGORIES_ORDER.index(current_category) >= AQI_CATEGORIES_ORDER.index(user_threshold)
    except ValueError:
        return False

POLLUTANT_MAP = {
    "NO2_CONC": "NO2",
    "O3_CONC": "O3",
    "SO2_CONC": "SO2",
    "CO_CONC": "CO",
    "NO_CONC": "NO",
    "POLLUTION": "POLLUTION"
}

def get_aqi_category(pollutant: str, value: float) -> str:
    """
    Maps a pollutant concentration to an AQI category.
    Based on simplified WHO / EU thresholds.
    """
    pollutant = pollutant.strip().upper()
    pollutant = POLLUTANT_MAP.get(pollutant, pollutant)

    thresholds = {
        "NO2": [
            (20, "Good"),
            (40, "Moderate"),
            (80, "Unhealthy for Sensitive Groups"),
            (120, "Unhealthy"),
            (float("inf"), "Very Unhealthy")
        ],
        "O3": [
            (60, "Good"),
            (100, "Moderate"),
            (160, "Unhealthy for Sensitive Groups"),
            (200, "Unhealthy"),
            (float("inf"), "Very Unhealthy")
        ],
        "SO2": [
            (20, "Good"),
            (50, "Moderate"),
            (100, "Unhealthy for Sensitive Groups"),
            (150, "Unhealthy"),
            (float("inf"), "Very Unhealthy")
        ],
        "CO": [
            (3, "Good"),
            (6, "Moderate"),
            (10, "Unhealthy for Sensitive Groups"),
            (15, "Unhealthy"),
            (float("inf"), "Very Unhealthy")
        ],
        "NO": [
            (25, "Good"),
            (50, "Moderate"),
            (100, "Unhealthy for Sensitive Groups"),
            (150, "Unhealthy"),
            (float("inf"), "Very Unhealthy")
        ],
        "POLLUTION": [
            (20, "Good"),
            (40, "Moderate"),
            (70, "Unhealthy for Sensitive Groups"),
            (100, "Unhealthy"),
            (float("inf"), "Very Unhealthy")
        ]
    }
    for limit, category in thresholds.get(pollutant, []):
            if value <= limit:
                return category
            
    return "Unknown"
        
def get_risk_level_from_category(category: str) -> str:
    """
    Maps AQI category to generalized risk level for health advice.
    """
    category = category.lower()
    if category == "good":
        return "Low"
    elif category == "moderate":
        return "Low"
    elif category == "unhealthy for sensitive groups":
        return "Moderate"
    elif category == "unhealthy":
        return "High"
    elif category == "very unhealthy":
        return "Severe"
    return "Unknown"

