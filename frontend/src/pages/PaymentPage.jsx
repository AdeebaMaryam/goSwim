import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, Wallet, AlertCircle, CheckCircle, Smartphone, Banknote } from 'lucide-react';
import api from '../utils/api';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [cardData, setCardData] = useState({
    card_number: '',
    card_holder_name: '',
    expiry_date: '',
    cvv: ''
  });

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    const existingScript = document.querySelector('script[data-razorpay-checkout="true"]');
    if (existingScript) {
      setRazorpayReady(true);
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setRazorpayReady(false);
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      setBooking(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching booking:', error);
      setLoading(false);
    }
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    if (name === 'card_number') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setCardData({ ...cardData, [name]: formatted.slice(0, 19) });
    } else if (name === 'expiry_date') {
      if (value.length === 2 && cardData.expiry_date.length === 1) {
        setCardData({ ...cardData, [name]: value + '/' });
      } else {
        setCardData({ ...cardData, [name]: value.slice(0, 5) });
      }
    } else {
      setCardData({ ...cardData, [name]: value.slice(0, name === 'cvv' ? 4 : 100) });
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      await api.post('/payments/', {
        booking_id: bookingId,
        amount: booking.total_amount,
        payment_method: paymentMethod,
        ...(paymentMethod === 'card' ? cardData : {})
      });

      setPaymentSuccess(true);
      setTimeout(() => {
        navigate(`/invoice/${bookingId}`);
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
      alert(error.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!booking) return;
    if (!razorpayReady || !window.Razorpay) {
      alert('Razorpay checkout is still loading. Please try again.');
      return;
    }

    setProcessing(true);

    try {
      const orderResponse = await api.post('/payments/create-order', {
        booking_id: bookingId,
        payment_method: paymentMethod,
      });

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const options = {
        key: orderResponse.data.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: 'goSwim',
        description: `Pool booking ${booking.booking_date}`,
        order_id: orderResponse.data.order_id,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              booking_id: bookingId,
              payment_method: paymentMethod,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPaymentSuccess(true);
            setTimeout(() => {
              navigate(`/invoice/${bookingId}`);
            }, 2000);
          } catch (error) {
            alert(error.response?.data?.detail || 'Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        prefill: {
          name: currentUser.name || '',
          email: currentUser.email || '',
          contact: currentUser.phone || '',
        },
        theme: {
          color: '#06b6d4',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        setProcessing(false);
        alert(response.error?.description || 'Payment failed. Please try again.');
      });
      razorpay.open();
    } catch (error) {
      setProcessing(false);
      alert(error.response?.data?.detail || 'Unable to start online payment right now.');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!booking) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Booking not found</div>;

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-green-500/20 rounded-xl p-12 text-center max-w-md"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
            <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-300 mb-4">Your booking has been confirmed.</p>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-lg text-cyan-400 font-semibold">
            Redirecting to your bookings...
          </motion.div>
        </motion.div>
      </div>
    );
  }

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
            Complete Payment
          </h1>
          <p className="text-gray-300">Secure payment for your booking</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 h-fit sticky top-4"
          >
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Booking Date:</span>
                <span className="font-semibold text-white">{booking.booking_date}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Time:</span>
                <span className="font-semibold text-white">{booking.start_time} - {booking.end_time}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Duration:</span>
                <span className="font-semibold text-white">{booking.duration_minutes} min</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Guests:</span>
                <span className="font-semibold text-white">{booking.number_of_people}</span>
              </div>
              <div className="border-t border-slate-700 pt-4 flex justify-between">
                <span className="text-lg font-bold text-white">Total:</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  ₹{booking.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-cyan-400 text-sm">
              <Lock className="w-4 h-4" />
              <span>Secure SSL Encrypted</span>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8"
          >
            {/* Payment Method Selection */}
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-cyan-400" />
              Payment Method
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { id: 'card', label: 'Credit Card', icon: CreditCard },
                { id: 'upi', label: 'UPI', icon: Smartphone },
                { id: 'cod', label: 'Pay at Pool', icon: Banknote }
              ].map((method) => (
                <motion.button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    paymentMethod === method.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <method.icon className="w-5 h-5" />
                  <span className="text-white text-sm font-medium">{method.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <motion.form onSubmit={handlePayment} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  Card Details
                </h3>

                {/* Card Number */}
                <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <label className="block text-white font-semibold mb-2">Card Number *</label>
                  <input
                    type="text"
                    name="card_number"
                    placeholder="1234 5678 9090 9090"
                    className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    value={cardData.card_number}
                    onChange={handleCardChange}
                    maxLength="19"
                    required
                  />
                </motion.div>

                {/* Cardholder Name */}
                <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <label className="block text-white font-semibold mb-2">Cardholder Name *</label>
                  <input
                    type="text"
                    name="card_holder_name"
                    placeholder="ADEEBA MARIYAM"
                    className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    value={cardData.card_holder_name}
                    onChange={handleCardChange}
                    required
                  />
                </motion.div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <label className="block text-white font-semibold mb-2">Expiry Date *</label>
                    <input
                      type="text"
                      name="expiry_date"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      value={cardData.expiry_date}
                      onChange={handleCardChange}
                      maxLength="5"
                      required
                    />
                  </motion.div>
                  <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <label className="block text-white font-semibold mb-2">CVV *</label>
                    <input
                      type="password"
                      name="cvv"
                      placeholder="123"
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                      maxLength="4"
                      required
                    />
                  </motion.div>
                </div>

                {/* Warning */}
                <motion.div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-200 text-sm">
                    Card payments are processed through Razorpay checkout. Use a test card there to complete the booking.
                  </p>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="button"
                  onClick={handleOnlinePayment}
                  disabled={processing}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Lock className="w-5 h-5" />
                  {processing ? 'Processing...' : `Pay Rs ${booking.total_amount.toFixed(2)}`}
                </motion.button>
              </motion.form>
            )}

            {/* Other Payment Methods */}
            {['upi', 'cod'].includes(paymentMethod) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {paymentMethod === 'upi' && (
                  <>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-cyan-400" />
                      UPI Payment
                    </h3>
                    <div className="p-4 rounded-lg border border-purple-500/20 bg-slate-800/40 text-gray-300">
                      Razorpay checkout will show supported UPI apps and handles, including Google Pay, PhonePe, Paytm, and other enabled methods on your account.
                    </div>
                  </>
                )}

                {paymentMethod === 'cod' && (
                  <>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-cyan-400" />
                      Pay at Pool
                    </h3>
                    <motion.div className="flex gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-green-200 text-sm">
                        You can pay Rs {booking?.total_amount?.toFixed(2)} directly at the swimming pool counter.
                      </p>
                    </motion.div>
                  </>
                )}

                <motion.button
                  onClick={paymentMethod === 'cod' ? handlePayment : handleOnlinePayment}
                  disabled={processing}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Lock className="w-5 h-5" />
                  {processing ? 'Processing...' : paymentMethod === 'cod' ? 'Confirm Pay at Pool' : `Pay Rs ${booking?.total_amount?.toFixed(2)} with Razorpay`}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
