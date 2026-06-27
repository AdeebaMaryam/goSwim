import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Building2, Users, DollarSign, Droplets, Zap, Wifi,
  Shield, AlertCircle, CheckCircle, Save
} from 'lucide-react';
import api from '../utils/api';

const PoolRegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [existingPoolId, setExistingPoolId] = useState(null);
  const isEditMode = Boolean(existingPoolId);

  const [poolData, setPoolData] = useState({
    name: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    pool_type: 'outdoor',
    capacity: '',
    length_meters: '',
    entry_fee: '',
    opening_time: '06:00',
    closing_time: '21:00',
    amenities: []
  });

  const [facilities, setFacilities] = useState({
    has_lifeguard: false,
    has_emergency_equipment: false,
    has_changing_rooms: false,
    has_locker_facility: false,
    has_cctv: false,
    has_cafe: false,
    has_parking: false,
    has_wheelchair_access: false
  });

  const amenityOptions = [
    'WiFi', 'Parking', 'Cafeteria', 'Locker Room', 'Shower', 'Changing Room',
    'First Aid', 'Swimming Lessons', 'Equipment Rental', 'Party Packages'
  ];

  useEffect(() => {
    const loadOwnerPool = async () => {
      try {
        const poolsResponse = await api.get('/pools/me');
        const existingPool = poolsResponse.data?.[0];

        if (existingPool) {
          setExistingPoolId(existingPool.id);
          setPoolData({
            name: existingPool.name || '',
            address: existingPool.address || '',
            city: existingPool.city || '',
            latitude: existingPool.latitude ?? '',
            longitude: existingPool.longitude ?? '',
            pool_type: existingPool.pool_type || 'outdoor',
            capacity: existingPool.capacity ?? '',
            length_meters: existingPool.length_meters ?? '',
            entry_fee: existingPool.entry_fee ?? '',
            opening_time: existingPool.opening_time || '06:00',
            closing_time: existingPool.closing_time || '21:00',
            amenities: existingPool.amenities || []
          });

          try {
            const facilityResponse = await api.get(`/booking/${existingPool.id}/facilities`);
            setFacilities({
              has_lifeguard: facilityResponse.data.has_lifeguard,
              has_emergency_equipment: facilityResponse.data.has_emergency_equipment,
              has_changing_rooms: facilityResponse.data.has_changing_rooms,
              has_locker_facility: facilityResponse.data.has_locker_facility,
              has_cctv: facilityResponse.data.has_cctv,
              has_cafe: facilityResponse.data.has_cafe,
              has_parking: facilityResponse.data.has_parking,
              has_wheelchair_access: facilityResponse.data.has_wheelchair_access
            });
          } catch (facilityError) {
            console.error('Error fetching facilities:', facilityError);
          }
        }
      } catch (error) {
        console.error('Error loading owner pool:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadOwnerPool();
  }, []);

  const handlePoolChange = (e) => {
    const { name, value } = e.target;
    setPoolData({ ...poolData, [name]: value });
  };

  const handleAmenityToggle = (amenity) => {
    setPoolData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleFacilityChange = (facility) => {
    setFacilities(prev => ({
      ...prev,
      [facility]: !prev[facility]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...poolData,
        latitude: poolData.latitude === '' ? null : Number(poolData.latitude),
        longitude: poolData.longitude === '' ? null : Number(poolData.longitude),
        capacity: poolData.capacity === '' ? null : Number(poolData.capacity),
        length_meters: poolData.length_meters === '' ? null : Number(poolData.length_meters),
        entry_fee: poolData.entry_fee === '' ? null : Number(poolData.entry_fee)
      };

      const poolResponse = isEditMode
        ? await api.put(`/pools/${existingPoolId}`, payload)
        : await api.post('/pools/', payload);
      const poolId = poolResponse.data.id;

      await api.post('/booking/facilities', {
        pool_id: poolId,
        ...facilities
      });

      alert(isEditMode ? 'Pool updated successfully!' : 'Pool registered successfully!');
      navigate('/owner/dashboard');
    } catch (error) {
      console.error('Error registering pool:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('Your login session expired. Please log in again and register the pool.');
        navigate('/login');
        return;
      }
      alert(error.response?.data?.detail || 'Failed to register pool');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading pool form...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            {isEditMode ? 'Update Your Swimming Pool' : 'Register Your Swimming Pool'}
          </h1>
          <p className="text-gray-300 text-lg">
            {isEditMode ? 'Keep your pool details up to date for swimmers' : 'Start managing your pool and reach more swimmers'}
          </p>
          {isEditMode && (
            <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-200">
              You already have one registered pool. You can update it here instead of creating a second pool.
            </div>
          )}
        </motion.div>

        {/* Progress Steps */}
        <motion.div className="flex gap-4 mb-12 justify-between max-w-2xl">
          {[1, 2, 3].map((s) => (
            <motion.div key={s} className="flex items-center flex-1">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  s <= step
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                    : 'bg-slate-800 text-gray-400 border border-slate-700'
                }`}
              >
                {s < step ? '✓' : s}
              </motion.div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 rounded ${s < step ? 'bg-cyan-500' : 'bg-slate-800'}`} />}
            </motion.div>
          ))}
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* STEP 1: BASIC INFORMATION */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-cyan-400" />
                  Basic Information
                </h2>

                <div className="space-y-6">
                  {/* Pool Name */}
                  <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <label className="block text-white font-semibold mb-2">Pool Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g., Blue Water Swimming Pool"
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      value={poolData.name}
                      onChange={handlePoolChange}
                      required
                    />
                  </motion.div>

                  {/* Address */}
                  <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <label className="flex text-white font-semibold mb-2 items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Full address"
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      value={poolData.address}
                      onChange={handlePoolChange}
                      required
                    />
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* City */}
                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <label className="block text-white font-semibold mb-2">City *</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        value={poolData.city}
                        onChange={handlePoolChange}
                        required
                      />
                    </motion.div>

                    {/* Pool Type */}
                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <label className="block text-white font-semibold mb-2">Pool Type *</label>
                      <select
                        name="pool_type"
                        className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        value={poolData.pool_type}
                        onChange={handlePoolChange}
                      >
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                      </select>
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Capacity */}
                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <label className="flex text-white font-semibold mb-2 items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        Capacity *
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        placeholder="Max people"
                        className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        value={poolData.capacity}
                        onChange={handlePoolChange}
                        required
                      />
                    </motion.div>

                    {/* Length */}
                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <label className="flex text-white font-semibold mb-2 items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                        Length (meters) *
                      </label>
                      <input
                        type="number"
                        name="length_meters"
                        placeholder="Length"
                        className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        value={poolData.length_meters}
                        onChange={handlePoolChange}
                        required
                      />
                    </motion.div>

                    {/* Entry Fee */}
                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <label className="flex text-white font-semibold mb-2 items-center gap-2">
                        <DollarSign className="w-4 h-4 text-cyan-400" />
                        Entry Fee (₹/hour) *
                      </label>
                      <input
                        type="number"
                        name="entry_fee"
                        placeholder="Price per hour"
                        className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        value={poolData.entry_fee}
                        onChange={handlePoolChange}
                        required
                      />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <label className="block text-white font-semibold mb-2">Opening Time *</label>
                      <input
                        type="time"
                        name="opening_time"
                        className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        value={poolData.opening_time}
                        onChange={handlePoolChange}
                        required
                      />
                    </motion.div>

                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <label className="block text-white font-semibold mb-2">Closing Time *</label>
                      <input
                        type="time"
                        name="closing_time"
                        className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        value={poolData.closing_time}
                        onChange={handlePoolChange}
                        required
                      />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Latitude */}
                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <label className="block text-white font-semibold mb-2">Latitude</label>
                      <input
                        type="number"
                        name="latitude"
                        placeholder="e.g., 17.386"
                        step="0.0001"
                        className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        value={poolData.latitude}
                        onChange={handlePoolChange}
                      />
                    </motion.div>

                    {/* Longitude */}
                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <label className="block text-white font-semibold mb-2">Longitude</label>
                      <input
                        type="number"
                        name="longitude"
                        placeholder="e.g., 78.4865"
                        step="0.0001"
                        className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                        value={poolData.longitude}
                        onChange={handlePoolChange}
                      />
                    </motion.div>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full mt-8 py-3 px-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue to Facilities
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: FACILITIES & AMENITIES */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-cyan-400" />
                  Facilities & Amenities
                </h2>

                {/* Facilities */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-white mb-4">Available Facilities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(facilities).map((facility) => (
                      <motion.label
                        key={facility}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 border border-purple-500/20 rounded-lg hover:border-purple-500/50 cursor-pointer transition-all"
                        whileHover={{ scale: 1.02 }}
                      >
                        <input
                          type="checkbox"
                          checked={facilities[facility]}
                          onChange={() => handleFacilityChange(facility)}
                          className="w-5 h-5 accent-cyan-500"
                        />
                        <span className="text-white font-medium capitalize">
                          {facility.replace('has_', '').replace(/_/g, ' ')}
                        </span>
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-white mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenityOptions.map((amenity) => (
                      <motion.button
                        key={amenity}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`p-3 rounded-lg border-2 transition-all font-medium ${
                          poolData.amenities.includes(amenity)
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                            : 'border-slate-700 bg-slate-800/30 text-gray-400 hover:border-slate-600'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {amenity}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 border border-purple-500/30 text-white font-bold rounded-lg hover:bg-slate-800/50 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    Review & Register
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: REVIEW & CONFIRM */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-slate-900/50 backdrop-blur-sm border border-green-500/20 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  Review Your Pool
                </h2>

                <div className="space-y-6 mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Pool Details</h3>
                    <div className="space-y-3 text-gray-300">
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span>Name:</span>
                        <span className="text-white font-semibold">{poolData.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span>City:</span>
                        <span className="text-white font-semibold">{poolData.city}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span>Type:</span>
                        <span className="text-white font-semibold capitalize">{poolData.pool_type}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span>Capacity:</span>
                        <span className="text-white font-semibold">{poolData.capacity} people</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span>Hours:</span>
                        <span className="text-white font-semibold">{poolData.opening_time} - {poolData.closing_time}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span>Entry Fee:</span>
                        <span className="text-white font-semibold">₹{poolData.entry_fee}/hour</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Selected Facilities</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(facilities)
                        .filter(([, value]) => value)
                        .map(([facility]) => (
                          <span key={facility} className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-sm">
                            ✓ {facility.replace('has_', '').replace(/_/g, ' ')}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Selected Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {poolData.amenities.map((amenity) => (
                        <span key={amenity} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-full text-sm">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 px-4 border border-purple-500/30 text-white font-bold rounded-lg hover:bg-slate-800/50 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Save className="w-5 h-5" />
                    {loading ? (isEditMode ? 'Updating...' : 'Registering...') : (isEditMode ? 'Update Pool' : 'Register Pool')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PoolRegisterPage;
