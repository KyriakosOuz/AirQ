from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import List
from fastapi import Query
from core.auth import get_current_user_id
from services.data_upload import (
    upload_dataset_to_supabase,
    list_uploaded_datasets,
    preview_dataset_contents,
    delete_dataset_by_id,
)
from schemas.insights import DatasetOut
from utils.helpers import setup_logger
from sqlalchemy import text
from db.databases import engine


router = APIRouter()
logger = setup_logger(__name__)

@router.post("/upload/")
async def upload_dataset(
    file: UploadFile = File(...),
    region: str = Form(...),
    year: int = Form(...),
    user=Depends(get_current_user_id),
):
    logger.info(f"📤 Upload attempt by user {user['user_id']} for region={region}, year={year}")
    logger.info(f"📤 File: {file.filename}")

    if user["role"] != "admin":
        logger.warning("❌ Unauthorized dataset upload attempt")
        raise HTTPException(status_code=403, detail="Only admins can upload datasets.")

    try:
        contents = await file.read()
        logger.info(f"📦 File size: {len(contents)} bytes")
        file.file.seek(0)

        dataset_metadata = await upload_dataset_to_supabase(file, region, year, user["user_id"], user["token"])
        logger.info(f"✅ Dataset uploaded successfully: {dataset_metadata['id']}")
        return JSONResponse(content={"message": "Dataset uploaded successfully", "dataset": dataset_metadata})
    except HTTPException as he:
        logger.error(f"❌ Upload failed (HTTPException): {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"❌ Upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Dataset upload failed.")


@router.get("/list/", response_model=List[DatasetOut])
async def list_datasets(user=Depends(get_current_user_id)):
    logger.info(f"📂 Listing datasets for user {user['user_id']}")
    if user["role"] != "admin":
        logger.warning("❌ Unauthorized dataset listing attempt")
        raise HTTPException(status_code=403, detail="Only admins can view datasets.")
    
    datasets = await list_uploaded_datasets()
    logger.info(f"✅ {len(datasets)} datasets returned")
    return datasets


@router.get("/preview/{dataset_id}")
async def preview_dataset(dataset_id: str, user=Depends(get_current_user_id)):
    logger.info(f"🔍 Preview requested for dataset {dataset_id} by user {user['user_id']}")
    try:
        preview = await preview_dataset_contents(dataset_id)
        logger.info("✅ Dataset preview returned")
        return preview
    except Exception as e:
        logger.error(f"❌ Failed to preview dataset {dataset_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to preview dataset")


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str, user=Depends(get_current_user_id)):
    logger.info(f"🗑️ Deletion requested for dataset {dataset_id} by user {user['user_id']}")
    if user["role"] != "admin":
        logger.warning("❌ Unauthorized deletion attempt")
        raise HTTPException(status_code=403, detail="Only admins can delete datasets.")

    try:
        await delete_dataset_by_id(dataset_id)
        logger.info("✅ Dataset deleted successfully")
        return {"message": f"Dataset {dataset_id} deleted."}
    except Exception as e:
        logger.error(f"❌ Failed to delete dataset {dataset_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete dataset")
    
@router.get("/check-availability/")
async def check_dataset_available(region: str):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) AS count FROM datasets WHERE region = :region
        """), {"region": region})
        row = result.mappings().fetchone()
        count = row["count"] if row else 0
    return {"available": count > 0}
