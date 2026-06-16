import paho.mqtt.client as mqtt
import json
import os
from datetime import datetime

from db.database import SessionLocal
from models.reading import SensorReading

MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))


def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker")
    client.subscribe("goSwim/pool/+/reading")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())

        pool_id = payload["pool_id"]
        ph = payload["ph"]
        tds = payload["tds"]

        db = SessionLocal()

        reading = SensorReading(
            time=datetime.utcnow(),
            pool_id=pool_id,
            ph=ph,
            tds=tds
        )

        db.add(reading)
        db.commit()

        db.close()

        print(f"Saved Reading -> Pool: {pool_id}, pH: {ph}, TDS: {tds}")

    except Exception as e:
        print("MQTT Error:", e)


async def start_mqtt_client():
    print("MQTT STARTING")
    
try:
    client = mqtt.Client()

    client.on_connect = on_connect
    client.on_message = on_message
    
    print("Connecting to broker...")

    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    
    print("Broker connection call successful")

    client.loop_start()
    
except Exception as e:
        print("MQTT CONNECTION ERROR:", e)