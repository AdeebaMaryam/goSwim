import os
from datetime import datetime, timedelta
from db.database import SessionLocal, engine, Base
from models.user import User
from models.pool import Pool
from models.device import IoTDevice
from models.reading import SensorReading
from utils.security import get_password_hash
from utils.scoring import calculate_score
import random

Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()

    # Create demo owners
    owners = []
    for i in range(1, 4):
        owner = User(
            name=f"Demo Owner {i}",
            email=f"owner{i}@demo.com",
            password_hash=get_password_hash("demo123"),
            role="owner"
        )
        db.add(owner)
        owners.append(owner)

    db.commit()

    # Create demo pools
    pools_data = [
        {
            "name": "Crystal Clear Pool",
            "address": "MG Road, Nellore",
            "city": "Nellore",
            "latitude": 14.4426,
            "longitude": 79.9865,
            "pool_type": "outdoor",
            "capacity": 200,
            "length_meters": 25,
            "entry_fee": 100,
            "amenities": ["Changing rooms", "Showers", "Parking"]
        },
        {
            "name": "Aqua Paradise",
            "address": "Brundavan Gardens, Nellore",
            "city": "Nellore",
            "latitude": 14.4526,
            "longitude": 79.9965,
            "pool_type": "indoor",
            "capacity": 150,
            "length_meters": 20,
            "entry_fee": 150,
            "amenities": ["Sauna", "Gym", "Cafeteria"]
        },
        {
            "name": "Blue Wave Resort",
            "address": "Beach Road, Nellore",
            "city": "Nellore",
            "latitude": 14.4326,
            "longitude": 79.9765,
            "pool_type": "outdoor",
            "capacity": 300,
            "length_meters": 30,
            "entry_fee": 200,
            "amenities": ["Bar", "Restaurant", "Kids area"]
        }
    ]

    pools = []
    for i, pool_data in enumerate(pools_data):
        pool = Pool(**pool_data, owner_id=owners[i].id)
        db.add(pool)
        pools.append(pool)

    db.commit()

    # Create IoT devices
    devices = []
    for i, pool in enumerate(pools):
        device = IoTDevice(
            pool_id=pool.id,
            device_name=f"ESP32-{i+1}",
            device_type="esp32",
            mqtt_topic=f"goswim/pool/{pool.id}/reading",
            is_active=True
        )
        db.add(device)
        devices.append(device)

    db.commit()

    # Generate historical readings (7 days)
    for pool in pools:
        base_time = datetime.utcnow() - timedelta(days=7)
        for hour in range(7 * 24):
            time = base_time + timedelta(hours=hour)

            # Generate realistic readings with some variation
            ph = round(random.uniform(7.0, 7.8), 1)
            chlorine = round(random.uniform(0.8, 3.5), 1)
            temp = round(random.uniform(25, 32), 1)
            turbidity = round(random.uniform(0.1, 1.5), 1)

            score = calculate_score(ph, chlorine, turbidity, temp)

            reading = SensorReading(
                time=time,
                pool_id=pool.id,
                device_id=devices[pools.index(pool)].id,
                ph=ph,
                chlorine_ppm=chlorine,
                temperature_c=temp,
                turbidity_ntu=turbidity,
                cleanliness_score=score
            )
            db.add(reading)

    db.commit()
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()