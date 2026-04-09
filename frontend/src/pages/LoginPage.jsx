import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ElectricBorder from '../components/ElectricBorder';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { useAuthStore } from '../store/useStore';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { loginUser, loading, error } = useAuth();
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  useEffect(() => {
    // Load Google Sign-In SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Initialize Google Sign-In after SDK loads
      if (window.google && window.google.accounts && window.google.accounts.id) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
          console.warn('VITE_GOOGLE_CLIENT_ID not configured');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: window.handleGoogleCallback,
        });

        // Render button in the container
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: '100%',
          });
        }
        window.google.accounts.id.prompt();
      }
    };

    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script already removed
      }
    };
  }, []);

  const handleGoogleCallback = async (response) => {
    if (response.credential) {
      try {
        const result = await api.post('/auth/google-login', { token: response.credential });
        const data = result.data;
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          login(data.user);
          navigate('/explore');
        } else {
          alert('Login failed. Please try again.');
        }
      } catch (error) {
        console.error('Google login error:', error);
        alert('An error occurred during login');
      }
    }
  };

  // Expose callback to window for Google Sign-In
  useEffect(() => {
    window.handleGoogleCallback = handleGoogleCallback;
    return () => {
      delete window.handleGoogleCallback;
    };
  }, [handleGoogleCallback, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(formData);
      navigate('/explore');
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
                Sign in to goSwim
              </h2>
            </motion.div>

            <motion.form
              className="mt-8 space-y-6"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="rounded-md shadow-sm space-y-4">
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
                    type="password"
                    required
                    className="w-full px-4 py-3 border border-purple-500/30 bg-slate-900 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </motion.div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                >
                  {error}
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-300"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </motion.div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-950/90 text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <div
                ref={googleButtonRef}
                className="flex justify-center"
              />

              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link to="/register" className="text-cyan-400 hover:text-purple-400 transition-colors duration-300 font-medium">
                  Don't have an account? Sign up
                </Link>
              </motion.div>
            </motion.form>
          </div>
        </ElectricBorder>
      </motion.div>
    </div>
  );
};

export default LoginPage;
