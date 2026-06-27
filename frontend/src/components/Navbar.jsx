import { Link } from 'react-router-dom';
import { useAuthStore, useFavoritePoolsStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Heart, History, MessageCircle } from 'lucide-react';
import Logo from './Logo';
import api from '../utils/api';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { favorites } = useFavoritePoolsStore();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const fetchInbox = async () => {
      try {
        const response = await api.get('/chat/inbox');
        setConversations(response.data);
      } catch (error) {
        console.error('Error loading navbar inbox:', error);
      }
    };

    fetchInbox();
    const intervalId = window.setInterval(fetchInbox, 10000);
    return () => window.clearInterval(intervalId);
  }, [user]);

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-purple-500/20 shadow-xl shadow-purple-500/5"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            {user ? (
              <>
                {user.role === 'swimmer' && (
                  <>
                    <Link to="/explore" className="text-white hover:text-cyan-300 transition-colors duration-300 font-medium">
                      Explore
                    </Link>
                    <Link to="/profile?tab=booking" className="text-white hover:text-cyan-300 transition-colors duration-300 font-medium inline-flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Booking History
                    </Link>
                    <Link to="/favorites" className="text-white hover:text-cyan-300 transition-colors duration-300 font-medium inline-flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Favorites
                        {favorites.length > 0 && (
                          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-200">
                            {favorites.length}
                          </span>
                        )}
                    </Link>
                    <Link to="/messages" className="text-white hover:text-cyan-300 transition-colors duration-300 font-medium inline-flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Messages
                        {conversations.length > 0 && (
                          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-200">
                            {conversations.length}
                          </span>
                        )}
                    </Link>
                  </>
                )}
                {user.role === 'owner' && (
                  <>
                    <Link to="/owner/dashboard" className="text-white hover:text-cyan-300 transition-colors duration-300 font-medium">
                      Dashboard
                    </Link>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        to="/owner/register-pool"
                        className="bg-gradient-to-r from-green-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 text-sm"
                      >
                        + Register Pool
                      </Link>
                    </motion.div>
                    <Link to="/messages" className="text-white hover:text-cyan-300 transition-colors duration-300 font-medium inline-flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Messages
                        {conversations.length > 0 && (
                          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-200">
                            {conversations.length}
                          </span>
                        )}
                    </Link>
                  </>
                )}
                <Link to="/profile" className="text-white hover:text-cyan-300 transition-colors duration-300 font-medium">
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-white hover:text-cyan-300 transition-colors duration-300 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-cyan-300 transition-colors duration-300 font-medium">
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-5 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
