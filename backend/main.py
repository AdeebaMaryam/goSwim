import asyncio
import os
from pathlib import Path


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
        if key and key not in os.environ:
            os.environ[key] = value


load_local_env()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from routers import auth, pools, readings, devices, weather, bookings, payments, chat, notifications, external_pools
from db.database import engine, Base
from mqtt.mqtt_client import start_mqtt_client
from websocket.manager import manager

Base.metadata.create_all(bind=engine)

try:
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        connection.execute(text("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'cod'"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)"))
        connection.execute(text("ALTER TABLE pools ADD COLUMN IF NOT EXISTS opening_time VARCHAR(10) DEFAULT '06:00'"))
        connection.execute(text("ALTER TABLE pools ADD COLUMN IF NOT EXISTS closing_time VARCHAR(10) DEFAULT '21:00'"))
except Exception:
    pass

app = FastAPI(title="goSwim API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(pools.router, prefix="/pools", tags=["pools"])
app.include_router(readings.router, prefix="/readings", tags=["readings"])
app.include_router(devices.router, prefix="/devices", tags=["devices"])
app.include_router(weather.router, prefix="/weather", tags=["weather"])
app.include_router(bookings.router, tags=["bookings"])
app.include_router(payments.router, tags=["payments"])
app.include_router(chat.router, tags=["chat"])
app.include_router(notifications.router, tags=["notifications"])
app.include_router(external_pools.router, tags=["external-pools"])

@app.on_event("startup")
async def startup_event():
    # Start MQTT client in background
    asyncio.create_task(start_mqtt_client())

@app.get("/")
def read_root():
    return {"message": "Welcome to goSwim API"}

# WebSocket endpoint
from fastapi import WebSocket
@app.websocket("/ws/{pool_id}")
async def websocket_endpoint(websocket: WebSocket, pool_id: str):
    await manager.connect(websocket, pool_id)
    try:
        while True:
            data = await websocket.receive_text()
            # For now, just keep alive
    except Exception:
        manager.disconnect(websocket, pool_id)
