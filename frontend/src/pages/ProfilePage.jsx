import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, Wallet, Heart, Phone, Mail, History, Sun, Moon, Monitor, Receipt } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (!user || activeTab !== 'bookings') return;

    const fetchBookings = async () => {
      setLoadingBookings(true);
      try {
        const response = await api.get('/bookings/history');
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [activeTab, user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || activeTab !== 'notifications') return;
      try {
        const response = await api.get('/notifications/');
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, [activeTab, user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const response = await api.get('/auth/me');
        setPhoneNumber(response.data.phone || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [user]);

  const savePhoneNumber = async () => {
    try {
      const response = await api.put('/auth/me', { phone: phoneNumber });
      localStorage.setItem('user', JSON.stringify(response.data));
      alert('Phone number saved');
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to save phone number');
    }
  };

  useEffect(() => {
    handleThemeChange(theme);
  }, []);

  useEffect(() => {
    if (!user || activeTab !== 'payments') return;

    const fetchPayments = async () => {
      setLoadingPayments(true);
      try {
        const response = await api.get('/payments/');
        setPayments(response.data);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [activeTab, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openInvoice = (bookingId) => {
    navigate(`/invoice/${bookingId}`);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.body.style.backgroundColor = '#020617';
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (newTheme === 'light') {
      document.body.style.backgroundColor = '#0f172a';
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      // system
      document.body.style.backgroundColor = '#020617';
      document.documentElement.classList.remove('dark', 'light');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-gray-300 mt-2">Manage your profile and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-slate-900/50 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-4 space-y-2">
              {[
                { id: 'profile', label: 'My Profile', icon: User },
                { id: 'security', label: 'Theme', icon: Settings },
                { id: 'notifications', label: 'Notifications', icon: Heart },
                { id: 'bookings', label: 'My Bookings', icon: History },
                { id: 'payments', label: 'Payments', icon: Wallet },
              ].map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-purple-600/50 to-cyan-600/50 text-white'
                      : 'text-gray-300 hover:bg-slate-800/50'
                  }`}
                  whileHover={{ x: 5 }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-slate-900/50 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <User className="w-6 h-6 text-cyan-400" />
                  My Profile
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="text-gray-300 text-sm uppercase tracking-wide">Name</label>
                    <div className="mt-2 px-4 py-3 bg-slate-800/50 rounded-lg text-white border border-purple-500/10">
                      {user.name || 'Not set'}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm uppercase tracking-wide flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <div className="mt-2 px-4 py-3 bg-slate-800/50 rounded-lg text-white border border-purple-500/10">
                      {user.email}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm uppercase tracking-wide flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      className="mt-2 w-full px-4 py-3 bg-slate-800/50 rounded-lg text-white border border-purple-500/20 focus:border-cyan-400/50 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={savePhoneNumber}
                      className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold"
                    >
                      Save Phone Number
                    </button>
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm uppercase tracking-wide">Account Type</label>
                    <div className="mt-2 px-4 py-3 bg-slate-800/50 rounded-lg">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        user.role === 'owner'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {user.role === 'owner' ? '🏊‍♂️ Pool Owner' : '🏊 Swimmer'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'security' && (
              <div className="bg-slate-900/50 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Settings className="w-6 h-6 text-cyan-400" />
                  Theme Settings
                </h2>

                <div className="space-y-4">
                  {[
                    { id: 'dark', label: 'Dark Theme', icon: Moon, description: 'Perfect for night' },
                    { id: 'light', label: 'Light Theme', icon: Sun, description: 'Bright and clean' },
                    { id: 'system', label: 'System Default', icon: Monitor, description: 'Follows OS settings' },
                  ].map((option) => (
                    <motion.button
                      key={option.id}
                      onClick={() => handleThemeChange(option.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        theme === option.id
                          ? 'border-cyan-400/50 bg-cyan-400/10'
                          : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <option.icon className={`w-6 h-6 ${theme === option.id ? 'text-cyan-400' : 'text-gray-300'}`} />
                        <div className="text-left">
                          <div className="text-white font-semibold">{option.label}</div>
                          <div className="text-gray-400 text-sm">{option.description}</div>
                        </div>
                      </div>
                      {theme === option.id && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
                <div className="mt-8 space-y-3">
                  <h3 className="text-white font-bold text-lg">Recent Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-gray-300">No notifications yet.</p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/10">
                        <div className="text-white font-semibold">{notification.title}</div>
                        <div className="text-gray-300 text-sm mt-1">{notification.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-slate-900/50 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Heart className="w-6 h-6 text-cyan-400" />
                  Notification Settings
                </h2>

                <div className="space-y-4">
                  {[
                    { id: 'email', label: 'Email Notifications', description: 'Booking & payment updates', state: emailNotifications, setState: setEmailNotifications },
                    { id: 'push', label: 'Push Notifications', description: 'Real-time alerts on phone', state: pushNotifications, setState: setPushNotifications },
                  ].map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-purple-500/10">
                      <div>
                        <h3 className="text-white font-semibold">{notif.label}</h3>
                        <p className="text-gray-400 text-sm">{notif.description}</p>
                      </div>
                      <motion.button
                        onClick={() => notif.setState(!notif.state)}
                        className={`relative w-14 h-8 rounded-full transition-all ${
                          notif.state ? 'bg-cyan-500/50' : 'bg-slate-700'
                        }`}
                        animate={{
                          backgroundColor: notif.state ? '#22d3ee' : '#374151'
                        }}
                      >
                        <motion.div
                          className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full"
                          animate={{
                            x: notif.state ? '24px' : '0px'
                          }}
                        />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-slate-900/50 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <History className="w-6 h-6 text-cyan-400" />
                  My Bookings
                </h2>
                {loadingBookings ? (
                  <p className="text-gray-300">Loading bookings...</p>
                ) : bookings.length === 0 ? (
                  <p className="text-gray-300">No bookings found yet.</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/10">
                        <div className="flex flex-wrap justify-between gap-3 text-white">
                          <span className="font-semibold">{booking.pool_name || 'Pool booking'}</span>
                          <span className="capitalize text-cyan-300">{booking.status}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-400">
                          {booking.pool_city || booking.pool_address || 'Location not available'}
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-300">
                          <span>{booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : ''}</span>
                          <span>{booking.start_time} - {booking.end_time}</span>
                          <span>{booking.number_of_people} guest{booking.number_of_people === 1 ? '' : 's'}</span>
                          <span>Rs {Number(booking.total_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm">
                          <span className="capitalize text-cyan-300">
                            Payment: {booking.payment_status || 'pending'}
                          </span>
                          {booking.payment_method && (
                            <span className="capitalize text-gray-400">
                              {booking.payment_method}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openInvoice(booking.id)}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          <Receipt className="h-4 w-4" />
                          View Invoice
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="bg-slate-900/50 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-cyan-400" />
                  Payment Methods
                </h2>
                {loadingPayments ? (
                  <p className="text-gray-300">Loading payments...</p>
                ) : payments.length === 0 ? (
                  <p className="text-gray-300">No payments found yet.</p>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/10">
                        <div className="flex flex-wrap justify-between gap-3 text-white">
                          <span className="font-semibold">Rs {Number(payment.amount || 0).toFixed(2)}</span>
                          <span className="capitalize text-cyan-300">{payment.status}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-300">
                          <span className="capitalize">{payment.payment_method}</span>
                          <span>{payment.transaction_id || 'No transaction id'}</span>
                          <span>{payment.created_at ? new Date(payment.created_at).toLocaleString() : ''}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openInvoice(payment.booking_id)}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          <Receipt className="h-4 w-4" />
                          View Invoice
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              className="mt-8 w-full bg-gradient-to-r from-red-600 to-red-500 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
