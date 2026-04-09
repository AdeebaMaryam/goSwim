# Google OAuth Setup Guide for goSwim

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project called "goSwim"
3. Enable the "Google+ API"
4. Go to "Credentials" and create an OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for Vite dev)
     - `http://localhost:3000` (for other dev)
   - Authorized redirect URIs: (not strictly needed for implicit flow)
     - `http://localhost:5173/explore`
     - `http://localhost:3000/explore`

5. Copy the **Client ID** (not the secret)

## Step 2: Configure Frontend

Create `.env` file in `frontend/` directory:

```
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
VITE_API_URL=http://localhost:8000
```

## Step 3: How It Works

1. **Frontend (LoginPage.jsx)**:
   - Loads Google Sign-In SDK from Google's CDN
   - Renders Google Sign-In button
   - On successful sign-in, sends the JWT credential to backend at `/auth/google-login`

2. **Backend (routers/auth.py)**:
   - Receives Google JWT token
   - Decodes the JWT payload to extract user info (email, name, picture)
   - Checks if user exists in database
   - Creates new user if needed
   - Returns goSwim access token
   - Frontend stores token in localStorage and redirects to `/explore`

## Step 4: Testing

1. Start backend:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Go to `http://localhost:5173/login`
4. Click "Sign in with Google"
5. Complete Google sign-in
6. Should be redirected to `/explore`

## Important Notes

### JWT Token Decoding
The current implementation decodes the Google JWT token **without verification** for the MVP. This is acceptable for development but **NOT for production**.

For production, you should:
- Install `google-auth-library-python-rfc3339` or similar
- Verify the signature using Google's public keys
- Check token expiration and claims

### Token Claims in JWT
The Google JWT contains:
- `sub`: User's Google ID
- `email`: User's email address
- `name`: User's full name
- `picture`: User's profile picture URL
- `email_verified`: Boolean indicating email verification
- And others...

### Security
- The Google Client ID is public (safe to expose in frontend)
- The Client Secret should NEVER be exposed (keep in backend only)
- For this MVP, we decode without verification - add verification before production

## Troubleshooting

### "Google is not defined"
- Check that the Google Sign-In SDK script loaded correctly
- Check browser console for CORS issues
- Wait for document.onload to fire

### "Invalid token format"
- Ensure the token has 3 parts separated by dots
- Check Base64 padding

### Login goes to blank page
- Check if `/explore` page exists
- Check browser console for JavaScript errors

## Alternative: Backend Verification (Production)

If you want to verify tokens in the backend:

```bash
pip install google-auth
```

Then replace the JWT decoding in `auth.py` with:

```python
from google.auth.transport import requests
from google.oauth2 import id_token

id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
```

This is more secure and recommended for production deployments.
