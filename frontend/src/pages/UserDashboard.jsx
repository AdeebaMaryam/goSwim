import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PoolMap from '../components/PoolMap';
import PoolCard from '../components/PoolCard';
import WeatherWidget from '../components/WeatherWidget';
import api from '../utils/api';

const UserDashboard = () => {
  const [pools, setPools] = useState([]);
  const [mapPools, setMapPools] = useState([]);
  const [filteredPools, setFilteredPools] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    city: '',
    minScore: 0,
    isOpen: null,
    type: '',
  });

  useEffect(() => {
    fetchPools();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        () => setUserLocation(null)
      );
    }
  }, []);

  useEffect(() => {
    const fetchPublicPools = async () => {
      if (!userLocation) {
        setMapPools(pools.map((pool) => ({ ...pool, is_registered: true })));
        return;
      }

      try {
        const response = await api.get(`/external-pools/?lat=${userLocation[0]}&lon=${userLocation[1]}&radius=25000`);
        const registeredPools = pools.map((pool) => ({ ...pool, is_registered: true }));
        const registeredKeys = new Set(registeredPools.map((pool) => `${pool.name?.toLowerCase()}-${Number(pool.latitude).toFixed(3)}-${Number(pool.longitude).toFixed(3)}`));
        const externalPools = response.data.filter((pool) => {
          const key = `${pool.name?.toLowerCase()}-${Number(pool.latitude).toFixed(3)}-${Number(pool.longitude).toFixed(3)}`;
          return !registeredKeys.has(key);
        });
        setMapPools([...registeredPools, ...externalPools]);
      } catch (error) {
        console.error('Error fetching public pools:', error);
        setMapPools(pools.map((pool) => ({ ...pool, is_registered: true })));
      }
    };

    fetchPublicPools();
  }, [pools, userLocation]);

  useEffect(() => {
    applyFilters();
  }, [pools, filters]);

  const fetchPools = async () => {
    try {
      const response = await api.get('/pools');
      setPools(response.data.map((pool) => ({ ...pool, is_registered: true })));
    } catch (error) {
      console.error('Error fetching pools:', error);
    }
  };

  const applyFilters = () => {
    let filtered = pools.filter(pool => {
      if (filters.city && !pool.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (pool.cleanliness_score < filters.minScore) return false;
      if (filters.isOpen !== null && pool.is_open !== filters.isOpen) return false;
      if (filters.type && pool.pool_type !== filters.type) return false;
      return true;
    });
    setFilteredPools(filtered);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6">
            Explore Pools
          </h1>
          <div className="flex flex-wrap gap-4 mb-4">
            <motion.input
              type="text"
              placeholder="Search by city..."
              className="px-4 py-2 bg-slate-900 border border-purple-500/30 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <motion.select
              className="px-4 py-2 bg-slate-900 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
              value={filters.minScore}
              onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <option value={0} className="bg-slate-900">Min Score: Any</option>
              <option value={65} className="bg-slate-900">65+</option>
              <option value={85} className="bg-slate-900">85+</option>
            </motion.select>
            <motion.select
              className="px-4 py-2 bg-slate-900 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
              value={filters.isOpen || ''}
              onChange={(e) => setFilters({...filters, isOpen: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null})}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <option value="" className="bg-slate-900">Open Status: Any</option>
              <option value="true" className="bg-slate-900">Open</option>
              <option value="false" className="bg-slate-900">Closed</option>
            </motion.select>
            <motion.select
              className="px-4 py-2 bg-slate-900 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <option value="" className="bg-slate-900">Type: Any</option>
              <option value="indoor" className="bg-slate-900">Indoor</option>
              <option value="outdoor" className="bg-slate-900">Outdoor</option>
            </motion.select>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-slate-950/70 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Pool Map</h2>
            <PoolMap pools={mapPools} userLocation={userLocation} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-slate-950/70 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Pool List</h2>
              <WeatherWidget useCurrentLocation compact />
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
              {filteredPools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
