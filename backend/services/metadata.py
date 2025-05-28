from db.databases import engine
from sqlalchemy import text
from typing import List, Dict

# Optional: map pollutant codes to human-friendly labels
POLLUTANT_LABELS = {
    "NO2": "Nitrogen Dioxide (NO₂)",
    "O3": "Ozone (O₃)",
    "PM10": "Particulate Matter 10μm (PM10)",
    "PM2.5": "Particulate Matter 2.5μm (PM2.5)",
    "CO": "Carbon Monoxide (CO)",
    "SO2": "Sulfur Dioxide (SO₂)"
}

async def get_available_regions() -> List[Dict[str, str]]:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT DISTINCT region FROM datasets ORDER BY region"))
        regions = [row["region"] for row in result.fetchall()]
    return [{"value": r, "label": r} for r in regions]

async def get_available_pollutants() -> List[Dict[str, str]]:
    # Option A: static list (you can adjust based on your dataset schema)
    return [{"value": k, "label": v} for k, v in POLLUTANT_LABELS.items()]

    # Option B: dynamic from file (uncomment if you prefer to infer from datasets)
    # with engine.connect() as conn:
    #     result = conn.execute(text("SELECT filename FROM datasets ORDER BY created_at DESC LIMIT 1"))
    #     row = result.fetchone()
    # if not row:
    #     return []
    # from utils.helpers import download_from_supabase_storage
    # import pandas as pd
    # csv_bytes = await download_from_supabase_storage(row["filename"], bucket="datasets")
    # df = pd.read_csv(csv_bytes)
    # numeric_cols = df.select_dtypes(include=["float64", "int64"]).columns
    # return [{"value": col, "label": POLLUTANT_LABELS.get(col, col)} for col in numeric_cols if col not in ["year", "month"]]
