import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_mistral_suggestion():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/suggestions/tip/", params={
            "region": "Thermi",
            "pollutant": "NO2"
        }, headers={"Authorization": "Bearer test_token"})

    assert response.status_code in [200, 400]
    if response.status_code == 200:
        assert "advice" in response.json()
