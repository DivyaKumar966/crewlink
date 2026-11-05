# Backend setup

1. `npm install`
2. Copy `.env.example` to `.env`
3. Set `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and `CLIENT_URL`
4. `npm run dev`

After your first Google login, make your account an admin:
`npm run make-admin -- your-google-email@gmail.com`

Keep `.env` private. Never put MongoDB passwords or JWT secrets in frontend files.

Email/password auth is included and uses Node.js scrypt with a per-user salt. Keep `.env` private.
