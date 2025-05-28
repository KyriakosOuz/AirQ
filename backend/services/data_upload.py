import csv
import os
import uuid
from fastapi import UploadFile, HTTPException
from db.databases import engine
from sqlalchemy import text
from utils.helpers import upload_to_supabase_storage, download_from_supabase_storage, delete_from_supabase_storage
import pandas as pd
import numpy as np
from utils.helpers import setup_logger
from services.insights import POLLUTANTS

DATASET_BUCKET = "datasets"
logger = setup_logger(__name__)

async def upload_dataset_to_supabase(file: UploadFile, region: str, year: int, uploaded_by: str, token: str):
    dataset_id = str(uuid.uuid4())
    filename = f"{region.lower().replace(' ', '_')}_{year}_{dataset_id}.csv"

    contents = await file.read()
    await upload_to_supabase_storage(
        data=contents,
        filename=filename,
        bucket=DATASET_BUCKET,
        token=token
    )

    df = pd.read_csv(pd.io.common.BytesIO(contents))
    available_pollutants = [p for p in POLLUTANTS if p in df.columns]

    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO datasets (id, filename, file_path, region, year, uploaded_by, available_pollutants)
            VALUES (:id, :filename, :file_path, :region, :year, :uploaded_by, :available_pollutants)
        """), {
            "id": dataset_id,
            "filename": filename,
            "file_path": filename,
            "region": region,
            "year": year,
            "uploaded_by": uploaded_by,
            "available_pollutants": available_pollutants
        })
        logger.info(f"✅ Inserted dataset {dataset_id} into DB with available pollutants: {available_pollutants}")

    return {
        "id": dataset_id,
        "region": region,
        "year": year,
        "filename": filename,
        "available_pollutants": available_pollutants
    }

async def list_uploaded_datasets():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM public.datasets ORDER BY created_at DESC"))
        datasets = []
        for row in result.fetchall():
            data = dict(row._mapping)
            # Convert UUIDs to strings for JSON serialization
            data["id"] = str(data["id"])
            if data.get("uploaded_by"):
                data["uploaded_by"] = str(data["uploaded_by"])
            datasets.append(data)
    return datasets


async def preview_dataset_contents(dataset_id: str):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT file_path FROM datasets WHERE id = :id
        """), {"id": dataset_id})
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found.")
        
        file_path = row._mapping.get("file_path")

    # Download file and preview first 5 rows
    file_content = await download_from_supabase_storage(file_path, bucket=DATASET_BUCKET)
    df = pd.read_csv(file_content)

    # Replace NaN/inf/-inf with None to make JSON-safe
    df = df.replace([np.nan, np.inf, -np.inf], None)

    return {
        "columns": list(df.columns),
        "preview": df.head(5).to_dict(orient="records")
    }


async def delete_dataset_by_id(dataset_id: str):
    # Delete from DB inside a transaction
    with engine.begin() as conn:
        result = conn.execute(text("""
            SELECT file_path FROM datasets WHERE id = :id
        """), {"id": dataset_id})
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found.")

        file_path = row._mapping.get("file_path")
        conn.execute(text("DELETE FROM datasets WHERE id = :id"), {"id": dataset_id})

    # Delete file from Supabase storage
    await delete_from_supabase_storage(file_path, bucket=DATASET_BUCKET)

    