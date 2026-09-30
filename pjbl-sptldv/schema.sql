-- =====================================================================
-- SKEMA BASIS DATA — Cloudflare D1 (SQLite)
-- Platform PjBL SPtLDV — SMK Tata Boga
-- Jalankan: npm run db:local   (lokal)
--           npm run db:remote  (produksi)
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ------------------------- TABEL UTAMA -------------------------------

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  class_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  pin TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT UNIQUE NOT NULL,
  group_id INTEGER REFERENCES groups(id),
  pin_entered BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS module_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  feature_number INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER REFERENCES groups(id),
  product_a_name TEXT NOT NULL,
  product_b_name TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  -- JSON array: [{"name":"Tepung","unit":"gram","per_a":200,"per_b":150,"total":10000}, ...]
  time_per_a INTEGER NOT NULL,
  time_per_b INTEGER NOT NULL,
  time_total INTEGER NOT NULL,
  time_unit TEXT DEFAULT 'menit',
  price_a INTEGER NOT NULL,
  cost_a INTEGER NOT NULL,
  price_b INTEGER NOT NULL,
  cost_b INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inequality_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER REFERENCES groups(id),
  student_id INTEGER REFERENCES students(id),
  attempt_number INTEGER DEFAULT 1,
  inequalities TEXT NOT NULL,
  -- JSON: [{"label":"Tepung","input":"200x + 150y <= 10000","correct":true,"hint":""}, ...]
  objective_function TEXT,
  objective_correct BOOLEAN,
  all_correct BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  group_id INTEGER REFERENCES groups(id),
  day_number INTEGER NOT NULL,
  activity TEXT,
  obstacle TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER REFERENCES groups(id),
  format_type TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  what_learned TEXT,
  what_was_hard TEXT,
  improvement_rating INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- --------------- TABEL PENDUKUNG (tambahan sistem) --------------------
-- Catatan: sesi disimpan di server (D1), BUKAN di localStorage,
-- sesuai aturan "semua data tersimpan di Cloudflare D1/R2".

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,                -- 'siswa' | 'guru'
  student_id INTEGER REFERENCES students(id),
  teacher_id INTEGER REFERENCES teachers(id),
  level INTEGER DEFAULT 1,           -- 1 = nama saja, 2 = sudah PIN
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- Pembatasan percobaan PIN: maksimal 3x, lalu terkunci 5 menit.
CREATE TABLE IF NOT EXISTS pin_attempts (
  student_id INTEGER PRIMARY KEY REFERENCES students(id),
  failed_count INTEGER DEFAULT 0,
  locked_until DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pengingat dari guru ("Kirim Pengingat") + notifikasi sistem.
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  message TEXT NOT NULL,
  kind TEXT DEFAULT 'pengingat',
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pengaturan proyek (tanggal mulai, jumlah hari, URL video, dll).
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------- INDEKS --------------------------------

CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON module_progress(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_unik ON module_progress(student_id, feature_number);
CREATE INDEX IF NOT EXISTS idx_quiz_student ON quiz_results(student_id);
CREATE INDEX IF NOT EXISTS idx_interview_group ON interview_data(group_id);
CREATE INDEX IF NOT EXISTS idx_ineq_group ON inequality_submissions(group_id);
CREATE INDEX IF NOT EXISTS idx_journals_student ON journals(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_journals_unik ON journals(student_id, day_number);
CREATE INDEX IF NOT EXISTS idx_portfolios_group ON portfolios(group_id);
CREATE INDEX IF NOT EXISTS idx_reflections_student ON reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_notif_student ON notifications(student_id);

-- --------------------------- NILAI AWAL ------------------------------

INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('nama_proyek', 'Proyek Kantin Tata Boga: Kombinasi Produksi Paling Untung'),
  ('total_hari', '10'),
  ('tanggal_mulai', date('now', '+7 hours')),
  ('video_url', ''),
  ('wajib_lulus_kuis', '1'),
  ('batas_jurnal', '23:59');
