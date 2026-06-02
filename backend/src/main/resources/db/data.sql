-- ============================================================
--  Dark Cinema – Seed Data
-- ============================================================

-- Delete room 3 (and its time_slots / reservations) if it still exists
DELETE FROM slot_reservations WHERE time_slot_id IN (SELECT id FROM time_slots WHERE room_id = 3);
DELETE FROM time_slots WHERE room_id = 3;
DELETE FROM rooms WHERE id = 3;

INSERT INTO rooms (id, name, description, capacity, min_people, theme_code, active, type)
VALUES
    (1, 'Сгоревший дом',
     'Интерактивный хоррор-опыт с живыми актёрами. Погрузитесь в атмосферу ужаса.',
     8, 2, 'LIVING', TRUE, 'CINEMA'),
    (2, 'Комната Мама',
     'Хоррор на борту поезда. Путешествие, из которого нет возврата.',
     14, 4, 'PASSENGER', TRUE, 'CINEMA'),
    (3, 'Dark Quest',
     'Хоррор-квест в реальности. Тёмные комнаты, живые актёры, настоящий ужас.',
     15, 4, 'DEAD', TRUE, 'QUEST')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
    capacity = EXCLUDED.capacity, min_people = EXCLUDED.min_people,
    theme_code = EXCLUDED.theme_code, active = EXCLUDED.active, type = EXCLUDED.type;

INSERT INTO time_slots (room_id, start_time, end_time) VALUES
    (1,'13:00','15:00'),(1,'15:00','17:00'),(1,'17:00','19:00'),(1,'19:00','21:00'),
    (1,'21:00','23:00'),(1,'23:00','01:00'),(1,'01:00','03:00'),(1,'03:00','05:00')
ON CONFLICT DO NOTHING;

INSERT INTO time_slots (room_id, start_time, end_time) VALUES
    (2,'13:00','15:00'),(2,'15:00','17:00'),(2,'17:00','19:00'),(2,'19:00','21:00'),
    (2,'21:00','23:00'),(2,'23:00','01:00'),(2,'01:00','03:00'),(2,'03:00','05:00')
ON CONFLICT DO NOTHING;

-- Quest slots: 11:00 → 03:00 next day, 80 minutes each
INSERT INTO time_slots (room_id, start_time, end_time) VALUES
    (3,'11:00','12:20'),(3,'12:20','13:40'),(3,'13:40','15:00'),
    (3,'15:00','16:20'),(3,'16:20','17:40'),(3,'17:40','19:00'),
    (3,'19:00','20:20'),(3,'20:20','21:40'),(3,'21:40','23:00'),
    (3,'23:00','00:20'),(3,'00:20','01:40'),(3,'01:40','03:00')
ON CONFLICT DO NOTHING;


INSERT INTO settings (key, value) VALUES
    ('whatsapp_number',       '77005767848'),
    ('youtube_url',           'https://youtu.be/OpThntO9ixc?si=LcP6FJ0wI3iDmYYL'),
    ('youtube_url_3',         'https://youtube.com/shorts/PHZwtpGp2qM?si=fucOShtu7ztVU698'),
    ('quest_whatsapp_number', '77005767848'),
    ('quest_youtube_url',     ''),
    ('quest_hero_bg',         '')
ON CONFLICT DO NOTHING;

SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM rooms));
