from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.linear_model import LinearRegression

DATA_PATH = Path(__file__).resolve().parent.parent / "house.csv"


class PredictionRequest(BaseModel):
    size: float = Field(gt=0, description="House size")
    rooms: int = Field(gt=0, description="Number of rooms")


class PredictionResponse(BaseModel):
    predicted_price: float


def load_training_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    data = pd.read_csv(DATA_PATH)
    required_columns = {"size", "rooms", "price"}
    if not required_columns.issubset(data.columns):
        raise ValueError("CSV must contain size, rooms, and price columns")
    return data


def train_model(data: pd.DataFrame) -> LinearRegression:
    features = data[["size", "rooms"]]
    target = data["price"]
    reg = LinearRegression()
    reg.fit(features, target)
    return reg


app = FastAPI(title="House Price Prediction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    df = load_training_data()
    model = train_model(df)
except Exception as exc:
    raise RuntimeError(f"Failed to initialize model: {exc}") from exc


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok", "records": int(len(df))}


@app.post("/api/predict", response_model=PredictionResponse)
def predict_price(payload: PredictionRequest) -> PredictionResponse:
    try:
        sample = pd.DataFrame([[payload.size, payload.rooms]], columns=["size", "rooms"])
        predicted_price = float(model.predict(sample)[0])
        return PredictionResponse(predicted_price=round(predicted_price, 2))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
