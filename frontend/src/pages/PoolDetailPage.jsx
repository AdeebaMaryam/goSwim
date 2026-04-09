import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Droplets, Users, Ruler, DollarSign, Zap, Heart, Share2, Navigation, Calendar, Mail } from 'lucide-react';
import { usePoolData } from '../hooks/usePoolData';
import { useWebSocket } from '../hooks/useWebSocket';
import WaterQualityMetrics from '../components/WaterQualityMetrics';
import TrendChart from '../components/TrendChart';
import IoTDeviceStatus from '../components/IoTDeviceStatus';
import LiveStatusBadge from '../components/LiveStatusBadge';
import WeatherWidget from '../components/WeatherWidget';
import ChatPanel from '../components/ChatPanel';
import { useFavoritePoolsStore } from '../store/useStore';

const PoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pool, loading, error } = usePoolData(id);
  const wsData = useWebSocket(id);
  const { toggleFavorite, isFavorite } = useFavoritePoolsStore();

  if (loading) return <div className="text-center py-20 text-white font-medium">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-400">Error: {error}</div>;
  if (!pool) return <div className="text-center py-20 text-white font-medium">Pool is not registered</div>;

  const currentData = wsData || pool;

  const handleGetDirections = () => {
    const mapsUrl = `https://www.google.com/maps/search/${pool.latitude},${pool.longitude}`;
    window.open(mapsUrl, '_blank');
  };

  const handleSharePool = () => {
    const text = `Check out ${pool.name}! 🏊\n\nCleanliness Score: ${currentData.cleanliness_score}/100\nEntry Fee: ₹${pool.entry_fee}\nLocation: ${pool.address}, ${pool.city}\n\nBook now on goSwim!`;

    if (navigator.share) {
      navigator.share({
        title: pool.name,
        text: text,
        url: window.location.href
      });
    } else {
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleBooking = () => {
    navigate(`/booking/${id}`);
  };

  const handleToggleFavorite = () => {
    if (pool) {
      toggleFavorite(pool);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          className="bg-slate-950/70 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                {pool.name}
              </h1>
              <div className="flex items-center text-white mb-4 font-medium">
                <MapPin className="w-5 h-5 mr-2 text-cyan-400" />
                <span>{pool.address}, {pool.city}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <LiveStatusBadge score={currentData.cleanliness_score} />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${pool.is_open ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                  {pool.is_open ? '🟢 Open' : '🔴 Closed'}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  IoT Verified
                </span>
              </div>
            </div>
            <motion.div
              className="text-right"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {currentData.cleanliness_score}
              </div>
              <div className="text-gray-100 font-medium">Cleanliness Score</div>
            </motion.div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <motion.button
              onClick={handleBooking}
              className="bg-gradient-to-r from-green-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Calendar className="w-5 h-5" />
              Book Now
            </motion.button>
            <motion.button
              onClick={handleToggleFavorite}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 border-2 ${
                isFavorite(pool.id)
                  ? 'bg-red-500/20 border-red-500/50 text-red-300'
                  : 'border-purple-500/30 text-purple-300 hover:bg-purple-500/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-5 h-5 ${isFavorite(pool.id) ? 'fill-current' : ''}`} />
              {isFavorite(pool.id) ? 'Saved' : 'Save'}
            </motion.button>
            <motion.button
              onClick={handleGetDirections}
              className="border-2 border-cyan-500/30 text-cyan-300 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-500/10 transition-all duration-300 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Navigation className="w-5 h-5" />
              Directions
            </motion.button>
            <motion.button
              onClick={handleSharePool}
              className="border-2 border-purple-500/30 text-purple-300 px-6 py-3 rounded-lg font-semibold hover:bg-purple-500/10 transition-all duration-300 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-5 h-5" />
              Share
            </motion.button>
          </div>
        </motion.div>

        {/* Live Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <WaterQualityMetrics data={currentData} />
        </motion.div>

        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <TrendChart poolId={id} />
        </motion.div>

        {/* Device Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <IoTDeviceStatus poolId={id} />
        </motion.div>

        {/* Pool Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 mt-8">
          <motion.div
            className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-400" />
              Pool Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-purple-500/10">
                <span className="text-gray-100 flex items-center gap-2 font-medium">
                  <Users className="w-4 h-4" />
                  Capacity:
                </span>
                <span className="text-white font-semibold">{pool.capacity} people</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-purple-500/10">
                <span className="text-gray-100 flex items-center gap-2 font-medium">
                  <Ruler className="w-4 h-4" />
                  Length:
                </span>
                <span className="text-white font-semibold">{pool.length_meters}m</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-purple-500/10">
                <span className="text-gray-100">Type:</span>
                <span className="text-white font-semibold capitalize">{pool.pool_type}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-purple-500/10">
                <span className="text-gray-100 flex items-center gap-2 font-medium">
                  <DollarSign className="w-4 h-4" />
                  Entry Fee:
                </span>
                <span className="text-white font-semibold">₹{pool.entry_fee}/hour</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-slate-950/70 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">✨ Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {pool.amenities?.map((amenity, index) => (
                <motion.span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 rounded-full text-sm border border-cyan-500/30"
                  whileHover={{ scale: 1.05 }}
                >
                  {amenity}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <motion.div
            className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              Owner Contact
            </h3>
            <div className="space-y-3 text-gray-200">
              <div className="flex justify-between gap-4 p-3 bg-slate-800/50 rounded-lg border border-purple-500/10">
                <span>Owner</span>
                <span className="text-white font-semibold">{pool.owner_name || 'Pool owner'}</span>
              </div>
              <div className="flex justify-between gap-4 p-3 bg-slate-800/50 rounded-lg border border-purple-500/10">
                <span>Email</span>
                {pool.owner_email ? (
                  <a className="text-cyan-300 font-semibold break-all" href={`mailto:${pool.owner_email}`}>{pool.owner_email}</a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </div>
              <div className="flex justify-between gap-4 p-3 bg-slate-800/50 rounded-lg border border-purple-500/10">
                <span>WhatsApp</span>
                {pool.owner_phone ? (
                  <a className="text-green-300 font-semibold break-all" href={`https://wa.me/${pool.owner_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    {pool.owner_phone}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </div>
            </div>
          </motion.div>

          <ChatPanel poolId={pool.id} ownerId={pool.owner_id} title="Chat with owner" />
        </div>

        {/* Weather and Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <WeatherWidget city={pool.city} latitude={pool.latitude} longitude={pool.longitude} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PoolDetailPage;
