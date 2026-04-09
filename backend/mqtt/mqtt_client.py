import paho.mqtt.client as mqtt
import json
import os
from datetime import datetime
from db.database import SessionLocal
from models.reading import SensorReading
from models.device import IoTDevice
from models.pool import Pool
from utils.scoring import calculate_score
from websocket.manager import manager

MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", 8883))

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker")
    client.subscribe("goswim/pool/+/reading")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        pool_id = payload["pool_id"]
        device_id = payload.get("device_id")
        ph = payload["ph"]
        chlorine_ppm = payload["chlorine_ppm"]
        temperature_c = payload["temperature_c"]
        turbidity_ntu = payload["turbidity_ntu"]
        timestamp = datetime.fromisoformat(payload["timestamp"])

        db = SessionLocal()
        # Validate device
        device = db.query(IoTDevice).filter(IoTDevice.id == device_id, IoTDevice.is_active == True).first()
        if not device:
            print(f"Invalid device: {device_id}")
            db.close()
            return

        # Calculate score
        score = calculate_score(ph, chlorine_ppm, turbidity_ntu, temperature_c)

        # Insert reading
        reading = SensorReading(
            time=timestamp,
            pool_id=pool_id,
            device_id=device_id,
            ph=ph,
            chlorine_ppm=chlorine_ppm,
            temperature_c=temperature_c,
            turbidity_ntu=turbidity_ntu,
            cleanliness_score=score
        )
        db.add(reading)

        # Update pool score
        pool = db.query(Pool).filter(Pool.id == pool_id).first()
        if pool:
            pool.cleanliness_score = score  # type: ignore

        # Update device last_seen
        device.last_seen = timestamp  # type: ignore

        db.commit()

        # Broadcast to WebSocket
        message = {
            "type": "new_reading",
            "pool_id": pool_id,
            "ph": ph,
            "chlorine_ppm": chlorine_ppm,
            "temperature_c": temperature_c,
            "turbidity_ntu": turbidity_ntu,
            "cleanliness_score": score,
            "timestamp": timestamp.isoformat()
        }
        import asyncio
        asyncio.run(manager.broadcast(pool_id, message))

        db.close()
        print(f"Processed reading for pool {pool_id}")
    except Exception as e:
        print(f"Error processing message: {e}")

async def start_mqtt_client():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.tls_set()  # For TLS
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()