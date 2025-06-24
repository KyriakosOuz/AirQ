# Project Architecture

```
+-- backend       # FastAPI application
|   +-- api       # REST endpoints
|   +-- core      # auth and config
|   +-- services  # forecasting and health logic
|   +-- db        # database models and utilities
|
+-- frontend      # React client
|   +-- src       # application code
|   +-- public    # static assets
|
+-- docker-compose.yml
```

The backend exposes a REST API for forecasts, model management, and user
profiles. The frontend consumes this API and presents dashboards and alerts.
