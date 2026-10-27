# Backend deployment (Render)

The root `render.yaml` is a Render Blueprint for the Express API in `server/`.
It installs from `server/package-lock.json`, starts `server.js`, and uses `/`
as its health check.

## Deploy

1. Push this branch to GitHub and open the repository in Render.
2. Choose **New +** → **Blueprint** and select this repository and branch.
3. Review the `expensetracker-api` web service. During setup, enter the
   `MONGO_URI` for a reachable MongoDB database and the Google OAuth web
   client ID for `GOOGLE_CLIENT_ID`. Render generates `JWT_SECRET`.
4. Deploy the Blueprint and wait for the service health check to pass.
5. Open the service's `/` URL; it should return
   `{"message":"Expense Tracker API is running"}`.

The server listens on Render's `PORT`, binds to all network interfaces, and
trusts Render's HTTPS proxy when generating uploaded-file URLs. The default
`CLIENT_URL` allows local development. After deploying the frontend, update
`CLIENT_URL` in the Render service environment to its exact origin (or a
comma-separated list of origins) and redeploy.

The free web service's local disk is ephemeral. Uploaded receipts stored in
`server/uploads` may be lost when the service restarts or redeploys. Use
persistent object storage before relying on uploaded files in production.
