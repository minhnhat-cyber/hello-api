# Authentication submission

## Run locally

Backend: `npm install`, configure `.env.local`, then `npm run dev` (port 3000).
Required variables: MONGODB_URI, DB_NAME, JWT_SECRET, ADMIN_USER, ADMIN_PASS.
Frontend: `npm install`, then `npm run dev -- --port 5173 --strictPort`.
Optional frontend variable: VITE_API_URL=http://localhost:3000.
Open http://localhost:5173/#/login.
Never commit real environment files or credentials.

## Rules implemented

- Username and password are required; username is trimmed.
- Invalid credentials return 401 and do not issue a cookie.
- Admin credentials come from environment variables; database passwords use bcrypt.
- Successful login issues an HttpOnly JWT cookie.
- The frontend restores its session using GET /api/me.
- Item APIs require a valid JWT, including direct API requests.
- Expired or invalid tokens return 401 and protected pages return to Login.
- POST /api/auth/logout expires the cookie; the original GET route remains compatible.
- Logout clears frontend state. Refreshing a protected page after logout returns to Login.
- This exercise requires authentication for Items; it does not introduce an admin-only role policy.

## Verification

Both projects pass lint and production build.
Run `node scripts/test-auth.cjs` from the backend with the backend running.
The script checks 26 cases and creates one temporary Item, then soft-deletes it.
Database user login with bcrypt was also checked using a temporary account, which was removed.
Browser checks passed: empty form, invalid password, successful login, refresh, logout, protected-page rejection.
JWT logout clears the browser cookie; it does not revoke a separately copied JWT before its expiry.

## Required screenshots

Saved screenshots cover form validation, failed login, logged-in state after refresh, and protected-page rejection after logout.
The DevTools cookie screenshots still need to be captured in Chrome or Edge:

1. Open http://localhost:5173/#/login and press F12.
2. Select Application > Storage > Cookies > http://localhost:5173.
3. Log in. Capture the page and the token cookie row, including Value, Path, Expires/Max-Age and HttpOnly.
4. Click Log out. Capture the Login page and the cookie table with the token row removed.
5. Do not share passwords or environment files in screenshots.

## Repository links

Frontend: https://github.com/minhnhat-cyber/hello_api_frontend
Backend: https://github.com/minhnhat-cyber/hello-api

Local changes have not been committed or pushed. Upload the completed source before submitting repository links.