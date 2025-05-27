# ThessAir: Air Quality Forecasting and Health Insights

ThessAir is a web application that predicts air pollution trends across Thessaloniki’s municipalities and provides personalized health insights. It supports both **administrative users** (for data/model management) and **citizens** (for forecasts and health alerts), using public open data.

---

## 📌 Overview

- Forecast air pollution using historical datasets.
- Train models by pollutant, frequency (daily/monthly/yearly), and region.
- Receive AI-generated health suggestions based on your profile.
- Subscribe to AQI alerts (e.g., when NO₂ exceeds “Unhealthy” levels).
- Analyze long-term pollutant trends and seasonality.

---

## 🧠 Technologies Used

### Backend
- **FastAPI** — Python web framework
- **Prophet** — Time-series forecasting (Facebook Research)
- **PostgreSQL** via Supabase
- **Supabase** — Authentication, storage, and database
- **Docker** — Containerized development and deployment
- **Pandas**, **Scikit-learn** — Data handling and metrics

### Frontend
- **React + TypeScript**
- **Vite** — Lightning-fast build tool
- **Tailwind CSS**, **shadcn/ui** — UI components and styles
- **TanStack Query** — React query management

---

## 🗂 ER Schema

Below is the core data schema that powers the backend logic.

![ER Diagram](supabase-schema-yhmwwpqvxhaljsqfxuqk%20(4).png)

Key tables:
- `users`: Authenticated users
- `profiles`: Health data (asthma, smoker, age, etc.)
- `datasets`: Uploaded datasets with region/pollutant metadata
- `models`: Trained forecasting models
- `predictions`: Prediction outputs
- `recommendations`: Health suggestions (AI generated)
- `aqi_subscriptions`: User alert settings

---

## 🔁 App Flow

### For Admins
1. Upload CSV datasets (region/year).
2. Train models using:
   - Region
   - Pollutant (e.g., NO₂, O₃)
   - Frequency (daily/monthly/yearly)
   - Forecast length
3. View model metrics (MAE, RMSE) and status.

### For Users
1. Login & complete your health profile.
2. Navigate the following features:
   - **Forecasts**: View model-based pollutant predictions.
   - **AQI Alerts**: Get notified if thresholds are exceeded.
   - **Insights**:
     - Yearly trends
     - Monthly seasonality
     - Top polluted areas
   - **Dashboard**: Latest AQI + personalized health risk
   - **Health Profile**: Update your health sensitivities

---

## 🗃 Data Source

All data is sourced from:

**Open Knowledge Foundation Greece (OKFN)**  
[https://okfn.gr/](https://okfn.gr/)

---

## ⚙️ Running Locally (with Docker)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/air-quality-app.git
cd air-quality-app
```

### 2. Configure `.env`

```env
SUPABASE_PROJECT_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-secret
SUPABASE_BUCKET_MODELS=models
SUPABASE_BUCKET_DATASETS=datasets
```

### 3. Build & run with Docker

```bash
docker-compose up --build
```

- Backend: [http://localhost:8000](http://localhost:8000)
- Frontend: [http://localhost:5173](http://localhost:5173)

---

## 🚀 Deployment

- Frontend can be deployed via **Vercel**, **Netlify**, or any static hosting platform.
- Backend can be deployed to **Railway**, **Fly.io**, **Render**, or your own VPS.
- Supabase handles authentication, file storage, and the PostgreSQL database.

---

## 🛠 Developer Info

- Add unit tests under `/test/` folder.
- All major backend logic lives under `/services/`.
- Supabase tables are mirrored in `/db/models.py`.

---

## 📚 Credits

This application uses publicly available air quality data provided by:

- **Open Knowledge Foundation Greece** — [https://okfn.gr](https://okfn.gr)

---

## 🤝 License

MIT License. See `LICENSE.md` for details.
