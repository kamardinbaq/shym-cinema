First run / after dependency changes


docker-compose up --build
Normal start (reuse existing containers)


docker-compose up
Same but in background (free up the terminal)


docker-compose up -d
Watch logs after starting in background


docker-compose logs -f
# or for a specific service:
docker-compose logs -f backend
docker-compose logs -f frontend
Restart one service (e.g. after backend code change)


docker-compose restart backend
Rebuild and restart only one service (e.g. after adding a dependency to pom.xml)


docker-compose up --build backend
Stop all containers (keeps data, fast resume)


docker-compose stop
Full reset (removes containers, keeps DB volume)


docker-compose down
Full reset including database data


docker-compose down -v
Open a shell inside a container (useful for debugging)


docker-compose exec backend bash
docker-compose exec postgres psql -U postgres -d horror_cinema
Check container status


docker-compose ps


# Horror Cinema Reservation System

> *"Book your nightmare. Three rooms. No escape."*

A production-ready cinema reservation platform built with **Spring Boot 3** + **Next.js 14** featuring JWT authentication, pessimistic locking to prevent double-booking, and automated Kaspi payment verification via a Telegram bot.

---

## Project Structure

```
cinema/
├── backend/                    Spring Boot 3 / Java 17
│   ├── src/main/java/com/cinema/
│   │   ├── config/             SecurityConfig, RateLimitFilter, CORS
│   │   ├── controller/         REST controllers (Auth, Reservation, Admin, Availability)
│   │   ├── dto/                Request / Response DTOs
│   │   ├── entity/             JPA entities (User, Room, TimeSlot, Reservation, Payment, UsedReceipt)
│   │   ├── exception/          GlobalExceptionHandler + custom exceptions
│   │   ├── repository/         Spring Data JPA repositories
│   │   ├── security/           JwtUtils, JwtAuthFilter, UserDetailsServiceImpl
│   │   ├── service/impl/       Business logic (ReservationService, AdminService, AuthService, ...)
│   │   └── telegram/           TelegramBotService, TelegramBotProperties
│   └── src/main/resources/
│       ├── application.yml
│       └── db/
│           ├── schema.sql      DDL (tables + indexes)
│           └── data.sql        Seed: rooms, time slots, admin user
├── frontend/                   Next.js 14 / TypeScript
│   └── src/
│       ├── app/
│       │   ├── page.tsx        Main booking page
│       │   ├── info/page.tsx   Levels, rules, contacts
│       │   └── admin/page.tsx  Admin dashboard
│       ├── components/booking/ ReservationGrid, BookingModal, PaymentModal,
│       │                       MyReservations (with countdown timer), AuthModal
│       ├── lib/                axios API client, Zustand auth store
│       └── types/              TypeScript interfaces
└── docker-compose.yml
```

---

## Quick Start

### Option 1 — Docker Compose (recommended)

```bash
# From project root:
TELEGRAM_BOT_TOKEN=<your_token> docker-compose up --build
```

Or create a `.env` file next to `docker-compose.yml`:
```
TELEGRAM_BOT_TOKEN=<your_token>
```
Then run:
```bash
docker-compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8080 |
| Database | localhost:5432        |

---

### Option 2 — Manual (no Docker)

**Terminal 1 — Database only:**
```bash
docker-compose up postgres
```

**Terminal 2 — Backend:**
```bash
cd backend
TELEGRAM_BOT_TOKEN=<your_token> \
JWT_SECRET=horrifyingSecretKeyThatMustBeAtLeast256BitsLongForHMACSHA256Security \
./mvnw spring-boot:run
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Default Credentials

| Role  | Username   | Password    |
|-------|------------|-------------|
| Admin | `baqadmin` | `12341234`  |
| User  | `demouser` | `User@1234` |

---

## Rooms & Schedule

| Room                 | Capacity | Min People | Time Slots                              |
|----------------------|----------|------------|-----------------------------------------|
| Живая комната        | 8        | 2          | 13:00 15:00 17:00 19:00 21:00 23:00 01:00 03:00 |
| Пассажирская комната | 14       | 4          | 13:00 15:00 17:00 19:00 21:00 23:00 01:00 03:00 |
| Мертвая комната      | 6        | 2          | 14:00 16:00 18:00 20:00 22:00 00:00 02:00 04:00 |

All sessions are **2 hours**. Price: **3 500 ₸** flat.

---

## Payment Flow

Payments go through **Kaspi Pay** and are verified automatically by the Telegram bot — no admin action needed.

```
1. User books a slot → status: PENDING
2. User pays 3 500 ₸ via the Kaspi QR link on the site
3. User opens @DarkCinemaChequeBot in Telegram
4. User sends their reservation ID (e.g. "42")
5. Bot replies: "ID saved. Now share the receipt from Kaspi."
6. User opens Kaspi app → finds the Dark Cinema payment → taps Share → selects the bot
7. Bot downloads the PDF receipt and verifies:
   - Seller IIN matches Dark Cinema (990811301225)
   - Amount == 3 500 ₸
   - Receipt number has never been used before
8. Bot confirms the reservation → status: CONFIRMED
9. Frontend updates automatically within 8 seconds (background poll)
```

If the user does not confirm payment within **15 minutes**, the reservation expires automatically and the slot is freed.

---

## Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather): `/newbot`
2. Copy the token
3. Set the `TELEGRAM_BOT_TOKEN` environment variable (see Quick Start above)

The bot uses **long-polling** — no webhook setup required. It starts automatically with the Spring Boot application.

---

## API Reference

### Authentication

#### POST /api/auth/register
```json
// Request
{ "username": "john", "password": "Horror@2024", "phone": "+77001234567" }

// Response 201
{
  "success": true,
  "data": { "token": "eyJ...", "username": "john", "role": "USER", "expiresIn": 86400000 }
}
```

#### POST /api/auth/login
```json
// Request
{ "username": "john", "password": "Horror@2024" }

// Response 200
{ "success": true, "data": { "token": "eyJ...", "role": "USER" } }
```

---

### Availability

#### GET /api/availability?date=2026-04-10
```json
{
  "success": true,
  "data": {
    "date": "2026-04-10",
    "sessionPrice": 3500,
    "rooms": [
      {
        "roomId": 1, "roomName": "Живая комната",
        "slots": [
          { "timeSlotId": 1, "startTime": "13:00", "endTime": "15:00", "status": "AVAILABLE" },
          { "timeSlotId": 2, "startTime": "15:00", "endTime": "17:00", "status": "RESERVED" }
        ]
      }
    ]
  }
}
```

---

### Reservations (JWT required)

#### POST /api/reservations
```json
// Request
{ "roomId": 1, "timeSlotId": 3, "reservationDate": "2026-04-15", "peopleCount": 4, "notes": "" }

// Response 201
{ "success": true, "data": { "id": 42, "status": "PENDING", ... } }
```

A user can only have **one PENDING reservation at a time**. Attempting to create a second one while a previous is unpaid returns a 400 error.

#### GET /api/reservations
Returns all reservations for the authenticated user.

#### DELETE /api/reservations/{id}
Cancels a reservation (owner or admin). Frees the slot immediately.

---

### Admin (ADMIN role required)

#### GET /api/admin/reservations
#### GET /api/admin/reservations?date=2026-04-15
#### GET /api/admin/reservations?roomId=1&date=2026-04-15
#### PATCH /api/admin/reservations/{id}/confirm
#### DELETE /api/admin/reservations/{id}

#### POST /api/admin/reservations
```json
{
  "userId": 2, "roomId": 1, "timeSlotId": 3,
  "reservationDate": "2026-04-15", "peopleCount": 2,
  "skipPayment": true
}
```
When `skipPayment: true` the reservation is created directly as CONFIRMED (for admin walk-ins).

---

## Security

| Threat | Protection |
|--------|------------|
| Double-booking race condition | `PESSIMISTIC_WRITE` DB lock on slot row |
| Holding multiple slots without paying | Only 1 PENDING reservation allowed per user |
| Fake/reused Kaspi receipts | Seller IIN + amount check + unique receipt number in `used_receipts` table |
| Receipt from another business | Seller IIN must match `990811301225` (Dark Cinema) |
| Wrong payment amount | Amount in PDF must equal session price exactly |
| Stale PENDING reservations | Auto-expire after 15 minutes (scheduler runs every 60s) |
| API abuse / DDoS | Rate limiter: 30 requests/min per IP |
| Token theft | JWT signed with HS256, expires in 24 hours |
| Unauthorized admin access | `@PreAuthorize("hasRole('ADMIN')")` on all admin endpoints |
| Password leaks | BCrypt with strength 12 |

---

## Environment Variables

### Backend
| Variable | Default | Description |
|----------|---------|-------------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/horror_cinema` | PostgreSQL URL |
| `DB_USERNAME` | `postgres` | DB username |
| `DB_PASSWORD` | `postgres` | DB password |
| `JWT_SECRET` | — | Min 256-bit HMAC secret (required) |
| `JWT_EXPIRATION` | `86400000` | Token TTL in ms (24 hours) |
| `TELEGRAM_BOT_TOKEN` | — | Bot token from @BotFather (optional — disables bot if not set) |
| `SESSION_PRICE` | `3500` | Flat session price in KZT |
| `CORS_ALLOWED_ORIGINS` | `https://cinema-phi-gilt.vercel.app` | Allowed frontend origins |
| `PORT` | `8080` | HTTP server port |

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend base URL |

---

## Architecture Overview

```
Browser (Next.js)
      │  HTTP + JWT Bearer token
      ▼
RateLimitFilter (30 req/min per IP)
      │
      ▼
JwtAuthFilter → JwtUtils (validate token) → UserDetailsServiceImpl (load user)
      │
      ▼
SecurityConfig (route-level authorization)
      │
      ├─ AuthController      → AuthService
      ├─ ReservationController → ReservationService → ReservationRepository
      ├─ AdminController     → AdminService → ReservationRepository, UsedReceiptRepository
      └─ AvailabilityController → AvailabilityService

Spring Boot (background threads)
      ├─ ReservationExpiryScheduler  runs every 60s → expires PENDING > 15 min
      └─ TelegramBotService          daemon thread → long-polls api.telegram.org
              │ downloads PDF
              ▼
           PDFBox (local) → extract receipt number, seller IIN, amount
              │ if valid
              ▼
           AdminService.confirmReservationWithReceipt()
              │ @Transactional
              ▼
           PostgreSQL: UPDATE reservations + INSERT used_receipts
```

---

## Frontend Flow

```
/ (HomePage)
  ├── ReservationGrid      room × timeslot matrix (polls every 8s)
  ├── AuthModal            login / register
  ├── BookingModal         select people count + notes
  │     └── PaymentModal   Kaspi QR link + Telegram bot instructions
  │           └── Success screen: shows reservation ID + bot steps
  ├── MyReservations       list with countdown timer (PENDING: MM:SS)
  │                        cancel button, re-open payment button
  └── Header               login/logout, admin link

/info
  └── Levels, rules, social links (WhatsApp, Instagram, TikTok)

/admin
  └── AdminPage            all reservations table, filters by date/room,
                           confirm / cancel buttons, stats dashboard
```


Students:
Kamardin Bak     230103230
Sarsen Bakdaulet 230103018
