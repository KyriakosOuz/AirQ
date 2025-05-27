import os
import httpx
import json
from dotenv import load_dotenv
from utils.helpers import get_risk_level_from_category
from utils.helpers import setup_logger

load_dotenv()
logger = setup_logger(__name__)

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

async def generate_health_tip(region, pollutant, forecast_list, profile):
    forecast_text = "\n".join([
        f"{row['ds']}: {round(row['yhat'], 1)} μg/m³ ({row['category']})"
        for row in forecast_list
    ])

    profile_summary = (
        f"- Asthma: {profile.get('has_asthma', False)}\n"
        f"- Heart Disease: {profile.get('has_heart_disease', False)}\n"
        f"- Smoker: {profile.get('is_smoker', False)}\n"
        f"- Diabetes: {profile.get('has_diabetes', False)}\n"
        f"- Lung Disease: {profile.get('has_lung_disease', False)}"
        if profile else "Not provided"
    )

    pollutant_label = "combined pollution index" if pollutant.lower() == "pollution" else pollutant

    prompt = f"""
You are a public health advisor generating user-friendly air quality health tips for citizens in {region}, Greece.

**Context**:
- **Pollutant of concern**: {pollutant_label}
- **Forecasted air quality** (dates and AQI categories):
{forecast_text}

**User health profile**:
{profile_summary}

Based on the air pollution levels and the user's health conditions, write **2–5 concise, friendly health recommendations**.

🟣 Format your reply as a **numbered list**.  
🎯 Keep each item on its own line.  
💬 Start each item with a **bold action verb** (e.g., "**Limit**", "**Avoid**", "**Stay hydrated**").

❌ Do not use emojis or decorative characters.  
✅ Keep the tone helpful, clean, and informative.

Example output:
1. **Limit outdoor activity** during days with poor air quality.
2. **Wear a mask** if pollution levels are high and you're in a crowded area.
3. **Stay hydrated** to support respiratory health.

Only return the list — no introduction or conclusion.
"""

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "model": "mistral-tiny",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(MISTRAL_URL, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            try:
                response_text = data["choices"][0]["message"]["content"]
            except (KeyError, IndexError, TypeError) as e:
                logger.warning(f"⚠️ Unexpected Mistral response format: {data}")
                response_text = "Air quality health tips are temporarily unavailable."
    except Exception as e:
        print(f"⚠️ Mistral error: {e}")
        return {
            "tip": "Air quality data is currently unavailable. Consider staying indoors as a precaution.",
            "riskLevel": "Unknown",
            "personalized": bool(profile)
        }

    latest_cat = forecast_list[-1]["category"] if forecast_list else "Unknown"

    return {
        "tip": response_text.strip(),
        "riskLevel": get_risk_level_from_category(latest_cat),
        "personalized": bool(profile)
    }