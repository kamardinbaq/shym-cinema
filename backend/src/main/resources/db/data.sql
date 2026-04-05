-- ============================================================
--  Horror Cinema – Seed Data
--  Run once at startup (idempotent via ON CONFLICT DO NOTHING)
-- ============================================================

-- ── Admin user (password: Admin@1234) ──────────────────────
INSERT INTO users (username, email, password, full_name, role, active)
VALUES (
    'admin',
    'admin@horrorcine.kz',
    '$2b$12$7M7Y5tM0VTQVGZheoEMXduny2MxWK0/mx12OfAfEjoKlKlkfkVN/G',
    'System Admin',
    'ADMIN',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- ── Demo user (password: User@1234) ────────────────────────
INSERT INTO users (username, email, password, full_name, role, active)
VALUES (
    'demouser',
    'demo@horrorcine.kz',
    '$2a$12$K0sCCGqHGIEoXFJW5TwIzuM8qG0kx1KJN2dY8Mn6R5mFp4IrHZdHe',
    'Demo User',
    'USER',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- ── Rooms ───────────────────────────────────────────────────
INSERT INTO rooms (id, name, description, capacity, min_people, theme_code, active)
VALUES
    (1, 'Живая комната',
     'Интерактивный хоррор-опыт с живыми актёрами. Погрузитесь в атмосферу ужаса.',
     8, 2, 'LIVING', TRUE),
    (2, 'Пассажирская комната',
     'Хоррор на борту поезда. Путешествие, из которого нет возврата.',
     14, 4, 'PASSENGER', TRUE),
    (3, 'Мертвая комната',
     'Изолированный психологический хоррор. Один на один со страхом.',
     6, 2, 'DEAD', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ── Time Slots — Живая комната (room_id = 1) ───────────────
INSERT INTO time_slots (room_id, start_time, end_time)
VALUES
    (1, '13:00', '15:00'),
    (1, '15:00', '17:00'),
    (1, '17:00', '19:00'),
    (1, '19:00', '21:00'),
    (1, '21:00', '23:00'),
    (1, '23:00', '01:00'),
    (1, '01:00', '03:00'),
    (1, '03:00', '05:00')
ON CONFLICT (room_id, start_time) DO NOTHING;

-- ── Time Slots — Пассажирская комната (room_id = 2) ────────
INSERT INTO time_slots (room_id, start_time, end_time)
VALUES
    (2, '13:00', '15:00'),
    (2, '15:00', '17:00'),
    (2, '17:00', '19:00'),
    (2, '19:00', '21:00'),
    (2, '21:00', '23:00'),
    (2, '23:00', '01:00'),
    (2, '01:00', '03:00'),
    (2, '03:00', '05:00')
ON CONFLICT (room_id, start_time) DO NOTHING;

-- ── Time Slots — Мертвая комната (room_id = 3) ─────────────
INSERT INTO time_slots (room_id, start_time, end_time)
VALUES
    (3, '14:00', '16:00'),
    (3, '16:00', '18:00'),
    (3, '18:00', '20:00'),
    (3, '20:00', '22:00'),
    (3, '22:00', '00:00'),
    (3, '00:00', '02:00'),
    (3, '02:00', '04:00'),
    (3, '04:00', '06:00')
ON CONFLICT (room_id, start_time) DO NOTHING;

-- Reset sequences
SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM rooms));
