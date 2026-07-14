import asyncio
import os
from pathlib import Path

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from db.database import engine, Base
from mqtt.mqtt_client import start_mqtt_client
from routers import auth, chat, pools, reading, weather, booking
from websocket.manager import manager


# -----------------------------
# Load .env file
# -----------------------------
def load_local_env():
    env_path = Path(__file__).resolve().parent / ".env"

    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)

        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key not in os.environ:
            os.environ[key] = value


load_local_env()


# -----------------------------
# Create database tables
# -----------------------------
Base.metadata.create_all(bind=engine)


# -----------------------------
# Add missing columns (only once)
# -----------------------------
try:
    with engine.connect().execution_options(
        isolation_level="AUTOCOMMIT"
    ) as connection:

        connection.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS phone VARCHAR(30)
                """
            )
        )

        connection.execute(
            text(
                """
                ALTER TABLE pools
                ADD COLUMN IF NOT EXISTS opening_time
                VARCHAR(10) DEFAULT '06:00'
                """
            )
        )

        connection.execute(
            text(
                """
                ALTER TABLE pools
                ADD COLUMN IF NOT EXISTS closing_time
                VARCHAR(10) DEFAULT '21:00'
                """
            )
        )

except Exception as e:
    print("Database update skipped:", e)


# -----------------------------
# Create FastAPI app
# -----------------------------
app = FastAPI(
    title="goSwim API",
    version="1.0.0"
)


# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://goswimmm.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Register Routers
# -----------------------------
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(pools.router, prefix="/pools", tags=["Pools"])
app.include_router(reading.router, prefix="/reading", tags=["Sensor Readings"])
app.include_router(weather.router, prefix="/weather", tags=["Weather"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(booking.router, prefix="/booking", tags=["Booking"])
# -----------------------------
# Startup Event
# -----------------------------
@app.on_event("startup")
async def startup_event():
    print("Starting goSwim API...")
    asyncio.create_task(start_mqtt_client())


# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
def home():
    return {
        "message": "Welcome to goSwim API"
    }


# -----------------------------
# WebSocket
# -----------------------------
@app.websocket("/ws/{pool_id}")
async def websocket_endpoint(websocket: WebSocket, pool_id: str):

    await manager.connect(websocket, pool_id)

    try:
        while True:
            await websocket.receive_text()

    except Exception:
        manager.disconnect(websocket, pool_id)