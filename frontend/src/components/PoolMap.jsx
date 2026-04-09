import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../utils/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PoolMap = ({ pools: initialPools, userLocation = null }) => {
  const [pools, setPools] = useState(initialPools || []);
  const [loading, setLoading] = useState(!initialPools);
  const [center, setCenter] = useState([17.3850, 78.4867]);

  useEffect(() => {
    setPools(initialPools || []);
  }, [initialPools]);

  useEffect(() => {
    if (!initialPools) {
      const fetchPools = async () => {
        try {
          const response = await api.get('/pools/');
          setPools(response.data.map((pool) => ({ ...pool, is_registered: true })));
        } catch (error) {
          console.error('Error fetching pools:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPools();
    }

    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCenter([position.coords.latitude, position.coords.longitude]),
        () => {}
      );
    } else if (userLocation) {
      setCenter(userLocation);
    }
  }, [initialPools, userLocation]);

  const getMarkerIcon = (pool) => {
    const color = pool.is_registered ? '#10b981' : '#38bdf8';
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${pool.is_registered ? 'R' : 'P'}</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-slate-900/50 rounded-xl flex items-center justify-center border border-purple-500/20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="text-cyan-400">
          Loading pools...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden border border-purple-500/20 h-96 md:h-96"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ borderColor: 'rgba(34, 211, 238, 0.5)' }}
    >
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} className="z-10">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
        />

        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-center text-white">
                <div className="font-semibold text-cyan-300">Your Location</div>
              </div>
            </Popup>
          </Marker>
        )}

        {pools.map((pool) => (
          <Marker
            key={pool.id}
            position={[pool.latitude || 17.3850, pool.longitude || 78.4867]}
            icon={getMarkerIcon(pool)}
          >
            <Popup>
              <motion.div className="w-64 p-4 bg-slate-950 text-white" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <h3 className="font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-cyan-600 p-2 rounded mb-3">
                  {pool.name}
                </h3>

                <div className="bg-slate-900 rounded p-3 space-y-2 text-white mb-3">
                  {!pool.is_registered && (
                    <div className="rounded bg-red-500/10 border border-red-500/30 p-2 text-red-200">
                      Pool not registered
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-300">Listing:</span>
                    <span className={pool.is_registered ? 'text-green-400' : 'text-sky-300'}>
                      {pool.is_registered ? 'Registered' : 'Public'}
                    </span>
                  </div>
                  {pool.entry_fee && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Fee:</span>
                      <span className="text-yellow-400">Rs {pool.entry_fee}/hr</span>
                    </div>
                  )}
                  {pool.capacity && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Capacity:</span>
                      <span className="text-blue-400">{pool.capacity} people</span>
                    </div>
                  )}
                </div>

                {pool.is_registered ? (
                  <>
                    <Link to={`/pool/${pool.id}`} className="block w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-center py-2 rounded font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all">
                      View Details
                    </Link>
                    <Link to={`/booking/${pool.id}`} className="block w-full bg-green-600 text-white text-center py-2 rounded font-semibold hover:bg-green-700 transition-all mt-2">
                      Book Now
                    </Link>
                  </>
                ) : (
                  <div className="text-center text-red-200 bg-red-500/10 border border-red-500/30 rounded py-2">
                    Pool not registered
                  </div>
                )}
              </motion.div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {pools.length === 0 && (
        <div className="absolute inset-x-4 top-4 z-20 rounded-lg bg-slate-950/90 border border-red-500/30 p-4 text-red-200">
          No pools were found near your current location.
        </div>
      )}

      <motion.div
        className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-lg border border-purple-500/30 rounded-lg p-4 text-sm text-gray-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-white font-semibold mb-2">Pool Status</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> Registered</div>
        <div className="flex items-center gap-2 mt-1"><span className="w-3 h-3 rounded-full bg-sky-400" /> Public listing</div>
      </motion.div>
    </motion.div>
  );
};

export default PoolMap;
