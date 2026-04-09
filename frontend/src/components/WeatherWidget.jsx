import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Eye, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const WeatherWidget = ({ city, latitude, longitude, useCurrentLocation = false, compact = false }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState({ latitude, longitude });

  useEffect(() => {
    if (!useCurrentLocation) {
      setCoords({ latitude, longitude });
      return;
    }

    if (!navigator.geolocation) {
      setCoords({ latitude: latitude || 17.3850, longitude: longitude || 78.4867 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => setCoords({ latitude: latitude || 17.3850, longitude: longitude || 78.4867 })
    );
  }, [useCurrentLocation, latitude, longitude]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const weatherLatitude = coords.latitude || 17.3850;
        const weatherLongitude = coords.longitude || 78.4867;
        // Using Open-Meteo free API (no key needed)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${weatherLatitude}&longitude=${weatherLongitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,weather_code&timezone=auto`
        );
        const data = await response.json();
        const current = data.current;

        setWeather({
          temperature: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          windSpeed: current.wind_speed_10m,
          weatherCode: current.weather_code,
          city: useCurrentLocation ? 'Your Location' : (city || 'Current Location')
        });
        setError(null);
      } catch (err) {
        setWeather(null);
        setError('Unable to load weather data');
      } finally {
        setLoading(false);
      }
    };

    if (coords.latitude && coords.longitude) {
      fetchWeather();
    }
  }, [city, coords, useCurrentLocation]);

  const getWeatherIcon = (code) => {
    if (!code) return <Cloud className="w-12 h-12 text-gray-400" />;
    // WMO Weather interpretation codes
    if (code === 0 || code === 1) return <Sun className="w-12 h-12 text-yellow-400" />;
    if (code === 2) return <Cloud className="w-12 h-12 text-gray-400" />;
    if (code === 3) return <Cloud className="w-12 h-12 text-gray-500" />;
    if (code >= 45 && code <= 82) return <CloudRain className="w-12 h-12 text-blue-400" />;
    return <Cloud className="w-12 h-12 text-gray-400" />;
  };

  const getSwimRecommendation = (temp, humidity, windSpeed, code) => {
    if (code >= 45 && code <= 82) {
      return {
        safe: false,
        message: '⚠️ Rainy conditions - Not safe for swimming',
        color: 'red'
      };
    }
    if (temp < 15) {
      return {
        safe: false,
        message: '❄️ Too cold - Not recommended',
        color: 'blue'
      };
    }
    if (temp >= 25 && temp <= 35 && humidity < 80) {
      return {
        safe: true,
        message: '✅ Perfect weather for swimming!',
        color: 'green'
      };
    }
    if (temp >= 20 && temp <= 28) {
      return {
        safe: true,
        message: '✅ Good conditions for swimming',
        color: 'green'
      };
    }
    if (temp > 35) {
      return {
        safe: false,
        message: '🔥 Extremely hot - Stay hydrated',
        color: 'orange'
      };
    }
    return {
      safe: true,
      message: '✅ Conditions are okay',
      color: 'green'
    };
  };

  if (error) {
    return (
      <motion.div
        className="bg-slate-900/50 backdrop-blur-sm border border-red-500/30 rounded-xl p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        className={`bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl animate-pulse ${compact ? 'w-44 h-16 p-3' : 'p-6 h-48'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
    );
  }

  if (!weather) return null;

  const recommendation = getSwimRecommendation(
    weather.temperature,
    weather.humidity,
    weather.windSpeed,
    weather.weatherCode
  );

  if (compact) {
    return (
      <motion.div
        className="bg-slate-900/70 border border-purple-500/20 rounded-lg px-4 py-3 min-w-44"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.weatherCode)}
          <div>
            <div className="text-white font-semibold">{weather.temperature}°C</div>
            <div className="text-gray-400 text-xs">{weather.city}</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-slate-900/50 backdrop-blur-lg border border-purple-500/20 rounded-xl p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Sun className="w-6 h-6 text-cyan-400" />
        Weather in {weather.city}
      </h3>

      <div className="space-y-6">
        {/* Main Weather Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {getWeatherIcon(weather.weatherCode)}
            </motion.div>
            <div>
              <div className="text-5xl font-bold text-white">
                {weather.temperature}°C
              </div>
              <div className="text-gray-300">
                Feels like {weather.feelsLike}°C
              </div>
            </div>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <Droplets className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-gray-400 text-sm">Humidity</div>
              <div className="text-white font-semibold">{weather.humidity}%</div>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <Wind className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-gray-400 text-sm">Wind Speed</div>
              <div className="text-white font-semibold">{weather.windSpeed.toFixed(1)} m/s</div>
            </div>
          </motion.div>
        </div>

        {/* Swim Recommendation */}
        <motion.div
          className={`p-4 rounded-lg border-2 ${
            recommendation.color === 'green'
              ? 'bg-green-500/10 border-green-500/30'
              : recommendation.color === 'red'
              ? 'bg-red-500/10 border-red-500/30'
              : recommendation.color === 'blue'
              ? 'bg-blue-500/10 border-blue-500/30'
              : 'bg-orange-500/10 border-orange-500/30'
          }`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className={`text-center font-semibold text-lg ${
            recommendation.color === 'green'
              ? 'text-green-300'
              : recommendation.color === 'red'
              ? 'text-red-300'
              : recommendation.color === 'blue'
              ? 'text-blue-300'
              : 'text-orange-300'
          }`}>
            {recommendation.message}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;
