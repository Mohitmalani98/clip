# NyX Netlify API

This project contains the backend API and frontend for the NyX Browser application, built with Next.js and Netlify Functions.

## API Endpoints (`/functions/auth.js`)

All endpoints are prefixed with `/api`.

### Admin
- `POST /api/admin/login`
  - Body: `{ "username": "...", "password": "..." }`
  - Returns: `{ "status": "success", "token": "..." }`
- `GET /api/admin/users`
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ "status": "success", "users": [...] }`
- `GET /api/admin/trials`
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ "status": "success", "trials": [...] }`
- `POST /api/admin/create_user`
  - Body: `{ "token": "...", "username": "...", "password": "...", "expiresAt": 1234567890 }`
  - Returns: `{ "status": "success" }`
- `POST /api/admin/delete_user`
  - Body: `{ "token": "...", "username": "..." }`
  - Returns: `{ "status": "success" }`

### User
- `POST /api/authenticate`
  - Body: `{ "username": "...", "password": "..." }`
  - Returns: `{ "status": "success", "username": "...", "role": "user" }`
- `POST /api/trial/start`
  - Body: `{ "hwid": "..." }`
  - Returns: `{ "status": "success", "trialMinutes": 3 }`
- `GET /api/clipboard/:username`
  - Returns: `{ "status": "success", "copied_text_history": [...] }`
- `POST /api/submit_copied_text/:username`
  - Body: `{ "text": "..." }`
  - Returns: `{ "status": "success" }`

## Running Locally

1.  Install dependencies: `npm install`
2.  Set up environment variables in a `.env.local` file:
    ```
    SUPABASE_URL=...
    SUPABASE_ANON_KEY=...
    ADMIN_USER=admin
    ADMIN_PASS=your_secure_password
    ```
3.  Run the development server: `npm run dev`

The app will be available at `http://localhost:3000`.
The Netlify functions will be served by the Next.js dev server.

## Deployment

Deploy to Netlify. The `netlify.toml` file is configured to route `/api/*` requests to the Netlify function.
