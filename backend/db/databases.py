from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv
import os

load_dotenv()

# Fetch individual env vars
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("PASSWORD")
HOST = os.getenv("HOST")
PORT = os.getenv("PORT")
DBNAME = os.getenv("DBNAME")
print("🧪 DEBUG ENV VALUES")
print("USER:", USER)
print("PASSWORD (quoted):", PASSWORD)
print("HOST:", HOST)
print("PORT:", PORT)
print("DBNAME:", DBNAME)


# Construct full SQLAlchemy URL (with SSL required)
DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

engine = create_engine(DATABASE_URL, poolclass=NullPool)
print("DATABASE_URL (masked):", DATABASE_URL.replace(PASSWORD, "*****"))
# Optional: Test connection (remove in production)
try:
    with engine.connect() as connection:
        print("✅ DB connection successful!")
except Exception as e:
    print(f"❌ Failed to connect: {e}")