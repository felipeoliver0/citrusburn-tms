# AxleGrid TMS

Transportation Management System for auto transport — connects **Brokers (Shippers)**, **Carriers**, and **Drivers** in a single platform.

## Features

- **Loadboard** with search, map view, and pagination
- **Load booking** — carriers bid, brokers approve/reject
- **Fleet management** — carriers manage drivers
- **GPS tracking** with location history
- **Pickup/delivery inspections** — photos, VIN, damage map, signatures
- **Chat, reviews, notifications**
- **PDF generation** — BOL, contract, invoice
- **Role-based dashboards** with analytics
- **PWA** — installable on mobile (production builds)
- **Stripe subscriptions** for carriers (optional, env-gated)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Database | PostgreSQL + Prisma |
| Auth | JWT (jose) + bcrypt |
| Storage | Vercel Blob (with Base64 fallback) |
| Cache / Rate limit | Upstash Redis |
| Email | Resend |
| Maps | Leaflet + OpenStreetMap |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon, Supabase, etc.)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Generate Prisma client and apply migrations
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See [`.env.example`](.env.example) for the full list. Required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | `openssl rand -base64 32` |

Optional but recommended for production:

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL/TOKEN` | Rate limiting (falls back to in-memory) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob for inspection photos |
| `RESEND_API_KEY` | Email verification |
| `CRON_SECRET` | Vercel Cron auth for GPS cleanup |
| `STRIPE_SECRET_KEY` | Carrier billing |
| `STRIPE_PRICE_ID` | Stripe subscription price |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `NEXT_PUBLIC_APP_URL` | App URL for Stripe redirects |

## User Roles

| Role | Access |
|------|--------|
| **BROKER** | Post loads, approve carrier requests, analytics |
| **CARRIER** | Loadboard, fleet, dispatch (14-day trial, then Stripe) |
| **DRIVER** | Active routes, GPS tracking, inspections |
| **ADMIN** | User management panel |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build (prisma generate + next build)
npm run start    # Production server
npm run lint     # ESLint
npm run test     # Vitest unit tests
```

## Deployment (Vercel)

1. Connect repo to Vercel
2. Set all environment variables
3. `vercel.json` configures the daily GPS cleanup cron
4. Configure Stripe webhook: `POST /api/stripe/webhook`

## Project Structure

```
app/
  (protected)/     # Authenticated routes (dashboard, loadboard, fleet, driver)
  api/             # REST endpoints (loads, tracking, stripe, cron)
  components/      # Shared UI components
lib/
  auth.ts          # JWT sign/verify
  dal.ts           # Session helpers
  rbac.ts          # Route-level role checks
  blobStorage.ts   # Vercel Blob uploads
  subscription.ts  # Trial & billing logic
  pricing.ts       # Rate suggestions
prisma/
  schema.prisma    # Database schema
middleware.ts      # Auth + RBAC
```

## License

Private — All rights reserved.
