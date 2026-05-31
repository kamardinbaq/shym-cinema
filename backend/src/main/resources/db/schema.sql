-- ============================================================
--  Dark Cinema – Simplified Schema (no users / payments)
-- ============================================================

CREATE TABLE IF NOT EXISTS rooms (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    capacity    INT          NOT NULL,
    min_people  INT          NOT NULL,
    theme_code  VARCHAR(50),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'CINEMA';

CREATE TABLE IF NOT EXISTS time_slots (
    id         BIGSERIAL PRIMARY KEY,
    room_id    BIGINT    NOT NULL REFERENCES rooms(id),
    start_time TIME      NOT NULL,
    end_time   TIME      NOT NULL,
    active     BOOLEAN   NOT NULL DEFAULT TRUE,
    UNIQUE (room_id, start_time)
);

-- Admin marks a specific slot on a specific date as reserved
CREATE TABLE IF NOT EXISTS slot_reservations (
    id               BIGSERIAL PRIMARY KEY,
    room_id          BIGINT NOT NULL REFERENCES rooms(id),
    time_slot_id     BIGINT NOT NULL REFERENCES time_slots(id),
    reservation_date DATE   NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (time_slot_id, reservation_date)
);

CREATE TABLE IF NOT EXISTS reviews (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100),
    stars      INT       NOT NULL CHECK (stars BETWEEN 1 AND 5),
    body       TEXT      NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS venue VARCHAR(20) NOT NULL DEFAULT 'CINEMA';

CREATE TABLE IF NOT EXISTS admins (
    id         BIGSERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    is_root    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
    key   VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slot_res_date  ON slot_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_slot_res_slot  ON slot_reservations(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_date   ON reviews(created_at);
