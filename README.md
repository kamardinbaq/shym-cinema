# SHYM CINEMA

> *"Book your nightmare. Three rooms. No escape."*

A modern, serverless cinema and quest booking platform built with **Next.js 14** + **Supabase (PostgreSQL)**, deployable on **Vercel** (free/hobby tier).

---

## Architecture

- **Frontend & API**: Next.js 14 App Router (React 18, TypeScript, Tailwind CSS)
- **Database**: Supabase PostgreSQL (Rooms, Time Slots, Slot Reservations, Reviews, Settings, Admins)
- **Authentication**: `jose` JWT session cookies for Admin access + `bcryptjs` password hashing
- **Deployment**: Vercel (Frontend + Serverless API Routes) + Supabase (Database & RLS)

---

## Project Structure

```
shym-cinema/
├── frontend/                   Next.js 14 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        Cinema booking & main page
│   │   │   ├── quest/page.tsx  Quest booking page
│   │   │   ├── admin/page.tsx  Admin dashboard
│   │   │   └── api/            Serverless API routes
│   │   │       ├── availability/
│   │   │       ├── reviews/
│   │   │       ├── settings/
│   │   │       └── admin/
│   │   ├── components/         ReservationGrid, Reviews, BottomNav
│   │   ├── lib/
│   │   │   ├── supabase/       Supabase client & data access layer
│   │   │   ├── api.ts          Fetch wrapper for API routes
│   │   │   ├── auth.ts         JOSE JWT cookie authentication
│   │   │   └── store.ts        Zustand admin state store
│   │   └── types/              TypeScript interfaces
│   └── supabase-schema.sql     Supabase SQL DDL & initial seed data
└── README.md
```

---

## Quick Start (Local Development)

### 1. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor in Supabase and run the script in `frontend/supabase-schema.sql`.

### 2. Environment Variables

Create `.env.local` inside `frontend/` (or `.env` in project root):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

ROOT_ADMIN_USERNAME=admin
ROOT_ADMIN_PASSWORD=your-secure-password
ADMIN_JWT_SECRET=your-random-32-character-secret
```

### 3. Run Locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project in Vercel. Set the Root Directory to `frontend`.
3. Add the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ROOT_ADMIN_USERNAME`, `ROOT_ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`).
4. Click **Deploy**.
