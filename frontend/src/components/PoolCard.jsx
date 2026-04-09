import { MapPin, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getScoreLabel } from '../utils/cleanlinessScore';

const PoolCard = ({ pool }) => {
  const scoreInfo = getScoreLabel(pool.cleanliness_score);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-5 shadow-lg hover:border-cyan-500/30 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-white">{pool.name}</h3>
        <motion.span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            scoreInfo.color === 'green' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
            scoreInfo.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
            scoreInfo.color === 'orange' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
            'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
          whileHover={{ scale: 1.1 }}
        >
          {scoreInfo.label}
        </motion.span>
      </div>

      <div className="flex items-center text-gray-400 mb-3 text-sm">
        <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
        <span>{pool.city}</span>
      </div>

      <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg p-4 mb-4 border border-purple-500/20">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {pool.cleanliness_score}
            </div>
            <div className="text-xs text-gray-400 mt-1">Cleanliness Score</div>
          </div>
          {pool.is_open && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 text-green-400 font-bold text-sm"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Open
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm text-gray-300">
        <div className="flex justify-between">
          <span className="text-gray-400">Type:</span>
          <span className="capitalize text-white font-medium">{pool.pool_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Entry Fee:</span>
          <span className="text-cyan-400 font-bold">₹{pool.entry_fee}/hour</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Capacity:</span>
          <span className="text-white font-medium">{pool.capacity} people</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link to={`/pool/${pool.id}`} className="flex-1">
          <motion.button
            className="w-full py-2 px-3 border border-purple-500/30 text-purple-400 font-medium rounded-lg hover:bg-purple-500/10 transition-all duration-300 text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View Details
          </motion.button>
        </Link>
        <Link to={`/booking/${pool.id}`} className="flex-1">
          <motion.button
            className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 text-sm flex items-center justify-center gap-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="w-4 h-4" />
            Book Now
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
};

export default PoolCard;