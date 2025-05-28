from dotenv import load_dotenv
import os
from types import SimpleNamespace

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

SUPABASE_BUCKET_DATASETS = os.getenv("SUPABASE_BUCKET_DATASETS", "datasets")
SUPABASE_BUCKET_MODELS = os.getenv("SUPABASE_BUCKET_MODELS", "models")

DB_CONFIG = {
    "user": os.getenv("USER"),
    "password": os.getenv("PASSWORD"),
    "host": os.getenv("HOST"),
    "port": os.getenv("PORT"),
    "dbname": os.getenv("DBNAME"),
}

SQLALCHEMY_DATABASE_URL = os.getenv("SUPABASE_DB_URL")

settings = SimpleNamespace(
    supabase_url=SUPABASE_URL,
    supabase_key=SUPABASE_KEY,
    supabase_service_key=SUPABASE_SERVICE_KEY,
    supabase_jwt_secret=SUPABASE_JWT_SECRET,
    bucket_datasets=SUPABASE_BUCKET_DATASETS,
    bucket_models=SUPABASE_BUCKET_MODELS,
    db_url=SQLALCHEMY_DATABASE_URL
)