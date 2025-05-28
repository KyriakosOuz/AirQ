from fastapi import APIRouter
from services.metadata import get_available_regions, get_available_pollutants
from typing import List, Dict
from utils.helpers import setup_logger

router = APIRouter(prefix="/metadata", tags=["Public Metadata"])
logger = setup_logger(__name__)

@router.get("/regions", response_model=List[Dict[str, str]])
async def list_regions():
    logger.info("🌍 Fetching available regions")
    regions = await get_available_regions()
    logger.info(f"✅ {len(regions)} regions returned")
    return regions

@router.get("/pollutants", response_model=List[Dict[str, str]])
async def list_pollutants():
    logger.info("🧪 Fetching available pollutants")
    pollutants = await get_available_pollutants()
    logger.info(f"✅ {len(pollutants)} pollutants returned")
    return pollutants
