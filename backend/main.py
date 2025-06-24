from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer
from api import (
    endpoints_users,
    endpoints_models,
    endpoints_predictions,
    endpoints_suggestions,
    endpoints_insights,
    endpoints_datasets,
    endpoints_dashboard
)
from api.endpoints_public_data import router as metadata_router
from api.endpoints_alerts import router as alerts_router
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Air Quality App - Thessaloniki",
    version="0.1.0",
    root_path="/api"
)

# Optional: allow frontend requests during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://airq-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(endpoints_users.router, prefix="/users", tags=["Users"])
app.include_router(endpoints_models.router, prefix="/models", tags=["Models"])
app.include_router(endpoints_datasets.router, prefix="/datasets", tags=["Datasets"])
app.include_router(endpoints_predictions.router, prefix="/predictions", tags=["Predictions"])
app.include_router(endpoints_suggestions.router, prefix="/suggestions", tags=["Tips & Suggestions"])
app.include_router(endpoints_insights.router, prefix="/insights", tags=["Insights"])
app.include_router(endpoints_dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(metadata_router, prefix="/metadata", tags=["Metadata"])
app.include_router(alerts_router, prefix="/alerts", tags=["AQI Alerts"])

# Inject security scheme into OpenAPI
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description="API for the Air Quality project using Supabase JWT",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

@app.get("/")
def root():
    return {"message": "AirQ backend is running. Visit /docs for API documentation."}

app.openapi = custom_openapi
