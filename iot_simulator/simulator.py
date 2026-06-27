import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 8883

# Pool IDs for demo
POOL_IDS = ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]

def generate_reading():
    # Realistic ranges
    ph = round(random.uniform(6.8, 8.2), 1)
    chlorine_ppm = round(random.uniform(0.3, 4.5), 1)
    temperature_c = round(random.uniform(24, 34), 1)
    turbidity_ntu = round(random.uniform(0.1, 3.0), 1)

    # Occasionally bad reading
    if random.random() < 0.1:  # 10% chance
        chlorine_ppm = round(random.uniform(0.1, 0.4), 1)  # Low chlorine

    return {
        "pool_id": random.choice(POOL_IDS),
        "device_id": "660e8400-e29b-41d4-a716-446655440000",  # Fake device ID
        "ph": ph,
        "chlorine_ppm": chlorine_ppm,
        "temperature_c": temperature_c,
        "turbidity_ntu": turbidity_ntu,
        "timestamp": datetime.now().isoformat() + "Z"
    }

def on_connect(client, userdata, flags, rc):
    print("Simulator connected to MQTT broker")

client = mqtt.Client()
client.on_connect = on_connect
client.tls_set()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()

while True:
    reading = generate_reading()
    topic = f"goSwim/pool/{reading['pool_id']}/reading"
    client.publish(topic, json.dumps(reading))
    print(f"Published: {reading}")
    time.sleep(30)  # Every 30 seconds