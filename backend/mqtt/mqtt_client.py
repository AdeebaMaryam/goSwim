import json
import os
import asyncio
from datetime import datetime
from websocket.manager import manager
import asyncio
import paho.mqtt.client as mqtt

from db.database import SessionLocal
from models.pool import Pool
from models.reading import SensorReading
from utils.scoring import calculate_score
import uuid

MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))


# -----------------------------
# MQTT Connected
# -----------------------------
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker")
        client.subscribe("goSwim/pool/+/reading")
    else:
        print("MQTT Connection Failed:", rc)


# -----------------------------
# Message Received
# -----------------------------
def on_message(client, userdata, msg):
    db = SessionLocal()

    try:
        payload = json.loads(msg.payload.decode())

        pool_id = payload["pool_id"]
        ph = float(payload["ph"])
        tds = float(payload["tds"])
        temperature = float(payload["temperature"])

        # Calculate Water Quality Score
        score = calculate_score(ph, tds, temperature)

        # Save Reading
        reading = SensorReading(
            time=datetime.now(),
            pool_id=pool_id,
            ph=ph,
            tds=tds,
            temperature=temperature,
            cleanliness_score=score
        )

        db.add(reading)

        # Update Pool Score
        pool = db.query(Pool).filter(
            Pool.id == uuid.UUID(pool_id)
        ).first()
        
        if pool:
            pool.cleanliness_score = score
        
        db.commit()
        
        asyncio.create_task(
            manager.broadcast(
                pool_id,
                {
                    "ph": ph,
                    "tds": tds,
                    "temperature": temperature,
                    "cleanliness_score": score,
                    "time": str(datetime.now())
                }
            )
        )

        print("===================================")
        print("New Sensor Reading Saved")
        print(f"Pool ID      : {pool_id}")
        print(f"pH           : {ph}")
        print(f"TDS          : {tds}")
        print(f"Temperature  : {temperature} °C")
        print(f"Score        : {score}/100")
        print("===================================")

    except Exception as e:
        db.rollback()
        print("MQTT ERROR:", e)

    finally:
        db.close()


# -----------------------------
# Start MQTT Client
# -----------------------------
async def start_mqtt_client():

    print("Starting MQTT Client...")

    client = mqtt.Client()

    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()

        print("MQTT Client Started Successfully")

    except Exception as e:
        print("MQTT CONNECTION ERROR:", e)