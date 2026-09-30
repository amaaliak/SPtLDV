/**
 * Autentikasi: login siswa (NAMA SAJA, tanpa sandi), PIN kelompok,
 * dan login guru (kata sandi). Sesi disimpan di tabel D1 `sessions`
 * dan dirujuk lewat cookie HttpOnly — tidak ada data di localStorage.
 */
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Variabel, Sesi, SiswaRow } from '../types';
import { NAMA_COOKIE, idAcak, hashSandi, cocokSandi, rapikanNama } from '../util';
import { ambilPengaturan, infoHari, nilaiKuisTerbaik, progresSiswa } from '../helpers';

const MAKS_GAGAL = 3;
const MENIT_KUNCI = 5;
const UMUR_SESI_HARI = 30;

export const auth = new Hono<Variabel>();

/* --------------------------- Middleware sesi ---------------------------- */

export async function muatSesi(c: any, next: any) {
  const id = getCookie(c, NAMA_COOKIE);
  c.set('sesi', null);
  c.set('siswa', null);
  if (id) {
    const row = (await c.env.DB.prepare(
      `SELECT s.id, s.role, s.student_id, s.teacher_id, s.level
       FROM sessions s WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP`,
    )
      .bind(id)
      .first()) as Sesi | null;
    if (row) {
      c.set('sesi', row);
      if (row.role === 'siswa' && row.student_id) {
        const siswa = (await c.env.DB.prepare('SELECT * FROM students WHERE id = ?')
          .bind(row.student_id)
          .first()) as SiswaRow | null;
        c.set('siswa', siswa ?? null);
        // sinkronkan level bila guru mencabut/menambah kelompok
        if (siswa && !siswa.group_id && row.level === 2) {
          await c.env.DB.prepare('UPDATE sessions SET level = 1 WHERE id = ?').bind(row.id).run();
          row.level = 1;
        }
      }
      try {
        const kerja = c.env.DB.prepare('UPDATE sessions SET last_seen = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(id)
          .run();
        if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') c.executionCtx.waitUntil(kerja);
        else await kerja;
      } catch {
        /* abaikan: pembaruan jejak aktivitas tidak boleh menggagalkan permintaan */
      }
    }
  }
  await next();
}

/**
 * Atribut cookie sesi.
 * Di balik proxy https (mis. pratinjau yang dimuat dalam iframe lintas situs),
 * cookie `SameSite=Lax` tidak ikut terkirim sehingga sesi selalu hilang.
 * Karena itu saat koneksi sudah https kita pakai `SameSite=None; Secure`.
 */
function opsiCookie(c: any) {
  const xfProto = (c.req.header('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
  const host = (c.req.header('x-forwarded-host') || c.req.header('host') || '').toLowerCase();
  let protokol = '';
  try {
    protokol = new URL(c.req.url).protocol;
  } catch {
    protokol = '';
  }
  const aman = xfProto === 'https' || protokol === 'https:' || /\.(e2b\.app|pages\.dev|workers\.dev)$/.test(host.split(':')[0]);
  return {
    httpOnly: true,
    sameSite: (aman ? 'None' : 'Lax') as 'None' | 'Lax',
    secure: aman,
    path: '/',
  };
}

async function buatSesi(c: any, data: { role: 'siswa' | 'guru'; studentId?: number; teacherId?: number; level: number }) {
  const id = idAcak(24);
  const kedaluwarsa = new Date(Date.now() + UMUR_SESI_HARI * 86400_000).toISOString().replace('T', ' ').slice(0, 19);
  await c.env.DB.prepare(
    `INSERT INTO sessions (id, role, student_id, teacher_id, level, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, data.role, data.studentId ?? null, data.teacherId ?? null, data.level, kedaluwarsa)
    .run();
  setCookie(c, NAMA_COOKIE, id, { ...opsiCookie(c), maxAge: UMUR_SESI_HARI * 86400 });
  return id;
}

/* ------------------------------- Status --------------------------------- */

auth.get('/status', async (c) => {
  const guru = await c.env.DB.prepare('SELECT id, name, class_name FROM teachers ORDER BY id LIMIT 1').first<any>();
  const p = await ambilPengaturan(c.env);
  const hari = await infoHari(c.env);
  return c.json({
    aplikasi: 'PjBL SPtLDV — Tata Boga',
    guruTerdaftar: !!guru,
    namaGuru: guru?.name ?? null,
    kelas: guru?.class_name ?? null,
    pengaturan: {
      nama_proyek: p.nama_proyek,
      video_url: p.video_url || '',
      total_hari: hari.totalHari,
      wajib_lulus_kuis: p.wajib_lulus_kuis === '1',
    },
    hari,
  });
});

/* ------------------------------ Sesi aktif ------------------------------ */

auth.get('/auth/saya', async (c) => {
  const sesi = c.get('sesi');
  if (!sesi) return c.json({ masuk: false, peran: 'tamu', level: 0 });

  if (sesi.role === 'guru') {
    const guru = await c.env.DB.prepare('SELECT id, name, class_name FROM teachers WHERE id = ?')
      .bind(sesi.teacher_id)
      .first<any>();
    return c.json({ masuk: true, peran: 'guru', level: 9, guru });
  }

  const siswa = c.get('siswa');
  if (!siswa) return c.json({ masuk: false, peran: 'tamu', level: 0 });

  const kelompok = siswa.group_id
    ? await c.env.DB.prepare('SELECT id, name FROM groups WHERE id = ?').bind(siswa.group_id).first<any>()
    : null;
  const kuis = await nilaiKuisTerbaik(c.env, siswa.id);
  const progres = await progresSiswa(c.env, siswa.id);
  const p = await ambilPengaturan(c.env);
  const belumDibaca = await c.env.DB.prepare(
    'SELECT COUNT(*) AS n FROM notifications WHERE student_id = ? AND read_at IS NULL',
  )
    .bind(siswa.id)
    .first<{ n: number }>();

  return c.json({
    masuk: true,
    peran: 'siswa',
    level: sesi.level,
    siswa: { id: siswa.id, nama: siswa.full_name, group_id: siswa.group_id },
    kelompok,
    kuis,
    progres,
    notifikasiBaru: belumDibaca?.n ?? 0,
    wajibLulusKuis: p.wajib_lulus_kuis === '1',
  });
});

/* --------------------- LANGKAH 1: login nama siswa ---------------------- */

auth.post('/auth/siswa/masuk', async (c) => {
  const body = await c.req.json<{ nama?: string }>().catch(() => ({}) as any);
  const namaMentah = (body.nama || '').trim();
  if (namaMentah.length < 3) {
    return c.json({ pesan: 'Nama minimal 3 huruf. Tulis nama lengkapmu, ya.' }, 400);
  }
  if (namaMentah.length > 60) {
    return c.json({ pesan: 'Nama terlalu panjang (maksimal 60 karakter).' }, 400);
  }
  if (!/^[a-zA-Z.'\-\s]+$/.test(namaMentah)) {
    return c.json({ pesan: 'Nama hanya boleh berisi huruf, spasi, titik, dan tanda hubung.' }, 400);
  }
  const nama = rapikanNama(namaMentah);

  let siswa = await c.env.DB.prepare('SELECT * FROM students WHERE lower(full_name) = lower(?)')
    .bind(nama)
    .first<SiswaRow>();

  if (!siswa) {
    const ins = await c.env.DB.prepare('INSERT INTO students (full_name) VALUES (?)').bind(nama).run();
    const id = Number((ins as any).meta?.last_row_id);
    siswa = await c.env.DB.prepare('SELECT * FROM students WHERE id = ?').bind(id).first<SiswaRow>();
  }
  if (!siswa) return c.json({ pesan: 'Gagal menyimpan data. Coba lagi.' }, 500);

  await buatSesi(c, { role: 'siswa', studentId: siswa.id, level: 1 });

  return c.json({
    berhasil: true,
    pesan: `Halo, ${siswa.full_name}! Selamat belajar 🍰`,
    siswa: { id: siswa.id, nama: siswa.full_name, group_id: siswa.group_id },
    punyaKelompok: !!siswa.group_id,
  });
});

/* -------------------- LANGKAH 2: PIN kelompok (4 digit) ----------------- */

auth.post('/auth/siswa/pin', async (c) => {
  const sesi = c.get('sesi');
  const siswa = c.get('siswa');
  if (!sesi || sesi.role !== 'siswa' || !siswa) {
    return c.json({ pesan: 'Kamu belum masuk. Silakan masukkan namamu dulu.' }, 401);
  }

  const body = await c.req.json<{ pin?: string }>().catch(() => ({}) as any);
  const pin = (body.pin || '').trim();

  // 1) Cek penguncian
  const percobaan = await c.env.DB.prepare('SELECT * FROM pin_attempts WHERE student_id = ?')
    .bind(siswa.id)
    .first<{ failed_count: number; locked_until: string | null }>();
  if (percobaan?.locked_until) {
    const sampai = new Date(percobaan.locked_until.replace(' ', 'T') + 'Z').getTime();
    if (sampai > Date.now()) {
      const sisa = Math.ceil((sampai - Date.now()) / 60000);
      return c.json(
        {
          pesan: `Terlalu banyak percobaan. Coba lagi dalam ${sisa} menit atau minta bantuan gurumu.`,
          terkunci: true,
          sisaMenit: sisa,
        },
        429,
      );
    }
  }

  // 2) Siswa belum punya kelompok
  if (!siswa.group_id) {
    return c.json({ pesan: 'Kamu belum memiliki kelompok. Minta PIN ke gurumu.', belumPunyaKelompok: true }, 403);
  }

  if (!/^\d{4}$/.test(pin)) {
    return await gagalPin(c, siswa.id, 'PIN harus 4 angka. Cek lagi PIN dari gurumu.');
  }

  // 3) PIN ada?
  const kelompok = await c.env.DB.prepare('SELECT * FROM groups WHERE pin = ?').bind(pin).first<any>();
  if (!kelompok) {
    return await gagalPin(c, siswa.id, 'PIN salah. Pastikan PIN yang kamu masukkan sesuai dari gurumu.');
  }

  // 4) PIN milik kelompok siswa ini?
  if (kelompok.id !== siswa.group_id) {
    return await gagalPin(c, siswa.id, 'PIN itu milik kelompok lain. Masukkan PIN kelompokmu sendiri.');
  }

  // Berhasil
  await c.env.DB.prepare('UPDATE students SET pin_entered = 1 WHERE id = ?').bind(siswa.id).run();
  await c.env.DB.prepare('DELETE FROM pin_attempts WHERE student_id = ?').bind(siswa.id).run();
  await c.env.DB.prepare('UPDATE sessions SET level = 2 WHERE id = ?').bind(sesi.id).run();

  return c.json({
    berhasil: true,
    pesan: `PIN benar! Selamat datang di ${kelompok.name} 🎉`,
    kelompok: { id: kelompok.id, name: kelompok.name },
  });
});

async function gagalPin(c: any, siswaId: number, pesan: string) {
  const row = (await c.env.DB.prepare('SELECT failed_count FROM pin_attempts WHERE student_id = ?')
    .bind(siswaId)
    .first()) as { failed_count: number } | null;
  const gagal = (row?.failed_count ?? 0) + 1;
  const terkunci = gagal >= MAKS_GAGAL;
  const sampai = terkunci
    ? new Date(Date.now() + MENIT_KUNCI * 60_000).toISOString().replace('T', ' ').slice(0, 19)
    : null;
  await c.env.DB.prepare(
    `INSERT INTO pin_attempts (student_id, failed_count, locked_until, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(student_id) DO UPDATE SET failed_count = excluded.failed_count,
       locked_until = excluded.locked_until, updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(siswaId, terkunci ? 0 : gagal, sampai)
    .run();

  if (terkunci) {
    return c.json(
      {
        pesan: `PIN salah 3 kali. Akun dikunci ${MENIT_KUNCI} menit. Minta PIN yang benar ke gurumu.`,
        terkunci: true,
        sisaMenit: MENIT_KUNCI,
        sisaPercobaan: 0,
      },
      429,
    );
  }
  return c.json({ pesan: `${pesan} Sisa percobaan: ${MAKS_GAGAL - gagal}.`, sisaPercobaan: MAKS_GAGAL - gagal }, 400);
}

/* ------------------------------- Keluar --------------------------------- */

auth.post('/auth/keluar', async (c) => {
  const sesi = c.get('sesi');
  if (sesi) await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sesi.id).run();
  deleteCookie(c, NAMA_COOKIE, opsiCookie(c));
  return c.json({ berhasil: true, pesan: 'Kamu sudah keluar. Sampai jumpa! 👋' });
});

/* --------------------------- Guru: setup awal --------------------------- */

auth.post('/auth/guru/setup', async (c) => {
  const ada = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM teachers').first<{ n: number }>();
  if ((ada?.n ?? 0) > 0) {
    return c.json({ pesan: 'Akun guru sudah terdaftar. Silakan masuk.' }, 400);
  }
  const b = await c.req.json<{ nama?: string; sandi?: string; kelas?: string }>().catch(() => ({}) as any);
  const nama = (b.nama || '').trim();
  const sandi = b.sandi || '';
  if (nama.length < 3) return c.json({ pesan: 'Nama guru minimal 3 huruf.' }, 400);
  if (sandi.length < 6) return c.json({ pesan: 'Kata sandi minimal 6 karakter.' }, 400);

  const hash = await hashSandi(sandi);
  const ins = await c.env.DB.prepare('INSERT INTO teachers (name, password_hash, class_name) VALUES (?, ?, ?)')
    .bind(nama, hash, (b.kelas || '').trim() || null)
    .run();
  const id = Number((ins as any).meta?.last_row_id);
  await buatSesi(c, { role: 'guru', teacherId: id, level: 9 });
  return c.json({ berhasil: true, pesan: 'Akun guru berhasil dibuat. Selamat mengajar! 👩‍🏫' });
});

/* ----------------------------- Guru: masuk ------------------------------ */

auth.post('/auth/guru/masuk', async (c) => {
  const b = await c.req.json<{ sandi?: string }>().catch(() => ({}) as any);
  const guru = await c.env.DB.prepare('SELECT * FROM teachers ORDER BY id LIMIT 1').first<any>();
  if (!guru) return c.json({ pesan: 'Belum ada akun guru. Buat akun terlebih dahulu.', perluSetup: true }, 404);
  const ok = await cocokSandi(b.sandi || '', guru.password_hash);
  if (!ok) return c.json({ pesan: 'Kata sandi salah. Coba lagi.' }, 401);
  await buatSesi(c, { role: 'guru', teacherId: guru.id, level: 9 });
  return c.json({ berhasil: true, pesan: `Selamat datang kembali, ${guru.name}!`, guru: { name: guru.name } });
});
