import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_forecast_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/predictions/forecast/", params={
            "region": "Kalamaria",
            "pollutant": "NO2"
        }, headers={"Authorization": "Bearer test_token"})
    
    assert response.status_code in [200, 404, 400]
    if response.status_code == 200:
        forecast = response.json()["forecast"]
        assert isinstance(forecast, list)
        for item in forecast:
            assert "ds" in item
            assert "yhat" in item
            assert "category" in item
