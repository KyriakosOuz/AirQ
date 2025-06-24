-- Postgres schema for ThessAir
-- Run this to recreate the tables used by the backend

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    health_profile JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region TEXT NOT NULL,
    pollutant TEXT,
    year INTEGER,
    filename TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES datasets(id),
    model_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    trained_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES models(id),
    date_range TEXT NOT NULL,
    forecast_json JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    prediction_id UUID REFERENCES predictions(id),
    suggestion TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE aqi_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    region TEXT NOT NULL,
    pollutant TEXT NOT NULL,
    threshold TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
