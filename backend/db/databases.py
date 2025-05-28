from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv
import urllib.parse
import os

load_dotenv()

# Fetch individual env vars
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("PASSWORD")
HOST = os.getenv("HOST")
PORT = os.getenv("DB_PORT", "6543")
DBNAME = os.getenv("DBNAME")

if USER and PASSWORD and HOST and DBNAME:
    encoded_password = urllib.parse.quote_plus(PASSWORD)
    DATABASE_URL = f"postgresql+psycopg2://{USER}:{encoded_password}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

    engine = create_engine(DATABASE_URL, poolclass=NullPool)

    # Optional test connection
    try:
        with engine.connect() as connection:
            print("✅ DB connection successful!")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")

else:
    raise EnvironmentError("❌ One or more DB environment variables are missing.")