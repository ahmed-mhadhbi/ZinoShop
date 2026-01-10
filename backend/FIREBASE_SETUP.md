Firebase setup & deployment notes

This project supports four ways to initialize Firebase (see `src/config/firebase.config.ts`):

1) FIREBASE_SERVICE_ACCOUNT (recommended)
   - Set `FIREBASE_SERVICE_ACCOUNT` to the full service account JSON string (one-line, with `\n` inside the private key).
   - Example (in Render/Vercel secrets UI):
     - Key: FIREBASE_SERVICE_ACCOUNT
     - Value: {"type":"service_account","project_id":"zinoshop-8ec06","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"xxx@zinoshop-8ec06.iam.gserviceaccount.com",...}

2) Individual environment variables
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (escape newlines as `\n`)

3) Service account JSON file in the repository (NOT recommended for production)
   - The code will try common paths such as `backend/zinoshop-8ec06-firebase-adminsdk-*.json` if present.
   - Prefer using host secrets instead of checking this file into git.

4) Default credentials (GCP/Emulator)
   - If `GOOGLE_APPLICATION_CREDENTIALS` is set or running on GCP, `admin.initializeApp()` fallback may work.

Deploy notes — Render (backend)
- Add the service (web service) and set environment variables in the Render dashboard:
  - Either `FIREBASE_SERVICE_ACCOUNT` (paste JSON) OR `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
  - Also add `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `NEXT_PUBLIC_API_URL` (frontend URL), and any other secrets.
- Build: `npm run build`, Start: `npm run start:prod` (or start:dev for staging).

Deploy notes — Vercel (frontend)
- Set `NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com` in Vercel project settings (Environment Variables).
- Set additional public keys used client-side (Cloudinary, Stripe publishable key, etc.).

Security tips
- Do not commit private keys or API keys into source control.
- Use the host provider secrets manager and restrict service account permissions to the minimum needed.

Troubleshooting
- If Firebase fails to initialize, check Render/Vercel logs for JSON parse errors or missing `FIREBASE_PRIVATE_KEY` newlines.
- Use `curl https://<backend>/api/health` and `curl https://<backend>/api/products/featured` to confirm backend reachability.

Cache note:
- The backend caches the `/api/products/featured` response in-memory for a short TTL to reduce load and improve latency. Set `FEATURED_CACHE_TTL_SECONDS` (default 60) in Render environment variables to tune the TTL.
