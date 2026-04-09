import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ElectricBorder from '../components/ElectricBorder';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { useAuthStore } from '../store/useStore';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'swimmer' });
  const { register, loading, error } = useAuth();
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: window.handleGoogleRegisterCallback,
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          width: '100%',
        });
      }
      window.google.accounts.id.prompt();
    };

    document.head.appendChild(script);
    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script already removed.
      }
    };
  }, []);

  const handleGoogleRegisterCallback = async (response) => {
    if (!response.credential) return;

    try {
      const result = await api.post('/auth/google-login', {
        token: response.credential,
        role: formData.role
      });
      localStorage.setItem('token', result.data.access_token);
      login(result.data.user);
      navigate('/explore');
    } catch (err) {
      alert(err.response?.data?.detail || 'Google sign up failed');
    }
  };

  useEffect(() => {
    window.handleGoogleRegisterCallback = handleGoogleRegisterCallback;
    return () => {
      delete window.handleGoogleRegisterCallback;
    };
  }, [handleGoogleRegisterCallback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      // Error handled in hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{
          x: [0, 50, -50, 0],
          y: [0, 30, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-40 right-20 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{
          x: [0, -50, 50, 0],
          y: [0, -30, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="relative z-10 max-w-md w-full space-y-8 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ElectricBorder color="#a99eff" speed={1.2} chaos={0.08} borderRadius={16}>
          <div className="bg-slate-950/90 backdrop-blur-sm p-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Create your account
              </h2>
            </motion.div>

            <motion.form
              className="mt-8 space-y-4"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-purple-500/30 bg-slate-900 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </motion.div>

              <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-purple-500/30 bg-slate-900 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </motion.div>

              <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-purple-500/30 bg-slate-900 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="Phone number for contact and WhatsApp"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </motion.div>

              <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-purple-500/30 bg-slate-900 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </motion.div>

              <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                <select
                  className="w-full px-4 py-3 border border-purple-500/30 bg-slate-900 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="swimmer" className="bg-slate-900">🏊 Swimmer</option>
                  <option value="owner" className="bg-slate-900">🏊‍♂️ Pool Owner</option>
                </select>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                >
                  {error}
                </motion.div>
              )}

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-950/90 text-gray-400">Or sign up with</span>
                </div>
              </div>

              <div ref={googleButtonRef} className="flex justify-center" />

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-300"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </motion.div>

              <motion.div
                className="text-center pt-4 border-t border-purple-500/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link to="/login" className="text-cyan-400 hover:text-purple-400 transition-colors duration-300 font-medium">
                  Already have an account? Sign in
                </Link>
              </motion.div>
            </motion.form>
          </div>
        </ElectricBorder>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
