# Pennywise Expense Tracker

The frontend requires an account to open the expense dashboard. Sign in with an
existing account or create one from the sign-in page. Authentication uses the
Express API in `server/`; expense entries are saved in the current browser for
each account and are not synced to other devices.

## Run locally

From this directory:

```sh
npm install
npm run dev
```

Start the API in `server/` and configure its required environment variables
before signing in. During local development, Vite forwards `/api` requests to
`http://localhost:5000`. Set `VITE_API_URL` to the API origin when the frontend
and API are deployed separately. Open the local URL printed by Vite, then sign
in or create an account. To create a production build, run `npm run build`.
