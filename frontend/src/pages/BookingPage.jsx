import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const BookingPage = () => {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    booking_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    number_of_people: 1,
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [step, setStep] = useState(1); // 1: Select Date/Time, 2: Review, 3: Confirm
  const getRemainingSpots = (slot) => Math.max((slot.capacity || 0) - (slot.booked_count || 0), 0);
  const selectedSlot = availableSlots.find(
    (slot) => slot.start_time === bookingData.start_time && slot.end_time === bookingData.end_time
  );
  const selectedSlotRemaining = selectedSlot ? getRemainingSpots(selectedSlot) : null;
  const selectedSlotCanFitGroup = selectedSlot ? selectedSlotRemaining >= bookingData.number_of_people : true;

  useEffect(() => {
    fetchPoolData();
  }, [poolId]);

  useEffect(() => {
    if (bookingData.booking_date) {
      fetchAvailableSlots();
    }
  }, [bookingData.booking_date]);

  useEffect(() => {
    if (pool) {
      const pricePerHour = pool.entry_fee || 0;
      const hours = bookingData.duration_minutes / 60;
      const calculatedAmount = hours * pricePerHour;
      setTotalAmount(parseFloat(calculatedAmount.toFixed(2)));
    }
  }, [bookingData.duration_minutes, pool]);

  const fetchPoolData = async () => {
    try {
      const response = await api.get(`/pools/${poolId}`);
      setPool(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pool:', error);
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await api.get(`/bookings/slots/${poolId}?date=${bookingData.booking_date}`);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const updateStartTime = (startTime) => {
    const nextBookingData = { ...bookingData, start_time: startTime };

    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      date.setMinutes(date.getMinutes() + bookingData.duration_minutes);
      nextBookingData.end_time = date.toTimeString().slice(0, 5);
    } else {
      nextBookingData.end_time = '';
    }

    setBookingData(nextBookingData);
  };

  const selectSlot = (slot) => {
    const remainingSpots = getRemainingSpots(slot);
    if (remainingSpots < bookingData.number_of_people) {
      alert(`Only ${remainingSpots} spot${remainingSpots === 1 ? '' : 's'} left in this slot.`);
      return;
    }

    const [startHours, startMinutes] = slot.start_time.split(':').map(Number);
    const [endHours, endMinutes] = slot.end_time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);
    const durationMinutes = Math.max(30, Math.round((endDate - startDate) / 60000));

    setBookingData((current) => ({
      ...current,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_minutes: durationMinutes,
    }));
  };

  const handleCreateBooking = async () => {
    if (pool?.opening_time && pool?.closing_time) {
      if (bookingData.start_time < pool.opening_time || bookingData.end_time > pool.closing_time) {
        alert(`Bookings are only available between ${pool.opening_time} and ${pool.closing_time}.`);
        return;
      }
    }

    if (selectedSlot && !selectedSlotCanFitGroup) {
      alert(`Only ${selectedSlotRemaining} spot${selectedSlotRemaining === 1 ? '' : 's'} left in the selected slot.`);
      return;
    }

    try {
      const response = await api.post('/bookings/', {
        pool_id: poolId,
        ...bookingData
      });
      navigate(`/payment/${response.data.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.response?.status === 401) {
        alert('Please log in before booking a pool.');
        navigate('/login');
        return;
      }
      alert(error.response?.data?.detail || 'Failed to create booking');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!pool) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Pool is not registered</div>;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Book Your Swimming Session
          </h1>
          <p className="text-gray-300 text-lg">{pool.name}</p>
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
                whileHover={{ scale: 1.1 }}
              >
                {s < step ? '✓' : s}
              </motion.div>
              <div className={`flex-1 h-1 mx-2 rounded ${s < step ? 'bg-cyan-500' : 'bg-slate-800'}`} />
            </motion.div>
          ))}
        </motion.div>

        {/* STEP 1: DATE & TIME SELECTION */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-cyan-400" />
                Select Date & Time
              </h2>

              <div className="mb-6 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-100">
                Pool hours: {pool.opening_time || '06:00'} - {pool.closing_time || '21:00'}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Date Selection */}
                <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <label className="block text-white font-semibold mb-2">Booking Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    value={bookingData.booking_date}
                    onChange={(e) => setBookingData({ ...bookingData, booking_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </motion.div>

                {/* Number of People */}
                <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <label className="flex text-white font-semibold mb-2 items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Number of People *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    value={bookingData.number_of_people}
                    onChange={(e) => setBookingData({ ...bookingData, number_of_people: parseInt(e.target.value) })}
                  />
                </motion.div>

                {/* Start Time */}
                <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <label className="flex text-white font-semibold mb-2 items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Start Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    value={bookingData.start_time}
                    onChange={(e) => updateStartTime(e.target.value)}
                    min={pool.opening_time || '06:00'}
                    max={pool.closing_time || '21:00'}
                  />
                </motion.div>

                {/* Duration */}
                <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <label className="block text-white font-semibold mb-2">Duration (minutes) *</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    value={bookingData.duration_minutes}
                    onChange={(e) => {
                      const duration = parseInt(e.target.value);
                      setBookingData({ ...bookingData, duration_minutes: duration });
                      // Calculate end time
                      if (bookingData.start_time) {
                        const [hours, minutes] = bookingData.start_time.split(':');
                        const date = new Date();
                        date.setHours(parseInt(hours), parseInt(minutes));
                        date.setMinutes(date.getMinutes() + duration);
                        const endTime = date.toTimeString().slice(0, 5);
                        setBookingData(prev => ({ ...prev, end_time: endTime }));
                      }
                    }}
                  >
                    {[30, 60, 90, 120, 180].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes > 60 ? 's' : ''}`} - Rs {(((pool.entry_fee || 0) * minutes) / 60).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </motion.div>
              </div>

              {bookingData.booking_date && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">Available Slots</h3>
                    <span className="text-sm text-gray-400">
                      {availableSlots.length > 0 ? 'Tap a slot to fill the time automatically' : 'No owner-defined slots for this date'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => {
                        const isSelected = bookingData.start_time === slot.start_time && bookingData.end_time === slot.end_time;
                        const remainingSpots = getRemainingSpots(slot);
                        const isFull = !slot.is_available || remainingSpots <= 0;
                        const isTightFit = !isFull && remainingSpots < bookingData.number_of_people;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => selectSlot(slot)}
                            disabled={isFull}
                            className={`rounded-lg border px-4 py-3 text-left transition ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200'
                                : isFull
                                  ? 'border-red-500/20 bg-red-500/10 text-red-200 opacity-70 cursor-not-allowed'
                                  : isTightFit
                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100 hover:border-amber-400/50'
                                    : 'border-purple-500/20 bg-slate-800/40 text-gray-200 hover:border-cyan-400/40'
                            }`}
                          >
                            <div className="font-semibold">{slot.start_time} - {slot.end_time}</div>
                            <div className={`text-sm ${
                              isFull ? 'text-red-200' : isTightFit ? 'text-amber-200' : 'text-gray-400'
                            }`}>
                              {isFull ? 'Full' : `${remainingSpots} of ${slot.capacity} spots left`}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-purple-500/20 bg-slate-800/30 px-4 py-3 text-sm text-gray-400">
                        You can still choose a custom time below.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <motion.div whileFocus={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }}>
                <label className="block text-white font-semibold mb-2">Special Requests (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  rows="3"
                  placeholder="Any special requirements for your booking?"
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                />
              </motion.div>

              {/* Price Summary */}
              <motion.div
                className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-cyan-500/20 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg text-gray-300">Total Amount:</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </motion.div>

              {selectedSlot && !selectedSlotCanFitGroup && (
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
                  The selected slot has only {selectedSlotRemaining} spot{selectedSlotRemaining === 1 ? '' : 's'} left. Reduce your group size or choose another slot.
                </div>
              )}

              <motion.button
                onClick={() => setStep(2)}
                disabled={!bookingData.booking_date || !bookingData.start_time || !selectedSlotCanFitGroup}
                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue to Review
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: REVIEW */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-cyan-400" />
                Review Your Booking
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between py-3 border-b border-slate-700">
                  <span className="text-gray-400">Pool</span>
                  <span className="text-white font-semibold">{pool.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-700">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white font-semibold">{bookingData.booking_date}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-700">
                  <span className="text-gray-400">Time</span>
                  <span className="text-white font-semibold">{bookingData.start_time} - {bookingData.end_time || 'calculating...'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-700">
                  <span className="text-gray-400">People</span>
                  <span className="text-white font-semibold">{bookingData.number_of_people}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-700">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-semibold">{bookingData.duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-xl font-bold text-gray-300">Total Amount</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 border border-purple-500/30 text-white font-bold rounded-lg hover:bg-slate-800/50 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back
                </motion.button>
                <motion.button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Proceed to Payment
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: CONFIRM */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-green-500/20 rounded-xl p-8 text-center"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Complete Payment</h2>
            <p className="text-gray-300 mb-8">Click below to proceed to secure payment gateway</p>

            <motion.button
              onClick={handleCreateBooking}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Proceed to Payment →
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
