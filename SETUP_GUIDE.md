# goSwim - Complete Setup & Usage Guide

## 🚀 Quick Start (5 minutes)

### 1. Google OAuth Setup (First Time Only)

**Get Google Client ID:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" and name it "goSwim"
3. Search for and enable "Google+ API"
4. Click "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Select "Web application"
6. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:3000` (if using other dev server)
7. Copy the **Client ID** (note: NOT the Client Secret)

**Configure Frontend:**
- Open `frontend/.env` (create if doesn't exist)
- Add: `VITE_GOOGLE_CLIENT_ID=your_client_id_here`

### 2. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```
Backend will start at: `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will start at: `http://localhost:5173`

## Features Overview

### 🗺️ Pool Map (`/explore`)
- **What it does:** Shows all registered swimming pools on an interactive map
- **Features:**
  - Geolocation: Centers map on your current location
  - Color-coded markers: Green (clean), Yellow (good), Red (poor)
  - Click any marker to see pool details
  - "View Details" button → full pool page
  - "Book Now" button → booking flow
- **How to use:**
  1. Visit `/explore`
  2. Allow location access when prompted
  3. Click any pool marker
  4. View weather recommendation for that location
  5. Click "View Details" or "Book Now"

### 🌤️ Weather Widget
- **What it does:** Shows current weather and swim safety recommendation
- **Where:** Each pool detail page + explore map
- **Information:**
  - Current temperature (feels like)
  - Humidity level
  - Wind speed
  - Safety recommendation (✅ Safe, ⚠️ Caution, ❌ Not Safe, ❄️ Too Cold)
- **Legend:**
  - 🟢 Green: Perfect for swimming (25-35°C, <80% humidity, no rain)
  - 🟡 Orange: Caution (hot, >35°C)
  - 🔴 Red: Not safe (rainy, extreme conditions)
  - 🔵 Blue: Too cold (<15°C)

### 📅 Booking System (`/booking/:poolId`)
- **Step 1:** Select date, time, duration, number of people
- **Step 2:** Review booking details
- **Step 3:** Proceed to payment
- **Price calculation:** Automatic based on duration × hourly rate
- **Duration options:** 30 min, 1 hr, 1.5 hrs, 2 hrs, 3 hrs

### 💳 Payment System (`/payment/:bookingId`)
- **Payment Methods:**
  - 💳 Card: Enter card details (demo accepts any number)
  - 📱 UPI: Enter UPI ID (redirects to app)
  - 🏪 Wallet: Select from Google Pay, PhonePe, Paytm, Amazon Pay
  - 💰 Cash on Delivery: Pay at pool counter
- **Demo Disclaimer:** Data not actually stored (safe to test)

### 👤 User Profile (`/profile`)
- **Tabs:**
  - **Profile:** View name, email, phone, account type
  - **Settings:**
    - Theme selection: Dark / Light / System Default
  - **Notifications:** Email & push notification preferences
  - **My Bookings:** Your booking history
  - **Payments:** Payment history
- **Logout:** Bottom of profile

### 🔐 Authentication

**Email Login:**
- Demo account: `swimmer@demo.com` / `demo123`
- Works with custom email/password registration

**Google OAuth:**
1. Click "Sign in with Google" button
2. Complete Google's authentication
3. Automatically creates user account and logs in
4. No password needed for Google OAuth accounts

## 🎨 Theme System

**3 Theme Options in Profile → Settings:**
1. **Dark Mode:** Always dark theme (default, recommended)
2. **Light Mode:** Traditional light colors
3. **System Default:** Follows your device settings

Switch between themes anytime - preference saved to localStorage.

## 📍 How Each Feature Works

### Pool Map Loading
1. Backend fetches all pools from database
2. Frontend displays as markers on Leaflet map
3. Marker color = cleanliness score (green/yellow/red)
4. Click marker → popup with pool info
5. Popup shows weather for that location

### Google OAuth Flow
1. You click "Sign in with Google"
2. Google SDK opens authentication dialog
3. You authenticate with Google
4. Token sent to our backend
5. Backend extracts email, name, profile picture
6. User account auto-created if new
7. You're logged in and redirected to /explore

### Booking Price Calculation
```
Total = (Duration in minutes / 60) × Pool's hourly entry fee
```
Example:
- 30 minutes × ₹75/hour = ₹37.50
- 1 hour × ₹75/hour = ₹75
- 2 hours × ₹75/hour = ₹150

## 🔧 Troubleshooting

### "Google is not defined"
- **Cause:** Google Sign-In SDK didn't load
- **Fix:** Check internet connection, allowlist scripts in extensions
- **Check:** Browser console (F12) for errors

### Login redirects to blank page
- **Cause:** Backend not running or /explore doesn't exist
- **Fix:**
  ```bash
  # Terminal 1: Check backend is running
  curl http://localhost:8000

  # Terminal 2: Check frontend /explore route exists
  # Look at frontend/src/App.jsx for /explore route
  ```

### "Invalid token" error on login
- **Cause:** Token not properly stored
- **Fix:**
  ```javascript
  // Check browser console → Application tab → LocalStorage
  // Should have 'token' key with value starting with 'eyJ'
  ```

### Weather not showing
- **Cause:** Open-Meteo API unreachable or no location data
- **Fix:**
  - Check internet connection
  - Allow location access
  - Check backend logs for API errors

### Pool markers not showing
- **Cause:** No pools in database or map not loading
- **Fix:**
  ```bash
  # Create pool via API
  curl -X POST http://localhost:8000/pools \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Pool","address":"Test","city":"Test","latitude":17.3850,"longitude":78.4867,"entry_fee":75,"is_open":true,"capacity":50}'
  ```

## 📊 Demo Data

**Test Accounts:**
```
Email: swimmer@demo.com
Password: demo123
Role: Swimmer

Email: owner@demo.com
Password: demo123
Role: Owner (can register pools)
```

**Test Pool (if needed):**
- Name: Test Pool
- Location: Hyderabad (17.3850, 78.4867)
- Entry Fee: ₹75/hour
- Capacity: 50 people

## 🔒 Security Notes

### Production Checklist (Before Deploying)
- [ ] Set VITE_GOOGLE_CLIENT_ID in production environment
- [ ] Enable JWT token verification in backend auth
- [ ] Use real payment gateway (Stripe, Razorpay)
- [ ] Enable HTTPS/SSL
- [ ] Set strong JWT secret in .env
- [ ] Implement rate limiting on auth endpoints
- [ ] Hash passwords with proper algorithm
- [ ] Validate all user inputs server-side

### Current Limitations (MVP)
- Google OAuth JWT decoded WITHOUT verification
- Payment data not actually stored
- No HTTPS
- SQLite in development (should use PostgreSQL)
- Demo mode auth for testing

## 📱 Browser Compatibility
- ✅ Chrome/Edge (fully tested)
- ✅ Firefox (fully tested)
- ✅ Safari (should work)
- ✅ Mobile browsers (responsive design)

## 🎯 Common User Flows

### New User Registration
1. Click "Sign Up" on landing page
2. Enter name, email, password, select role (swimmer/owner)
3. Click register
4. Redirect to login
5. Login with email/password
6. Redirect to /explore

### Alternative: Google OAuth Sign Up
1. Click "Sign in with Google" on login
2. Authenticate with Google
3. Account auto-created
4. Instantly logged in to /explore

### Booking a Pool
1. Go to /explore (Pool Map)
2. Click pool marker
3. Click "Book Now"
4. Select date, time, duration, people count
5. Click "Continue to Review"
6. Verify details
7. Click "Proceed to Payment"
8. Select payment method
9. Complete payment
10. Redirect to "My Bookings"

### Checking Weather Before Swimming
1. Go to /explore
2. View weather widget in top section OR
3. Click pool marker to see pool-specific weather
4. Check safety recommendation
5. Make informed decision

## 📖 File Structure Reference

```
goSwim/
├── backend/
│   ├── main.py                 # FastAPI app entry
│   ├── routers/
│   │   ├── auth.py            # Auth + Google OAuth endpoint
│   │   ├── pools.py           # Pool endpoints
│   │   ├── bookings.py        # Booking endpoints
│   │   ├── payments.py        # Payment endpoints
│   │   └── weather.py         # Weather endpoints
│   ├── models/                # Database models
│   └── db/
│       └── database.py        # Database connection
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx       # Auth + Google OAuth
│   │   │   ├── PoolDetailPage.jsx  # Pool details + weather
│   │   │   ├── BookingPage.jsx     # Booking wizard
│   │   │   ├── PaymentPage.jsx     # Payment gateway
│   │   │   └── ProfilePage.jsx     # User profile + theme
│   │   ├── components/
│   │   │   ├── PoolMap.jsx        # Map with all pools
│   │   │   ├── WeatherWidget.jsx  # Weather + swim recommendation
│   │   │   └── PoolCard.jsx       # Pool card display
│   │   └── hooks/
│   │       ├── useAuth.js         # Auth hook
│   │       └── usePoolData.js     # Pool data hook
│   ├── .env                   # Configuration (add VITE_GOOGLE_CLIENT_ID)
│   └── .env.example          # Template
│
├── GOOGLE_OAUTH_SETUP.md     # Detailed Google OAuth guide
└── README.md                 # This file
```

## 🚀 Need Help?

### For Google OAuth Issues
- See: `GOOGLE_OAUTH_SETUP.md`

### For Backend Issues
```bash
cd backend
python -m uvicorn main:app --reload --log-level debug
```

### For Frontend Issues
```bash
cd frontend
npm run dev -- --debug
```

Then check browser console (F12) for errors.

---

**Status:** ✅ All features implemented and tested
**Last Updated:** 2026-04-08
**Version:** 1.0.0 (MVP)
