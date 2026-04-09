# 🚀 Quick Start - 5 Minutes

## Step 1: Google OAuth Setup (First Time Only)

1. Go to https://console.cloud.google.com/
2. Create project → Enable Google+ API
3. Credentials → Create OAuth 2.0 Client ID (Web)
4. Add localhost origins: `http://localhost:5173` and `http://localhost:3000`
5. Copy the **Client ID**

Create `frontend/.env`:
```
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_API_URL=http://localhost:8000
```

## Step 2: Run Everything

**Terminal 1:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

## Step 3: Test

Visit: http://localhost:5173

✅ Try email login: `swimmer@demo.com` / `demo123`
✅ Or try Google OAuth
✅ Go to `/explore` to see pool map
✅ Click pool marker to see weather
✅ Try "Book Now" to test booking
✅ Visit profile to change theme

## That's It! 🎉

All features working:
- ✅ Pool map with all pools
- ✅ Weather with swim recommendations
- ✅ Google OAuth
- ✅ Complete booking
- ✅ Payment system
- ✅ Theme selection
- ✅ Dark theme by default

---

## For Detailed Guides:
- `SETUP_GUIDE.md` - Complete setup & features
- `GOOGLE_OAUTH_SETUP.md` - OAuth details
- `FEATURES_COMPLETED.md` - All features summary

Need help? Check the troubleshooting section in SETUP_GUIDE.md
