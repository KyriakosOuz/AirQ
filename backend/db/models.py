from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String)
    health_profile = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    datasets = relationship("Dataset", back_populates="uploaded_by_user")
    models = relationship("Model", back_populates="trained_by_user")
    recommendations = relationship("Recommendation", back_populates="user")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    region = Column(String, nullable=False)
    pollutant = Column(String)
    year = Column(Integer)
    filename = Column(Text, nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    uploaded_by_user = relationship("User", back_populates="datasets")
    models = relationship("Model", back_populates="dataset")

class Model(Base):
    __tablename__ = "models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"))
    model_type = Column(String, nullable=False)   # e.g., 'XGBoost'
    file_path = Column(Text, nullable=False)      # path to .pkl or .zip file
    trained_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    dataset = relationship("Dataset", back_populates="models")
    trained_by_user = relationship("User", back_populates="models")
    predictions = relationship("Prediction", back_populates="model")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id = Column(UUID(as_uuid=True), ForeignKey("models.id"))
    date_range = Column(String, nullable=False)   # e.g., '2024-06-01 to 2024-06-30'
    forecast_json = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    model = relationship("Model", back_populates="predictions")
    recommendations = relationship("Recommendation", back_populates="prediction")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    prediction_id = Column(UUID(as_uuid=True), ForeignKey("predictions.id"))
    suggestion = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="recommendations")
    prediction = relationship("Prediction", back_populates="recommendations")
    
class AQISubscription(Base):
    __tablename__ = "aqi_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    region = Column(String, nullable=False)
    pollutant = Column(String, nullable=False)
    threshold = Column(String, nullable=False)  # e.g., "Unhealthy", "Very Unhealthy"
    created_at = Column(DateTime, default=datetime.utcnow)