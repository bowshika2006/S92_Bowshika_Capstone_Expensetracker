# Expense Tracker API

This Bruno collection documents the Express API in `server/server.js`.

## Run locally

1. Start MongoDB and configure `MONGO_URI`, `JWT_SECRET`, and `GOOGLE_CLIENT_ID` in `server/.env`.
2. From the `server` directory, run `node server.js`.
3. Open this collection in Bruno and select the `Local` environment.
4. Register an account, then run `Login`. A successful login saves the JWT as the environment's `token` variable for protected requests.
5. To update or delete an expense, set `expenseId` in the environment to an ID returned by `Create Expense` or `List Expenses`.

Google Login requires a real Google Identity Services ID token. Upload File requires a local JPG, PNG, or PDF file no larger than 5 MB; replace its sample file path before sending.

## Endpoints

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| GET | `/` | No | API health check |
| POST | `/api/auth/register` | No | Register a local account |
| POST | `/api/auth/login` | No | Log in with email and password |
| POST | `/api/auth/google` | No | Log in with a Google ID token |
| GET | `/api/expenses` | Bearer JWT | List the signed-in user's expenses |
| POST | `/api/expenses` | Bearer JWT | Create an expense |
| PUT | `/api/expenses/:id` | Bearer JWT | Update an expense |
| DELETE | `/api/expenses/:id` | Bearer JWT | Delete an expense |
| POST | `/api/upload` | Bearer JWT | Upload one JPG, PNG, or PDF file |
| GET | `/uploads/:filename` | No | Retrieve an uploaded file |
