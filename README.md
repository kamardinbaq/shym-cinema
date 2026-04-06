# 🎭 Horror Cinema Reservation System

> *"Book your nightmare. Three rooms. No escape."*

A production-ready cinema reservation platform built with **Spring Boot 3** + **Next.js 14** featuring JWT authentication, pessimistic locking to prevent double-booking, and a mock Kaspi Pay integration.

---

## 📁 Project Structure

```
cinema/
├── backend/                    Spring Boot 3 / Java 17
│   ├── src/main/java/com/cinema/
│   │   ├── config/             SecurityConfig, CORS
│   │   ├── controller/         REST controllers
│   │   ├── dto/                Request / Response DTOs
│   │   ├── entity/             JPA entities
│   │   ├── exception/          Global exception handler
│   │   ├── repository/         Spring Data JPA
│   │   ├── security/           JWT utils + filter
│   │   └── service/impl/       Business logic
│   └── src/main/resources/
│       ├── application.yml
│       └── db/
│           ├── schema.sql      DDL
│           └── data.sql        Seed: rooms, slots, admin user
├── frontend/                   Next.js 14 / TypeScript
│   └── src/
│       ├── app/
│       │   ├── page.tsx        Main booking page
│       │   └── admin/page.tsx  Admin dashboard
│       ├── components/booking/ Grid, Modals
│       ├── lib/                API client, Zustand store
│       └── types/              TypeScript interfaces
└── docker-compose.yml
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Java 17+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 15+

---

### 1. Database Setup

```sql
-- Connect as superuser and run:
CREATE DATABASE horror_cinema;
```

The schema and seed data are applied automatically on first boot via `spring.sql.init`.

---

### 2. Backend

```bash
cd backend

# Optional: override DB credentials
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/horror_cinema
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres

mvn spring-boot:run
```

Server starts at **http://localhost:8080**

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App starts at **http://localhost:3000**

---

### 4. Docker Compose (all-in-one)

```bash
docker-compose up --build
```

| Service   | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:3000      |
| Backend   | http://localhost:8080      |
| Database  | localhost:5432             |

---

## 🔑 Default Credentials

| Role  | Username  | Password    |
|-------|-----------|-------------|
| Admin | `bagadmin`   | `12341234`|
| User  | `demouser`| `User@1234` |

---

## 🏠 Rooms & Schedule

| Room                    | Theme Code | Capacity | Min People | Schedule                              |
|-------------------------|------------|----------|------------|---------------------------------------|
| Живая комната           | LIVING     | 8        | 2          | 13:00 15:00 17:00 19:00 21:00 23:00 01:00 03:00 |
| Пассажирская комната    | PASSENGER  | 14        | 4          | 13:00 15:00 17:00 19:00 21:00 23:00 01:00 03:00 |
| Мертвая комната         | DEAD       | 6        | 2          | 14:00 16:00 18:00 20:00 22:00 00:00 02:00 04:00 |

---

## 📡 API Reference

### Authentication

#### POST /api/auth/register
```json
// Request
{
  "username": "survivor01",
  "email":    "survivor@example.com",
  "password": "Horror@2024",
  "fullName": "John Doe",
  "phone":    "+77001234567"
}

// Response 201
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token":    "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType":"Bearer",
    "username": "survivor01",
    "email":    "survivor@example.com",
    "role":     "USER",
    "expiresIn":86400000
  }
}
```

#### POST /api/auth/login
```json
// Request
{ "username": "survivor01", "password": "Horror@2024" }

// Response 200
{ "success": true, "data": { "token": "eyJ...", "role": "USER" } }
```

---

### Availability Grid

#### GET /api/availability?date=2024-10-31
```json
// Response 200
{
  "success": true,
  "data": {
    "date": "2024-10-31",
    "rooms": [
      {
        "roomId":    1,
        "roomName":  "Живая комната",
        "themeCode": "LIVING",
        "capacity":  6,
        "minPeople": 2,
        "slots": [
          { "timeSlotId": 1, "startTime": "13:00", "endTime": "15:00", "status": "AVAILABLE", "reservationId": null },
          { "timeSlotId": 2, "startTime": "15:00", "endTime": "17:00", "status": "RESERVED",  "reservationId": 42 }
        ]
      }
    ]
  }
}
```

---

### Reservations (requires JWT Bearer token)

#### POST /api/reservations
```json
// Request
{
  "roomId":          1,
  "timeSlotId":      3,
  "reservationDate": "2024-10-31",
  "peopleCount":     4,
  "notes":           "Birthday group"
}

// Response 201
{
  "success": true,
  "message": "Reservation created. Please proceed to payment.",
  "data": {
    "id":              101,
    "roomName":        "Живая комната",
    "startTime":       "17:00",
    "endTime":         "19:00",
    "reservationDate": "2024-10-31",
    "peopleCount":     4,
    "status":          "PENDING",
    "payment":         null
  }
}
```

#### GET /api/reservations
Returns all reservations for the authenticated user.

#### DELETE /api/reservations/{id}
Cancels a reservation (owner or admin only).

---

### Payments

#### POST /api/payments/kaspi
```json
// Request
{
  "reservationId": 101,
  "phoneNumber":   "+77001234567",
  "paymentMethod": "KASPI_PAY"
}

// Response 200 (success)
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "id":            55,
    "status":        "SUCCESS",
    "amount":        20000.00,
    "currency":      "KZT",
    "transactionId": "TXN_A1B2C3D4E5F60000",
    "kaspiOrderId":  "KSP_1698746400000",
    "paidAt":        "2024-10-31T17:00:00"
  }
}

// Response 402 (failure)
{
  "success": false,
  "message": "Payment declined by Kaspi. Please try again."
}
```

---

### Admin (requires ADMIN role)

#### GET /api/admin/reservations
#### GET /api/admin/reservations?date=2024-10-31
#### GET /api/admin/reservations?roomId=1&date=2024-10-31
#### DELETE /api/admin/reservations/{id}
#### POST /api/admin/reservations
```json
{
  "userId":          2,
  "roomId":          3,
  "timeSlotId":      12,
  "reservationDate": "2024-11-01",
  "peopleCount":     2,
  "skipPayment":     true
}
```

---

## 🔒 Security Notes

- Passwords hashed with **BCrypt** (strength 12)
- JWT tokens expire in **24 hours**
- Reservation creation uses **PESSIMISTIC_WRITE** lock on the slot row — concurrent requests for the same slot will serialize, preventing double-booking
- CORS restricted to `http://localhost:3000` by default
- Role-based access: `ROLE_USER` vs `ROLE_ADMIN`

---

## 💳 Kaspi Pay Integration

The current implementation is a **mock** with a configurable 95% success rate.

To integrate the real Kaspi Pay API:

1. Obtain credentials from [Kaspi Business](https://business.kaspi.kz)
2. Set `app.kaspi.mock-enabled=false` in `application.yml`
3. Implement the real REST call inside `KaspiPaymentService.initiatePayment()`

---

## 🎨 Frontend Flow

```
HomePage (/)
  │
  ├── ReservationGrid      — room × timeslot matrix
  │     └── SlotButton     — green=available / red=taken
  │
  ├── AuthModal            — login / register
  │
  ├── BookingModal         — select people count + notes
  │     └── PaymentModal   — Kaspi phone + method
  │           ├── Success screen
  │           └── Failure screen
  │
  └── MyReservations       — list with cancel option

/admin
  └── AdminPage            — full table, filters, cancel
```

---

## ⚙️ Environment Variables

### Backend (`application.yml`)
| Key | Default | Description |
|-----|---------|-------------|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/horror_cinema` | DB URL |
| `app.jwt.secret` | (set in yml) | Min 256-bit HMAC secret |
| `app.jwt.expiration` | `86400000` | Token TTL in ms (24h) |
| `app.cors.allowed-origins` | `http://localhost:3000` | CORS origins |
| `app.kaspi.mock-enabled` | `true` | Use mock Kaspi |
| `app.kaspi.success-rate` | `0.95` | Mock success probability |

### Frontend (`.env.local`)
| Key | Default |
|-----|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` |
