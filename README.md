# QuizSpark

QuizSpark uses a browser frontend, an Express/MySQL API, and MySQL kept entirely on the server side. Live lobby updates use one-second HTTPS polling, so students can join from unrelated networks without a LAN socket connection.

## Local development

1. Run `database_schema.sql` in MySQL.
2. Copy `server/.env.example` to `server/.env` and set the local database values. For direct browser-to-API development, set `FRONTEND_URL=http://localhost:5173`; the default Vite proxy does not require CORS.
3. Start the API from `server`: `npm install` then `npm start`.
4. Start the frontend from the project root: `npm install` then `npm run dev`.

The Vite development proxy uses `VITE_API_URL` when supplied, otherwise it targets the local API on port `5000`. Never put database credentials in a frontend env file.

## Production environment

Frontend (`.env.production` or hosting dashboard):

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN
```

Backend hosting dashboard:

```env
DB_HOST=your-managed-mysql-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root1234
DB_NAME=quizspark
PORT=5000
FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN
NODE_ENV=production
```

`FRONTEND_URL` may contain multiple comma-separated frontend origins when needed. Do not use a local or LAN address for production values. The frontend `VITE_API_URL` must be the public HTTPS URL of the backend, and the backend `DB_HOST` must be the hostname supplied by the managed MySQL provider.

The hosting provider supplies `PORT`; the API listens on it and binds to all interfaces. Do not commit `.env` files or database credentials.

## Render deployment

`render.yaml` describes one Node web service and one static site. A managed external MySQL provider is required because Render web services do not provide MySQL.

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**, select the repository, and apply `render.yaml`.
3. Create the MySQL database/schema using `database_schema.sql` on a managed MySQL provider that permits connections from Render. Add its host, port, user, password, and database name to the `quizspark-api` service.
4. Set `FRONTEND_URL` on `quizspark-api` to the exact HTTPS URL of `quizspark-web`.
5. Set `VITE_API_URL` on `quizspark-web` to the exact HTTPS URL of `quizspark-api`, then redeploy the static site.
6. Add the SPA rewrite on the static site: source `/*`, destination `/index.html`, action **Rewrite**. This keeps `/join/ABC123` working when opened directly.
7. Confirm `https://YOUR-BACKEND-DOMAIN/api/health` returns `{ "ok": true }` before testing the frontend.

The API build command is `npm ci` in `server`; its start command is `npm start`. The frontend build command is `npm ci && npm run build`, publishing `dist`.

## Global live-quiz test

Open the deployed HTTPS frontend, publish a quiz, start its live lobby, and share the generated URL or QR code. The QR URL has the form `https://YOUR-FRONTEND-DOMAIN/join/ABC123`. Open it on mobile data and on two different Wi-Fi networks, join with three names, and verify all three appear in the teacher lobby. Temporarily toggle one device's network off and on; polling retries automatically and the database uniqueness key prevents duplicate participants for the same browser identity and session.

The `live_participants.student_id` foreign key remains `users.id`. The API creates or updates the student user before the participant insert, and `(session_id, student_id)` remains unique.
