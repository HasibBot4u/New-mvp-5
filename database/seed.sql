-- FILE: database/seed.sql

-- Insert Subjects
INSERT INTO subjects (id, name, icon, color, display_order) VALUES
  (uuid_generate_v4(), 'Physics', '⚛️', '#6C5CE7', 1),
  (uuid_generate_v4(), 'Chemistry', '🧪', '#00B894', 2),
  (uuid_generate_v4(), 'Higher Math', '📐', '#E17055', 3);

-- Insert Cycles for Physics
WITH subj AS (SELECT id FROM subjects WHERE name = 'Physics' LIMIT 1)
INSERT INTO cycles (id, subject_id, name, display_order, telegram_channel_id) VALUES
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 1', 1, '-1003569793885'),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 2', 2, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 3', 3, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 4', 4, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 5', 5, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 6', 6, '');

-- Insert Cycles for Chemistry
WITH subj AS (SELECT id FROM subjects WHERE name = 'Chemistry' LIMIT 1)
INSERT INTO cycles (id, subject_id, name, display_order, telegram_channel_id) VALUES
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 1', 1, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 2', 2, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 3', 3, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 4', 4, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 5', 5, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 6', 6, '');

-- Insert Cycles for Higher Math
WITH subj AS (SELECT id FROM subjects WHERE name = 'Higher Math' LIMIT 1)
INSERT INTO cycles (id, subject_id, name, display_order, telegram_channel_id) VALUES
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 1', 1, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 2', 2, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 3', 3, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 4', 4, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 5', 5, ''),
  (uuid_generate_v4(), (SELECT id FROM subj), 'Cycle 6', 6, '');
