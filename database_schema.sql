-- goSwim Database Schema

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('swimmer', 'owner')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pools table
CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  latitude FLOAT,
  longitude FLOAT,
  owner_id UUID REFERENCES users(id),
  pool_type VARCHAR(50),   -- 'indoor' or 'outdoor'
  capacity INT,
  length_meters INT,
  entry_fee INT,
  amenities TEXT[],
  is_open BOOLEAN DEFAULT true,
  cleanliness_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- iot_devices table
CREATE TABLE iot_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES pools(id),
  device_name VARCHAR(100),
  device_type VARCHAR(50),  -- 'esp32', 'waterguru', 'phin'
  mqtt_topic VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- sensor_readings table (TimescaleDB hypertable)
CREATE TABLE sensor_reading (
  time TIMESTAMPTZ NOT NULL,
  pool_id UUID NOT NULL,
  device_id UUID,
  ph FLOAT,
  chlorine_ppm FLOAT,
  temperature_c FLOAT,
  turbidity_ntu FLOAT,
  cleanliness_score FLOAT,
  PRIMARY KEY (time, pool_id)
);

-- Convert to hypertable
SELECT create_hypertable('sensor_reading', 'time');

-- alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES pools(id),
  alert_type VARCHAR(50),
  message TEXT,
  severity VARCHAR(20) CHECK (severity IN ('critical', 'warning', 'info')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);