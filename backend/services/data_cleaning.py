import pandas as pd

REQUIRED_COLUMNS = {"year", "region"}
POLLUTANT_COLUMNS = {"NO2", "SO2", "O3"}

def validate_dataset_columns(df: pd.DataFrame) -> list[str]:
    """Returns list of missing required columns (if any)."""
    missing = []
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            missing.append(col)
    if not any(p in df.columns for p in POLLUTANT_COLUMNS):
        missing.append("At least one pollutant column (e.g., NO2, SO2, O3)")
    return missing

def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names to lowercase and replace spaces with underscores."""
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    return df

def normalize_pollutant_values(df: pd.DataFrame) -> pd.DataFrame:
    """Convert pollutant columns to numeric and handle missing/invalid values."""
    for pollutant in POLLUTANT_COLUMNS:
        if pollutant.lower() in df.columns:
            df[pollutant.lower()] = pd.to_numeric(df[pollutant.lower()], errors="coerce")
    return df

def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Full cleaning pipeline."""
    df = normalize_column_names(df)
    df = normalize_pollutant_values(df)
    df = df.dropna(subset=["year"])
    df["year"] = df["year"].astype(int)
    return df

def get_available_pollutants(df: pd.DataFrame) -> list[str]:
    """Return list of present pollutant columns."""
    present = []
    for p in POLLUTANT_COLUMNS:
        if p.lower() in df.columns:
            present.append(p.upper())
    return present
