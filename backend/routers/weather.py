from fastapi import APIRouter, HTTPException, Query
import requests
import os
from datetime import datetime

router = APIRouter()

API_KEY = os.getenv("OPENWEATHERMAP_API_KEY", "e1ffa8c1b262cf030a36229de0ecb561")


def format_unix_timestamp(timestamp: int | None) -> str | None:
    if timestamp is None:
        return None
    return datetime.utcfromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S UTC")


@router.get("/")
def get_weather(
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    city: str | None = Query(None),
):
    if city:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    elif lat is not None and lon is not None:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    else:
        raise HTTPException(status_code=400, detail="Provide either city or lat and lon")

    response = requests.get(url)
    data = response.json()

    if response.status_code != 200:
        error_detail = data.get("message", "Weather API error")
        raise HTTPException(status_code=response.status_code, detail=f"Weather API error: {error_detail}")

    weather = data["weather"][0]
    main = data.get("main", {})
    wind = data.get("wind", {})
    clouds = data.get("clouds", {})
    sys = data.get("sys", {})

    return {
        "city": data.get("name"),
        "country": sys.get("country"),
        "temperature": main.get("temp"),
        "feels_like": main.get("feels_like"),
        "temp_min": main.get("temp_min"),
        "temp_max": main.get("temp_max"),
        "pressure": main.get("pressure"),
        "humidity": main.get("humidity"),
        "visibility": data.get("visibility"),
        "wind_speed": wind.get("speed"),
        "wind_deg": wind.get("deg"),
        "cloudiness": clouds.get("all"),
        "sunrise": format_unix_timestamp(sys.get("sunrise")),
        "sunset": format_unix_timestamp(sys.get("sunset")),
        "description": weather.get("description"),
        "icon": weather.get("icon"),
        "weather_id": weather.get("id"),
    }