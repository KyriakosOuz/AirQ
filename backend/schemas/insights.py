from pydantic import BaseModel
from typing import List, Dict, Union, Optional
from datetime import datetime

class DatasetOut(BaseModel):
    id: str
    region: str
    pollutant: Optional[str]
    year: int
    filename: str
    uploaded_by: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

class TrendItem(BaseModel):
    year: int
    yhat: float
    delta: float
    
class TrendMeta(BaseModel):
    type: str
    region: str
    pollutant: str

class TrendData(BaseModel):
    labels: List[str]
    values: List[float]
    deltas: List[float]
    unit: str
    meta: TrendMeta

class TrendResponse(BaseModel):
    region: str
    pollutant: str
    trend: TrendData
    
class DailyTrendData(BaseModel):
    labels: List[str]
    values: List[float]
    unit: str
    meta: Dict[str, Union[str, int]]

class DailyTrendResponse(BaseModel):
    region: str
    pollutant: str
    trend: DailyTrendData

class TopRegionItem(BaseModel):
    region: str
    average: float

class TopPollutedResponse(BaseModel):
    year: int
    pollutant: str
    top_regions: List[TopRegionItem]

class SeasonalityMeta(BaseModel):
    type: str
    region: str
    pollutant: str

class SeasonalityData(BaseModel):
    labels: List[str]
    values: List[float]
    unit: str
    meta: SeasonalityMeta

class SeasonalityResponse(BaseModel):
    region: str
    pollutant: str
    seasonal_avg: SeasonalityData

class FullSummaryResponse(BaseModel):
    region: str
    pollutant: str
    summary: Dict[str, Union[List[TrendItem], List[TopRegionItem], Dict[str, float]]]

class HistoricalDataResponse(BaseModel):
    region: str
    year: int
    data: List[Dict[str, Union[str, float]]]
    
class PersonalizedInsightItem(BaseModel):
    year: int
    value: float
    delta: Optional[float]
    adjusted_value: Optional[float]

class PersonalizedInsightResponse(BaseModel):
    region: str
    pollutant: str
    profile_adjusted_insights: List[PersonalizedInsightItem]

class MonthlyForecastItem(BaseModel):
    month: str
    value: float
    category: str

class MonthlyForecastResponse(BaseModel):
    region: str
    pollutant: str
    monthly_forecast: List[MonthlyForecastItem]

class AQISubscriptionIn(BaseModel):
    region: str
    pollutant: str
    threshold: str

class AQISubscriptionOut(AQISubscriptionIn):
    id: str
    created_at: datetime
