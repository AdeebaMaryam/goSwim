import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import PoolDetailPage from './pages/PoolDetailPage';
import OwnerDashboard from './pages/OwnerDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import PoolRegisterPage from './pages/PoolRegisterPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import FavoritesPage from './pages/FavoritesPage';
import InvoicePage from './pages/InvoicePage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<UserDashboard />} />
          <Route path="/pool/:id" element={<PoolDetailPage />} />
          <Route path="/booking/:poolId" element={<BookingPage />} />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/invoice/:bookingId" element={<InvoicePage />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/register-pool" element={<PoolRegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
