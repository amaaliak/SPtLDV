/**
 * DATA CONTOH untuk pengembangan / demo.
 *
 *   node dev/seed.mjs           -> isi basis data lokal dengan data contoh
 *   node dev/seed.mjs --kosong  -> kosongkan basis data (mulai dari nol)
 *
 * Akun guru demo:  kata sandi  guru123
 */
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AKAR = path.resolve(__dirname, '..');
const DATA = path.join(__dirname, '.data');
fs.mkdirSync(DATA, { recursive: true });

const db = new Database(path.join(DATA, 'pjbl.sqlite'));
db.pragma('foreign_keys = OFF');
db.exec(fs.readFileSync(path.join(AKAR, 'schema.sql'), 'utf8'));

const kosongkan = () => {
  for (const t of [
    'sessions', 'pin_attempts', 'notifications', 'reflections', 'portfolios', 'journals',
    'inequality_submissions', 'interview_data', 'quiz_results', 'module_progress',
    'students', 'groups', 'teachers',
  ]) db.exec(`DELETE FROM ${t}`);
  db.exec("DELETE FROM sqlite_sequence WHERE name NOT IN ('app_settings')");
};

const hexKe = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function hashSandi(sandi) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kunci = await crypto.subtle.importKey('raw', new TextEncoder().encode(sandi), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, kunci, 256);
  return `pbkdf2$100000$${hexKe(salt.buffer)}$${hexKe(bits)}`;
}

const hariLalu = (n) => {
  const d = new Date(Date.now() + 7 * 3600e3 - n * 86400e3);
  return d.toISOString().slice(0, 10);
};

kosongkan();

if (process.argv.includes('--kosong')) {
  console.log('🧹 Basis data dikosongkan. Buka /admin/setup untuk mendaftarkan akun guru baru.');
  process.exit(0);
}

const sandi = await hashSandi('guru123');
db.prepare('INSERT INTO teachers (name, password_hash, class_name) VALUES (?, ?, ?)').run(
  'Ratna Kusuma, S.Pd.', sandi, 'XI Tata Boga 1',
);

// Proyek berjalan pada hari ke-4 dari 10
db.prepare("INSERT INTO app_settings (key, value) VALUES ('tanggal_mulai', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(hariLalu(3));
db.prepare("INSERT INTO app_settings (key, value) VALUES ('total_hari', '10') ON CONFLICT(key) DO UPDATE SET value = excluded.value").run();

const kelompok = [
  { nama: 'Kelompok 1 — Kue Basah', pin: '2468' },
  { nama: 'Kelompok 2 — Gorengan', pin: '1357' },
  { nama: 'Kelompok 3 — Roti Manis', pin: '9753' },
];
const idKelompok = kelompok.map((k) =>
  Number(db.prepare('INSERT INTO groups (name, pin) VALUES (?, ?)').run(k.nama, k.pin).lastInsertRowid),
);

const siswa = [
  'Andi Pratama Wijaya', 'Siti Nurhaliza Putri', 'Bagus Dwi Saputra', 'Dewi Ayu Lestari',
  'Rizky Firmansyah', 'Nadia Salsabila', 'Fajar Nugroho', 'Intan Permata Sari',
  'Yoga Adi Pranata', 'Aisyah Rahmawati', 'Bima Setiawan', 'Citra Maharani',
  'Galih Ramadhan', 'Zahra Aulia',
];
const idSiswa = siswa.map((n) =>
  Number(db.prepare('INSERT INTO students (full_name, group_id, pin_entered) VALUES (?, NULL, 0)').run(n).lastInsertRowid),
);

// 12 siswa dibagi ke 3 kelompok, 2 siswa terakhir belum punya kelompok
idSiswa.slice(0, 12).forEach((id, i) => {
  const g = idKelompok[Math.floor(i / 4)];
  db.prepare('UPDATE students SET group_id = ?, pin_entered = ? WHERE id = ?').run(g, i === 11 ? 0 : 1, id);
});

// Nilai kuis
const nilai = [100, 90, 80, 70, 90, 100, 60, 80, 70, 90, 50, 40, 80, 0];
idSiswa.forEach((id, i) => {
  const n = nilai[i];
  if (n === 0) return;
  if (n < 70) {
    db.prepare('INSERT INTO quiz_results (student_id, score, total_questions, passed, attempt_number) VALUES (?,?,?,?,?)')
      .run(id, Math.max(30, n - 20), 10, 0, 1);
    db.prepare('INSERT INTO quiz_results (student_id, score, total_questions, passed, attempt_number) VALUES (?,?,?,?,?)')
      .run(id, n, 10, 0, 2);
  } else {
    db.prepare('INSERT INTO quiz_results (student_id, score, total_questions, passed, attempt_number) VALUES (?,?,?,?,?)')
      .run(id, Math.max(40, n - 30), 10, 0, 1);
    db.prepare('INSERT INTO quiz_results (student_id, score, total_questions, passed, attempt_number) VALUES (?,?,?,?,?)')
      .run(id, n, 10, 1, 2);
    for (const f of [1, 2, 3, 4]) {
      db.prepare('INSERT OR IGNORE INTO module_progress (student_id, feature_number, completed) VALUES (?,?,1)').run(id, f);
    }
  }
});

// Data wawancara 2 kelompok
db.prepare(`INSERT INTO interview_data
  (group_id, product_a_name, product_b_name, ingredients, time_per_a, time_per_b, time_total, time_unit, price_a, cost_a, price_b, cost_b)
  VALUES (?,?,?,?,?,?,?,'menit',?,?,?,?)`).run(
  idKelompok[0], 'Kue Lapis', 'Risoles',
  JSON.stringify([
    { name: 'Tepung', unit: 'gram', per_a: 200, per_b: 150, total: 6000 },
    { name: 'Telur', unit: 'butir', per_a: 1, per_b: 2, total: 40 },
  ]),
  30, 10, 450, 15000, 9000, 8000, 5000,
);
db.prepare(`INSERT INTO interview_data
  (group_id, product_a_name, product_b_name, ingredients, time_per_a, time_per_b, time_total, time_unit, price_a, cost_a, price_b, cost_b)
  VALUES (?,?,?,?,?,?,?,'menit',?,?,?,?)`).run(
  idKelompok[1], 'Pisang Goreng', 'Tahu Isi',
  JSON.stringify([
    { name: 'Tepung', unit: 'gram', per_a: 50, per_b: 80, total: 4000 },
    { name: 'Minyak', unit: 'ml', per_a: 30, per_b: 40, total: 2400 },
  ]),
  5, 8, 300, 3000, 1500, 4000, 2000,
);

// Percobaan pertidaksamaan — Kelompok 1 selesai, Kelompok 2 masih salah
db.prepare(`INSERT INTO inequality_submissions
  (group_id, student_id, attempt_number, inequalities, objective_function, objective_correct, all_correct)
  VALUES (?,?,?,?,?,?,?)`).run(
  idKelompok[0], idSiswa[0], 1,
  JSON.stringify([
    { key: 'bahan-0', label: 'Tepung', input: '200x + 150y <= 600', correct: false, hint: 'Ruas kanan harus berisi total tepung yang tersedia per hari. Cek kembali form data wawancaramu.', kode: 'ruas_kanan' },
    { key: 'bahan-1', label: 'Telur', input: '1x + 2y <= 40', correct: true, hint: '', kode: 'ok' },
    { key: 'waktu', label: 'Waktu produksi', input: '30x + 10y <= 450', correct: true, hint: '', kode: 'ok' },
    { key: 'nonneg', label: 'Syarat non-negatif', input: 'x >= 0, y >= 0', correct: true, hint: '', kode: 'ok' },
  ]),
  'Z = 15000x + 8000y', 0, 0,
);
db.prepare(`INSERT INTO inequality_submissions
  (group_id, student_id, attempt_number, inequalities, objective_function, objective_correct, all_correct)
  VALUES (?,?,?,?,?,?,?)`).run(
  idKelompok[0], idSiswa[1], 2,
  JSON.stringify([
    { key: 'bahan-0', label: 'Tepung', input: '200x + 150y <= 6000', correct: true, hint: '', kode: 'ok' },
    { key: 'bahan-1', label: 'Telur', input: 'x + 2y <= 40', correct: true, hint: '', kode: 'ok' },
    { key: 'waktu', label: 'Waktu produksi', input: '30x + 10y <= 450', correct: true, hint: '', kode: 'ok' },
    { key: 'nonneg', label: 'Syarat non-negatif', input: 'x >= 0, y >= 0', correct: true, hint: '', kode: 'ok' },
  ]),
  'Z = 6000x + 3000y', 1, 1,
);
for (let i = 1; i <= 4; i++) {
  db.prepare(`INSERT INTO inequality_submissions
    (group_id, student_id, attempt_number, inequalities, objective_function, objective_correct, all_correct)
    VALUES (?,?,?,?,?,?,?)`).run(
    idKelompok[1], idSiswa[4], i,
    JSON.stringify([
      { key: 'bahan-0', label: 'Tepung', input: `50x + ${60 + i * 5}y <= 4000`, correct: false, hint: 'Cek data wawancaramu: berapa gram tepung untuk 1 Tahu Isi?', kode: 'koefisien' },
      { key: 'bahan-1', label: 'Minyak', input: '30x + 40y <= 2400', correct: true, hint: '', kode: 'ok' },
      { key: 'waktu', label: 'Waktu produksi', input: '5x + 8y <= 300', correct: true, hint: '', kode: 'ok' },
      { key: 'nonneg', label: 'Syarat non-negatif', input: 'x >= 0', correct: false, hint: 'Syaratnya belum lengkap.', kode: 'nonneg_kurang' },
    ]),
    'Z = 1500x + 2000y', 1, 0,
  );
}

// Jurnal harian (hari 1–4) dengan beberapa yang bolong
const kegiatan = [
  'Menonton video cerita masalah dan mencatat data dapur kantin.',
  'Mewawancarai pengelola kantin tentang kebutuhan bahan dan waktu produksi.',
  'Menyusun pertidaksamaan bersama kelompok dan mencoba fitur cek jawaban.',
  'Menggambar grafik daerah penyelesaian dan menentukan titik pojok.',
];
const kendalaTeks = [
  'Belum paham perbedaan tanda ≤ dan ≥.',
  'Pengelola kantin sibuk sehingga wawancara sempat tertunda.',
  'Bingung menentukan koefisien untuk bahan telur.',
  'Sulit menentukan titik potong garis dengan sumbu.',
];
idSiswa.slice(0, 12).forEach((id, i) => {
  const gid = idKelompok[Math.floor(i / 4)];
  const sampai = i % 5 === 0 ? 2 : i % 4 === 3 ? 3 : 4; // sebagian sengaja bolong
  for (let h = 1; h <= sampai; h++) {
    db.prepare(`INSERT OR IGNORE INTO journals (student_id, group_id, day_number, activity, obstacle)
                VALUES (?,?,?,?,?)`).run(id, gid, h, kegiatan[h - 1], kendalaTeks[h - 1]);
  }
});

// Portofolio 1 kelompok
db.prepare('INSERT INTO portfolios (group_id, format_type, file_url, file_name, notes) VALUES (?,?,?,?,?)').run(
  idKelompok[0], 'Infografis', null, 'infografis-kelompok-1.pdf',
  'Infografis berisi data wawancara, model SPtLDV, grafik, dan rekomendasi produksi.',
);

// Refleksi
[0, 1, 5].forEach((i) => {
  db.prepare('INSERT INTO reflections (student_id, what_learned, what_was_hard, improvement_rating) VALUES (?,?,?,?)').run(
    idSiswa[i],
    'Ternyata matematika bisa dipakai untuk menentukan jumlah produksi kue yang paling menguntungkan.',
    'Paling sulit menyusun pertidaksamaan. Saya mengatasinya dengan membaca ulang tabel data wawancara.',
    [5, 4, 4][[0, 1, 5].indexOf(i)],
  );
});

// Pengingat dari guru
db.prepare('INSERT INTO notifications (student_id, message, kind) VALUES (?,?,?)').run(
  idSiswa[10], '⏰ Pengingat dari guru: nilai kuismu belum mencapai 70. Yuk pelajari lagi modulnya!', 'pengingat',
);

console.log('✅ Data contoh berhasil dibuat.');
console.log('   Guru : Ratna Kusuma, S.Pd. — kata sandi: guru123');
console.log(`   PIN  : ${kelompok.map((k, i) => `${k.nama} = ${k.pin}`).join(' | ')}`);
console.log(`   Siswa: cukup ketik namanya, contoh "${siswa[0]}"`);
