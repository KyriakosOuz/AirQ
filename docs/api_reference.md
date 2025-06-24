📄 api_reference.md – Air Quality App Backend
Last updated: 2025-05-01
Auth: All routes require a Bearer <JWT> token in the Authorization header (from Supabase Auth)

🔐 Authentication
Supabase Login
POST https://<your-supabase-url>.supabase.co/auth/v1/token?grant_type=password
Body (JSON):
{
  "email": "user@example.com",
  "password": "your-password"
}
Returns:

access_token (used for all authenticated endpoints)

👤 Users
GET /users/profile/
Get the current user’s health profile
Response:
{
  "user_id": "...",
  "has_asthma": true,
  "is_smoker": false,
  "has_heart_disease": false
}
POST /users/profile/
Create or update health profile
Body (Form or JSON):
{
  "has_asthma": true,
  "is_smoker": false,
  "has_heart_disease": true
}
GET /users/risk-timeline/
Returns personalized air quality risk timeline
Query Params:

region: e.g. Thermi

pollutant: e.g. NO2

Returns:
[
  {
    "ds": "2025-12-31",
    "yhat": 83.2,
    "category": "Unhealthy for Sensitive Groups",
    "risk_score": 3
  },
  ...
]
📁 Datasets
POST /datasets/upload/
Admin-only. Upload a dataset CSV to Supabase
FormData:

file: CSV file

region: e.g. Thermi

🤖 Model Training
POST /models/train/
Trains a Prophet model
Query Params:

region: e.g. Thermi

pollutant: e.g. NO2

Returns:
{
  "message": "Model trained for Thermi - NO2",
  "forecast": [
    {
      "ds": "2025-12-31",
      "yhat": 59.8,
      "yhat_lower": 50.1,
      "yhat_upper": 70.5
    }
  ]
}
📊 Forecasts & Comparisons
GET /predictions/forecast/
Returns the next 3 years of pollutant forecast
Query Params:

region

pollutant

Returns:
[
  {
    "ds": "2025-12-31",
    "yhat": 48.2,
    "category": "Good"
  }
]
POST /predictions/compare/
Compares multiple regions for one pollutant
Query Params:

pollutant

regions (repeatable): e.g. regions=Thermi&regions=Kalamaria

Returns:
{
  "pollutant": "NO2",
  "comparison": [
    {
      "region": "Thermi",
      "forecast": [...]
    },
    ...
  ]
}
💡 Suggestions (Mistral AI)
GET /suggestions/tip/
Returns 2–3 public health tips using Mistral AI
Query Params:

region

pollutant

include_profile=true|false (default true)

Returns:
{
  "region": "Thermi",
  "pollutant": "NO2",
  "advice": "Avoid exercising outdoors when NO2 levels are high..."
}
🔐 Authorization Header Format
Authorization: Bearer <your-access-token>