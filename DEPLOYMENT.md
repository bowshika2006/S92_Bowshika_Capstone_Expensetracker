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

## Frontend deployment (Netlify)

The root `netlify.toml` configures Netlify to build the Vite app from `client/`,
publish `client/dist`, and serve the app entry point for client-side routes.

1. Push the repository to GitHub and import it in Netlify using **Add new site**
   → **Import an existing project**.
2. Set these environment variables in the Netlify site's build settings:
   - `VITE_API_URL`: the deployed Render API origin, for example
     `https://your-service.onrender.com` (no trailing slash).
   - `VITE_GOOGLE_CLIENT_ID`: the same Google OAuth web client ID used by the
     Render service's `GOOGLE_CLIENT_ID`.
3. Trigger a deploy. Netlify runs `npm run build` in `client/` and publishes
   `client/dist`.
4. Add the exact Netlify site origin (for example
   `https://your-site.netlify.app`) to the OAuth client's **Authorized
   JavaScript origins** in Google Cloud Console.
5. Set the Render service's `CLIENT_URL` to that exact Netlify origin, then
   redeploy the API. For a custom domain, add its origin to both Google OAuth
   and `CLIENT_URL` as well.
6. Open the deployed site and verify Google login, expense loading, and file
   upload against the deployed API. The Render API's `/` health check should
   return `{"message":"Expense Tracker API is running"}`.

`VITE_*` values are included in the public frontend bundle; do not put secrets
in them. The Google OAuth client ID is public configuration, not a secret.

## Deployment video checklist

Record a video of at least three minutes with the camera on and the entire
screen shared. Show the Netlify build configuration and successful deployment,
then open the deployed frontend and demonstrate it. Explain the build command
(`npm run build`), publish directory (`dist` relative to `client/`), and the
API/OAuth environment settings. Name the recording using the required
`Your name_Squad name_File name` format, share it with "Anyone with the link
can edit" access, and submit its link.
