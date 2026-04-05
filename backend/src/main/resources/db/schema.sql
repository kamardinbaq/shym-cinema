-- ============================================================
--  Horror Cinema Reservation System – PostgreSQL Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(100),
    phone       VARCHAR(20),
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL UNIQUE,
    description  TEXT,
    capacity     INT           NOT NULL,
    min_people   INT           NOT NULL,
    theme_code   VARCHAR(50),
    active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_slots (
    id           BIGSERIAL PRIMARY KEY,
    room_id      BIGINT        NOT NULL REFERENCES rooms(id),
    start_time   TIME          NOT NULL,
    end_time     TIME          NOT NULL,
    active       BOOLEAN       NOT NULL DEFAULT TRUE,
    UNIQUE (room_id, start_time)
);

CREATE TABLE IF NOT EXISTS reservations (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users(id),
    room_id         BIGINT       NOT NULL REFERENCES rooms(id),
    time_slot_id    BIGINT       NOT NULL REFERENCES time_slots(id),
    reservation_date DATE        NOT NULL,
    people_count    INT          NOT NULL,
    status          VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    notes           TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Drop old full unique constraint if it exists (from previous schema version)
ALTER TABLE reservations
    DROP CONSTRAINT IF EXISTS reservations_room_id_time_slot_id_reservation_date_key;

-- Only one ACTIVE (PENDING or CONFIRMED) reservation per slot per date is allowed.
-- CANCELLED and EXPIRED rows are excluded so the slot can be rebooked.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_unique_active
    ON reservations (room_id, time_slot_id, reservation_date)
    WHERE status IN ('PENDING', 'CONFIRMED');

CREATE TABLE IF NOT EXISTS payments (
    id                  BIGSERIAL PRIMARY KEY,
    reservation_id      BIGINT        NOT NULL REFERENCES reservations(id) UNIQUE,
    amount              DECIMAL(10,2) NOT NULL,
    currency            VARCHAR(10)   NOT NULL DEFAULT 'KZT',
    provider            VARCHAR(50)   NOT NULL DEFAULT 'KASPI',
    status              VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    transaction_id      VARCHAR(100),
    kaspi_order_id      VARCHAR(100),
    payment_method      VARCHAR(50),
    paid_at             TIMESTAMP,
    created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_date      ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_room      ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user      ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status    ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_room        ON time_slots(room_id);
CREATE INDEX IF NOT EXISTS idx_payments_reservation   ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments(status);
