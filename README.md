# SkillConnect

SkillConnect is a local services marketplace. Customers search for professionals such as electricians, plumbers, and tutors, then request a time. Providers accept the job, move it through a fixed status workflow, and receive a review only after the job is completed.

The project is a separated React frontend and Express API. It does not process payments.

## Problem

People looking for nearby help need a clear way to compare a service, see who provides it, and book a time without creating a double-booked schedule. Providers need a place to list work, accept requests, and see real counts from their bookings. An admin needs to disable accounts and listings and review reports.

## Features

- Account registration, login, logout, email verification, password reset, and password change
- Customer search with category, city, price, rating, and sort
- Service details with a booking panel and live open time slots
- Provider profiles, services, weekly hours, and a dashboard built from database counts
- Booking requests with a price snapshot and enforced status changes
- Conflict check when a provider accepts a time that is already taken
- One review per completed booking, with the provider rating recalculated from reviews
- In-app notifications
- Admin users, providers, categories, listings, bookings, and reports
- Image upload through Cloudinary when it is configured

## Roles

| Role | What they can do |
| --- | --- |
| Customer | Search, book, cancel eligible bookings, review completed work |
| Provider | Profile, services, availability, accept or reject, start and complete jobs |
| Admin | Platform counts, enable or disable users, hide listings, manage categories and reports |

Admin accounts are created by the seed script. Public registration only allows customer or provider.

## Tech stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT in an HttpOnly cookie, passwords hashed with bcrypt (via `bcryptjs`, the bcrypt algorithm without a native build)
- Validation: Zod
- Images: Cloudinary
- Email: Resend, with a development fallback that prints the link in the API console
- Tests: Vitest and Supertest

JavaScript only. No TypeScript.

## Architecture

The browser talks only to the Express API. The API checks the cookie, loads the user, and enforces role and ownership before any write. Ratings, completed-job counts, and dashboard numbers are calculated on the server from bookings and reviews. The client never sends `averageRating`.

A booking stores `priceSnapshot` so a later price change does not rewrite history. A provider can accept a slot only when no other accepted or in-progress booking already uses that provider, date, and time.

```
browser  ->  Vite React app  ->  /api  ->  Express  ->  MongoDB
                                      ->  Cloudinary
                                      ->  Resend
```

## Folder structure

```
frontend/src
  components/   shared controls, layout, service cards
  pages/        public, auth, customer, provider, admin
  context/      session
  services/     Axios client
backend/src
  models/       Mongoose models
  routes/       REST routers
  controllers/  request handlers
  schemas/      Zod schemas
  services/     email, uploads, booking rules, ratings
  middleware/   auth, validation, errors, rate limits
  tests/        API tests
```

## Installation

Use Node.js 20 or newer.

```bash
cd backend
npm install
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env`.

```bash
cd frontend
npm install
copy .env.example .env
```

## Environment variables

Backend (`.env`):

- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — long random string
- `FRONTEND_URL` — frontend origin, used for CORS and email links
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — used only by `npm run seed`. There is no default password.
- `DEMO_PROVIDER_PASSWORD`, `DEMO_CUSTOMER_PASSWORD` — used only by `npm run seed:demo`
- `SEED_DEMO=true` — required to allow the demo seed when `NODE_ENV=production`

Frontend:

- `VITE_API_URL` — API base, for example `http://localhost:5000/api`
- `VITE_SITE_URL` — optional public site origin, for example `https://your-domain.example`. When set, the app adds canonical and social URLs. Leave it unset until the domain is connected. Do not invent a host.

Do not commit `.env`.

## MongoDB Atlas

1. Create a free cluster and a database user.
2. Allow your IP, or `0.0.0.0/0` only if you understand the risk.
3. Copy the connection string into `MONGODB_URI`.
4. Seed categories, and an admin only if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set:

```bash
cd backend
npm run seed
```

5. Seed demo listings. This does not delete existing data and does not reset passwords that are already stored. It refuses to run in production unless `SEED_DEMO=true`.

```bash
cd backend
npm run seed:demo
```

Set `DEMO_PROVIDER_PASSWORD` first. The command creates these provider emails and uses that password. It does not print the password.

- `demo.studio@skillconnect.demo`
- `demo.desk@skillconnect.demo`
- `demo.tutor@skillconnect.demo`
- `demo.home@skillconnect.demo`

If `DEMO_CUSTOMER_PASSWORD` is set, it also creates `demo.customer@skillconnect.demo`. Listings are marked Demo listing in the interface. They do not include fake reviews or ratings.

## Cloudinary

Create a cloud and put the cloud name, API key, and API secret in the backend `.env`. The browser never receives the API secret. Profile and service images are uploaded by the API. A service can have up to five images, JPG, PNG, or WEBP, 5 MB each. Without these variables, the rest of the app still runs and uploads return a clear error.

## Email

Add a Resend API key and a verified `EMAIL_FROM` address. Without a key, development prints the verification or reset link in the backend terminal so you can still finish the flow.

## Run locally

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## Testing

```bash
cd backend
npm test
```

Tests use an in-memory MongoDB server. They cover registration, login, protected routes, role checks, service ownership, booking creation, illegal status changes, review rules, slot conflicts, and one customer reading another customer's booking.

Frontend production build:

```bash
cd frontend
npm run build
```

## Security decisions

- Passwords are hashed. `passwordHash` is excluded from API responses.
- The session JWT is an HttpOnly cookie. It is not stored in localStorage. `secure` and `sameSite=none` are used in production so a separate frontend host can send the cookie.
- Each request loads the user from the database, so a disabled account cannot keep using an old token.
- Login and password-reset responses do not reveal whether an email exists, except registration, which must say the email is taken.
- Reset and verification tokens are random and only their SHA-256 hashes are stored.
- Zod validates inputs. List filters are explicit fields, not a raw query object passed to Mongoose.
- Helmet, CORS allowlist, JSON body limit, and rate limits are enabled.
- Private bookings return 404 when the caller is not the customer, provider, or an admin.

## API overview

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/auth/register` `/login` `/logout` | Public, logout clears the cookie |
| GET | `/api/auth/me` | Signed in |
| POST | `/api/auth/verify-email` `/forgot-password` `/reset-password` | Public |
| PATCH | `/api/auth/change-password` `/api/auth/me` | Signed in |
| GET | `/api/services` `/api/services/:id` | Public, paginated search |
| POST PATCH DELETE | `/api/services` | Provider, owner only for edits |
| GET | `/api/categories` | Public |
| POST | `/api/bookings` | Customer |
| GET | `/api/bookings/me` `/api/bookings/:id` | Owner |
| PATCH | `/api/bookings/:id/status` | Customer cancel, or provider workflow |
| POST | `/api/reviews` | Customer, completed booking, once |
| GET PATCH | `/api/notifications` | Signed in |
| GET | `/api/admin/stats` and other `/api/admin/*` | Admin |

Success responses use `{ "success": true, "data": ... }`. Failures use `{ "success": false, "message": "..." }`.

## Screenshots

Add interface screenshots here after you run the app:

- Homepage search
- Service results
- Service detail and booking card
- Provider dashboard
- Admin users

## Deployment

Do not deploy from this step automatically. Use these commands and variables when you are ready.

Frontend on Vercel:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment: `VITE_API_URL=https://YOUR_RENDER_HOST/api`

Backend on Render:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- `NODE_ENV=production`
- `MONGODB_URI` — Atlas connection string
- `JWT_SECRET` — long random string, backend only
- `FRONTEND_URL` — the Vercel origin, for example `https://your-app.vercel.app`. Local development uses `http://localhost:5173`. Separate extra origins with commas. Do not point this at port 5174.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — optional. Without them, image upload returns a clear error and the rest of the app still runs.
- `RESEND_API_KEY`, `EMAIL_FROM` — optional. Without them, registration still works and the API says that email was not sent. In development the link is printed in the API console.

MongoDB stays on Atlas. Demo images are SVG files served by the API at `/demo`, so they do not depend on Cloudinary.

Leave `SEED_DEMO` unset in production. Run `npm run seed:demo` only against a database you intend to fill with sample listings, and supply passwords through the environment.

### Custom domain

No domain is connected in this repository. When you have one:

1. Point the domain at the Vercel project for `frontend`. Confirm the live site URL in the browser before treating it as connected.
2. Set Vercel `VITE_SITE_URL` to that exact origin, including `https://`, with no trailing slash. Rebuild the frontend. That value is used for canonical and social URLs. It is not a DNS change.
3. Set Render `FRONTEND_URL` to the same origin. Add any extra origins, such as a `www` host, as a comma-separated list. Local development still allows `http://localhost:5173` when `NODE_ENV` is not `production`.
4. Keep `VITE_API_URL` pointed at the Render API, including `/api`.
5. The production session cookie is `Secure` and `SameSite=None` because the site and API are on different hosts. Do not change that unless you later serve both from one site.
6. `frontend/vercel.json` rewrites every path to `index.html` so routes such as `/privacy-policy` survive a refresh.
7. `frontend/public/robots.txt` asks crawlers to skip account, booking, provider, admin, and auth paths. Add a sitemap only after the domain exists, and use absolute URLs. Do not list private dashboards.

Privacy and terms pages are reviewable drafts. They need a legal entity, address, contact email, jurisdiction, and retention period before they can be treated as final policies.

## Known limitations

- No payments, chat, or live notification socket
- The provider hours form saves one window per day. The API accepts up to three.
- A booking blocks one clock hour inside that window
- "Top rated" sorts by stored rating and review count. There is no recommendation model
- Email and image uploads need Resend and Cloudinary. Missing keys return a visible message instead of a fake success
- The schema has one description field, a price, and a pricing type. Delivery time and focus areas are written into the description and "what is included" list. There is no separate tags field
- Demo listings are samples. They are not claims that a real professional offers the work

## Future improvements

- Refresh-token rotation
- More than one hours window in the provider form
- Provider reply to a review
- Stronger audit history for admin actions
