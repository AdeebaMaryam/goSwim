# goSwim

A comprehensive water quality monitoring platform for swimming pools using IoT sensors, real-time data, and interactive maps.

## Features

- **Real-time Water Quality Monitoring**: Live pH, chlorine, temperature, and turbidity readings
- **Interactive Pool Map**: Discover pools near you with quality ratings
- **IoT Integration**: MQTT-based sensor data collection from ESP32 devices
- **Cleanliness Scoring**: Algorithm-based pool safety assessment
- **Owner Dashboard**: Pool management and historical analytics
- **Weather Integration**: OpenWeatherMap API for local weather data
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Leaflet.js, Recharts
- **Backend**: Python FastAPI, PostgreSQL + TimescaleDB
- **Real-time**: WebSockets, MQTT (HiveMQ)
- **Auth**: JWT tokens
- **State Management**: Zustand

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+ with TimescaleDB extension
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd goSwim
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Install PostgreSQL and TimescaleDB
# Create database
createdb goswim
# Enable TimescaleDB extension
psql -d goswim -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
# Run schema creation (see database_schema.sql)
psql -d goswim -f database_schema.sql
```

### 4. Environment Variables

Copy `.env` files and update with your keys:

```bash
# Backend .env
DATABASE_URL=postgresql://user:pass@localhost:5432/goswim
SECRET_KEY=your-secure-jwt-secret
OPENWEATHERMAP_API_KEY=your-api-key

# Frontend .env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_WEATHER_KEY=your-api-key
```

### 5. Frontend Setup

```bash
cd ../frontend
npm install
```

### 6. Seed Database

Run the seed script to populate demo data:

```bash
cd ../backend
python seed_database.py
```

### 7. Run the Application

#### Backend
```bash
cd backend
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm run dev
```

#### IoT Simulator
```bash
cd iot_simulator
python simulator.py
```

### 8. Register an ESP32 Device

1. Flash ESP32 with MQTT client code
2. Configure MQTT broker: `broker.hivemq.com:8883`
3. Set topic: `goswim/pool/{pool_id}/reading`
4. Send JSON payload:
```json
{
  "pool_id": "uuid",
  "device_id": "uuid",
  "ph": 7.4,
  "chlorine_ppm": 1.8,
  "temperature_c": 28.1,
  "turbidity_ntu": 0.4,
  "timestamp": "2024-04-06T10:30:00Z"
}
```

## API Documentation

Once running, visit `http://localhost:8000/docs` for FastAPI interactive docs.

## Demo Accounts

- **Pool Owner**: owner1@demo.com / demo123
- **Swimmer**: swimmer@demo.com / demo123

## Project Structure

```
goswim/
├── frontend/          # React app
├── backend/           # FastAPI server
├── iot_simulator/     # Demo sensor simulator
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
