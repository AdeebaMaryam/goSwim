import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { Link, useNavigate } from 'react-router-dom';
import WaterQualityMetrics from '../components/WaterQualityMetrics';
import TrendChart from '../components/TrendChart';
import IoTDeviceStatus from '../components/IoTDeviceStatus';
import AlertBanner from '../components/AlertBanner';
import ChatPanel from '../components/ChatPanel';
import api from '../utils/api';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [pools, setPools] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [latestReading, setLatestReading] = useState(null);
  const [ownerBooking, setOwnerBooking] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotForm, setSlotForm] = useState({
    slot_date: '',
    start_time: '',
    end_time: '',
    capacity: '',
    price_per_slot: ''
  });
  const [loading, setLoading] = useState(true);
  const poolId = selectedPoolId;
  const wsData = useWebSocket(poolId);
  const currentData = wsData || latestReading;

  const fetchOwnerPools = async () => {
    try {
      const response = await api.get('/pools/me');
      setPools(response.data);
      setSelectedPoolId(response.data[0]?.id || '');
    } catch (error) {
      console.error('Error fetching owner pools:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerPools();
  }, []);

  useEffect(() => {
    const fetchLatestReading = async () => {
      if (!poolId) return;
      try {
        const response = await api.get(`/reading/${poolId}/latest`);
        setLatestReading(response.data);
      } catch (error) {
        setLatestReading(null);
      }
    };

    fetchLatestReading();
  }, [poolId]);

  useEffect(() => {
    const fetchOwnerBooking = async () => {
      if (activeTab !== 'booking') return;
      try {
        const response = await api.get('/booking/owner');
        setOwnerBooking(response.data.filter((booking) => booking.pool_id === poolId));
      } catch (error) {
        console.error('Error fetching owner bookings:', error);
      }
    };

    fetchOwnerBooking();
  }, [activeTab, poolId]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (activeTab !== 'manage' || !poolId || !slotForm.slot_date) {
        setSlots([]);
        return;
      }

      setSlotLoading(true);
      try {
        const response = await api.get(`/booking/slots/${poolId}?date=${slotForm.slot_date}`);
        setSlots(response.data);
      } catch (error) {
        console.error('Error fetching slots:', error);
        setSlots([]);
      } finally {
        setSlotLoading(false);
      }
    };

    fetchSlots();
  }, [activeTab, poolId, slotForm.slot_date]);

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'manage', name: 'Manage Pool' },
    { id: 'live', name: 'Live Data' },
    { id: 'trends', name: 'Trends' },
    { id: 'devices', name: 'Devices' },
    { id: 'booking', name: 'My Bookings' },
  ];

  const selectedPool = pools.find((pool) => pool.id === poolId);

  const handleDeletePool = async () => {
    if (!selectedPool) return;
    const confirmed = window.confirm(`Delete ${selectedPool.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/pools/${selectedPool.id}`);
      alert('Pool deleted successfully');
      setSelectedPoolId('');
      setLatestReading(null);
      setOwnerBooking([]);
      fetchOwnerPools();
      navigate('/owner/dashboard');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete pool');
    }
  };

  const handleTogglePoolOpen = async () => {
    if (!selectedPool) return;

    try {
      const response = await api.put(`/pools/${selectedPool.id}`, {
        is_open: !selectedPool.is_open,
      });
      setPools((currentPools) =>
        currentPools.map((pool) => (pool.id === selectedPool.id ? response.data : pool))
      );
      alert(response.data.is_open ? 'Pool is now open for bookings' : 'Pool is now paused for bookings');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update pool status');
    }
  };

  const handleSlotChange = (event) => {
    const { name, value } = event.target;
    setSlotForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateSlot = async (event) => {
    event.preventDefault();
    if (!poolId) return;

    try {
      await api.post('/booking/slots', {
        pool_id: poolId,
        slot_date: slotForm.slot_date,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        capacity: Number(slotForm.capacity),
        price_per_slot: Number(slotForm.price_per_slot || selectedPool?.entry_fee || 0)
      });

      alert('Slot created successfully');
      setSlotForm((current) => ({
        ...current,
        start_time: '',
        end_time: '',
        capacity: '',
        price_per_slot: ''
      }));

      const response = await api.get(`/booking/slots/${poolId}?date=${slotForm.slot_date}`);
      setSlots(response.data);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const confirmed = window.confirm('Delete this slot?');
    if (!confirmed) return;

    try {
      await api.delete(`/booking/slots/${slotId}`);
      setSlots((currentSlots) => currentSlots.filter((slot) => slot.id !== slotId));
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete slot');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading dashboard...</div>;
  }

  if (!poolId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-950/70 border border-purple-500/20 rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-3">No pool registered yet</h1>
          <p className="text-gray-300 mb-6">Register your first pool to start seeing live sensor data, bookings, alerts, and reports.</p>
          <a href="/owner/register-pool" className="inline-block bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold">
            Register Pool
          </a>
        </div>
      </div>
    );
  }

  const renderMetrics = () => (
    currentData ? (
      <WaterQualityMetrics data={currentData} />
    ) : (
      <div className="bg-slate-950/70 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 text-gray-300 mb-8">
        Waiting for live readings from the backend.
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Pool Owner Dashboard
          </h1>
          <p className="text-gray-100 font-medium">Manage your pool and monitor water quality in real time</p>
          {selectedPool && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/owner/register-pool"
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 font-semibold text-white"
              >
                Update Pool
              </Link>
              <button
                type="button"
                onClick={handleDeletePool}
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 font-semibold text-red-200 transition hover:bg-red-500/20"
              >
                Delete Pool
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <nav className="flex flex-wrap gap-1 bg-slate-950/70 backdrop-blur-sm border border-purple-500/20 rounded-xl p-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.name}
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {activeTab === 'overview' && (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AlertBanner poolId={poolId} />
            {renderMetrics()}
            <TrendChart poolId={poolId} />
            <IoTDeviceStatus poolId={poolId} />
          </motion.div>
        )}

        {activeTab === 'manage' && selectedPool && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-5">
                <div className="text-sm text-gray-400 mb-2">Booking Status</div>
                <div className={`text-xl font-bold ${selectedPool.is_open ? 'text-green-300' : 'text-amber-300'}`}>
                  {selectedPool.is_open ? 'Open for booking' : 'Booking paused'}
                </div>
              </div>
              <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-5">
                <div className="text-sm text-gray-400 mb-2">Price</div>
                <div className="text-xl font-bold text-white">Rs {Number(selectedPool.entry_fee || 0).toFixed(2)}/hour</div>
              </div>
              <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-5">
                <div className="text-sm text-gray-400 mb-2">Capacity</div>
                <div className="text-xl font-bold text-white">{selectedPool.capacity || 0} swimmers</div>
              </div>
              <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-5 md:col-span-3">
                <div className="text-sm text-gray-400 mb-2">Operating Hours</div>
                <div className="text-xl font-bold text-white">{selectedPool.opening_time || '06:00'} - {selectedPool.closing_time || '21:00'}</div>
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{selectedPool.name}</h2>
                  <p className="text-gray-300">{selectedPool.address}, {selectedPool.city}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePoolOpen}
                    className={`rounded-lg px-4 py-2 font-semibold transition ${
                      selectedPool.is_open
                        ? 'border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                        : 'border border-green-500/40 bg-green-500/10 text-green-200 hover:bg-green-500/20'
                    }`}
                  >
                    {selectedPool.is_open ? 'Pause Booking' : 'Open Booking'}
                  </button>
                  <Link
                    to="/owner/register-pool"
                    className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 font-semibold text-white"
                  >
                    Edit Details
                  </Link>
                  <button
                    type="button"
                    onClick={handleDeletePool}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 font-semibold text-red-200 transition hover:bg-red-500/20"
                  >
                    Delete Pool
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-purple-500/10 bg-slate-800/40 p-4">
                  <div className="text-gray-400 mb-1">Pool Type</div>
                  <div className="text-white font-semibold capitalize">{selectedPool.pool_type || 'Not set'}</div>
                </div>
                <div className="rounded-lg border border-purple-500/10 bg-slate-800/40 p-4">
                  <div className="text-gray-400 mb-1">Length</div>
                  <div className="text-white font-semibold">{selectedPool.length_meters || 0} meters</div>
                </div>
                <div className="rounded-lg border border-purple-500/10 bg-slate-800/40 p-4 md:col-span-2">
                  <div className="text-gray-400 mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedPool.amenities || []).length > 0 ? (
                      selectedPool.amenities.map((amenity) => (
                        <span key={amenity} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-200">
                          {amenity}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">No amenities added yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Booking Slots</h3>
                  <p className="text-gray-300">Create time slots swimmers can select directly.</p>
                </div>
              </div>

              <form onSubmit={handleCreateSlot} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <input
                  type="date"
                  name="slot_date"
                  value={slotForm.slot_date}
                  onChange={handleSlotChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="rounded-lg border border-purple-500/20 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
                <input
                  type="time"
                  name="start_time"
                  value={slotForm.start_time}
                  onChange={handleSlotChange}
                  className="rounded-lg border border-purple-500/20 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
                <input
                  type="time"
                  name="end_time"
                  value={slotForm.end_time}
                  onChange={handleSlotChange}
                  className="rounded-lg border border-purple-500/20 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
                <input
                  type="number"
                  name="capacity"
                  value={slotForm.capacity}
                  onChange={handleSlotChange}
                  min="1"
                  placeholder="Capacity"
                  className="rounded-lg border border-purple-500/20 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
                <input
                  type="number"
                  name="price_per_slot"
                  value={slotForm.price_per_slot}
                  onChange={handleSlotChange}
                  min="0"
                  placeholder={`Price (default Rs ${selectedPool.entry_fee || 0})`}
                  className="rounded-lg border border-purple-500/20 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
                <div className="md:col-span-5">
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-5 py-3 font-semibold text-white"
                  >
                    Add Slot
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {slotForm.slot_date ? (
                  slotLoading ? (
                    <div className="text-gray-300">Loading slots...</div>
                  ) : slots.length === 0 ? (
                    <div className="rounded-lg border border-purple-500/10 bg-slate-800/30 p-4 text-gray-400">
                      No slots added for this date yet.
                    </div>
                  ) : (
                    slots.map((slot) => (
                      <div key={slot.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-purple-500/10 bg-slate-800/30 p-4">
                        <div>
                          <div className="font-semibold text-white">{slot.start_time} - {slot.end_time}</div>
                          <div className="text-sm text-gray-400">
                            {slot.capacity} capacity, Rs {Number(slot.price_per_slot || 0).toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20"
                        >
                          Delete Slot
                        </button>
                      </div>
                    ))
                  )
                ) : (
                  <div className="rounded-lg border border-purple-500/10 bg-slate-800/30 p-4 text-gray-400">
                    Pick a date above to view and manage slots for that day.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'live' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-2xl font-semibold text-white mb-6">Live Sensor Data</h2>
            {renderMetrics()}
          </motion.div>
        )}

        {activeTab === 'trends' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-2xl font-semibold text-white mb-6">Historical Trends</h2>
            <TrendChart poolId={poolId} />
          </motion.div>
        )}

        {activeTab === 'devices' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-2xl font-semibold text-white mb-6">IoT Devices</h2>
            <IoTDeviceStatus poolId={poolId} />
          </motion.div>
        )}

        {activeTab === 'booking' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-2xl font-semibold text-white mb-6">Users Who Booked This Pool</h2>
            {ownerBooking.length === 0 ? (
              <div className="bg-slate-950/70 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 text-gray-300">
                No bookings found for this pool yet.
              </div>
            ) : (
              <div className="space-y-4">
                {ownerBooking.map((booking) => (
                  <div key={booking.id} className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-gray-200 mb-4">
                      <div>
                        <div className="text-gray-400 text-sm">Swimmer</div>
                        <div className="text-white font-semibold">{booking.user_name || 'Swimmer'}</div>
                        <a className="text-cyan-300 text-sm break-all" href={`mailto:${booking.user_email}`}>{booking.user_email}</a>
                        {booking.user_phone && (
                          <a className="block text-green-300 text-sm break-all" href={`https://wa.me/${booking.user_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                            WhatsApp {booking.user_phone}
                          </a>
                        )}
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Date</div>
                        <div>{booking.booking_date}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Time</div>
                        <div>{booking.start_time} - {booking.end_time}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Guests</div>
                        <div>{booking.number_of_people}</div>
                      </div>
                    </div>
                    <ChatPanel poolId={booking.pool_id} otherUserId={booking.user_id} title={`Chat with ${booking.user_name || 'swimmer'}`} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
