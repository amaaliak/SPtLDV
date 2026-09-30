/**
 * Rute guru: dashboard monitoring (Fitur 8), manajemen siswa,
 * manajemen kelompok & PIN, pengingat, dan pengaturan proyek.
 */
import { Hono } from 'hono';
import type { Variabel } from '../types';
import { ambilPengaturan, infoHari, simpanPengaturan, susunKalender, hitungStatus } from '../helpers';
import { pinAcak } from '../util';
import { NILAI_LULUS } from '../quiz';

export const guru = new Hono<Variabel>();

/* ----------------------------- Penjaga akses ---------------------------- */

guru.use('*', async (c, next) => {
  const s = c.get('sesi');
  if (!s || s.role !== 'guru') return c.json({ pesan: 'Halaman ini khusus guru. Silakan masuk sebagai guru.' }, 401);
  await next();
});

/* ------------------------------- Dashboard ------------------------------ */

guru.get('/dashboard', async (c) => {
  const hari = await infoHari(c.env);
  const p = await ambilPengaturan(c.env);

  const kelompok = (await c.env.DB.prepare('SELECT * FROM groups ORDER BY id').all<any>()).results || [];
  const siswa = (
    await c.env.DB.prepare('SELECT * FROM students ORDER BY group_id IS NULL, group_id, full_name').all<any>()
  ).results || [];

  const kuis = (
    await c.env.DB.prepare(
      `SELECT student_id, MAX(score) AS terbaik, COUNT(*) AS percobaan,
              MAX(CASE WHEN passed THEN 1 ELSE 0 END) AS lulus
       FROM quiz_results GROUP BY student_id`,
    ).all<any>()
  ).results || [];
  const petaKuis = new Map(kuis.map((k: any) => [k.student_id, k]));

  const jurnal = (
    await c.env.DB.prepare('SELECT student_id, day_number, file_url FROM journals').all<any>()
  ).results || [];
  const petaJurnal = new Map<number, any[]>();
  for (const j of jurnal) {
    if (!petaJurnal.has(j.student_id)) petaJurnal.set(j.student_id, []);
    petaJurnal.get(j.student_id)!.push(j);
  }

  const wawancara = (await c.env.DB.prepare('SELECT * FROM interview_data').all<any>()).results || [];
  const petaWawancara = new Map(wawancara.map((w: any) => [w.group_id, w]));

  const ineq = (
    await c.env.DB.prepare(
      `SELECT group_id, COUNT(*) AS percobaan, MAX(CASE WHEN all_correct THEN 1 ELSE 0 END) AS selesai
       FROM inequality_submissions GROUP BY group_id`,
    ).all<any>()
  ).results || [];
  const petaIneq = new Map(ineq.map((i: any) => [i.group_id, i]));

  const portofolio = (await c.env.DB.prepare('SELECT * FROM portfolios').all<any>()).results || [];
  const petaPorto = new Map(portofolio.map((x: any) => [x.group_id, x]));

  const refleksi = (await c.env.DB.prepare('SELECT * FROM reflections').all<any>()).results || [];
  const petaRefleksi = new Map(refleksi.map((r: any) => [r.student_id, r]));

  const sesiAktif = (
    await c.env.DB.prepare(
      `SELECT student_id, MAX(last_seen) AS terakhir, MAX(level) AS level FROM sessions
       WHERE role = 'siswa' AND expires_at > CURRENT_TIMESTAMP GROUP BY student_id`,
    ).all<any>()
  ).results || [];
  const petaSesi = new Map(sesiAktif.map((s: any) => [s.student_id, s]));

  const barisSiswa = siswa.map((s: any) => {
    const k = petaKuis.get(s.id);
    const jr = petaJurnal.get(s.id) || [];
    const kalender = susunKalender(hari, jr);
    const bolong = kalender.filter((x) => x.status === 'kosong').length;
    const iq = s.group_id ? petaIneq.get(s.group_id) : null;
    const w = s.group_id ? petaWawancara.get(s.group_id) : null;
    const po = s.group_id ? petaPorto.get(s.group_id) : null;
    const rf = petaRefleksi.get(s.id);
    const ss = petaSesi.get(s.id);

    let tertinggal = 0;
    if (!k?.lulus) tertinggal++;
    if (!w) tertinggal++;
    if (!iq?.selesai) tertinggal++;
    if (bolong > 0) tertinggal += Math.min(bolong, 2);
    if (hari.hariKe >= hari.totalHari - 1 && !po) tertinggal++;
    if (hari.hariKe >= hari.totalHari && !rf) tertinggal++;
    const adaAktivitas = !!(k?.percobaan || jr.length || w || iq || rf || ss);
    const status = hitungStatus(tertinggal, adaAktivitas);

    return {
      id: s.id,
      nama: s.full_name,
      group_id: s.group_id,
      statusLogin: ss ? 'Aktif' : s.created_at ? 'Pernah masuk' : 'Belum',
      terakhirAktif: ss?.terakhir ?? null,
      pinMasuk: !!s.pin_entered,
      kuis: { terbaik: k?.terbaik ?? null, percobaan: k?.percobaan ?? 0, lulus: !!k?.lulus },
      wawancara: !!w,
      pertidaksamaan: { percobaan: iq?.percobaan ?? 0, selesai: !!iq?.selesai },
      jurnal: { terisi: jr.length, target: hari.hariKe, bolong },
      portofolio: !!po,
      refleksi: rf ? { rating: rf.improvement_rating } : null,
      tertinggal,
      status,
    };
  });

  const barisKelompok = kelompok.map((g: any) => {
    const anggota = barisSiswa.filter((s) => s.group_id === g.id);
    const iq = petaIneq.get(g.id);
    const w = petaWawancara.get(g.id);
    const po = petaPorto.get(g.id);
    return {
      id: g.id,
      nama: g.name,
      pin: g.pin,
      jumlahAnggota: anggota.length,
      wawancara: !!w,
      pertidaksamaan: { percobaan: iq?.percobaan ?? 0, selesai: !!iq?.selesai },
      portofolio: po ? { format: po.format_type, file_url: po.file_url, file_name: po.file_name } : null,
      anggota,
    };
  });

  const tanpaKelompok = barisSiswa.filter((s) => !s.group_id);
  const rataKuis =
    kuis.length > 0 ? Math.round(kuis.reduce((t: number, k: any) => t + (k.terbaik || 0), 0) / kuis.length) : 0;

  const perluPerhatian = barisSiswa
    .filter((s) => s.status.warna === 'merah')
    .map((s) => ({
      id: s.id,
      nama: s.nama,
      group_id: s.group_id,
      alasan: [
        !s.kuis.lulus ? 'belum lulus kuis' : null,
        !s.wawancara ? 'wawancara belum diisi' : null,
        !s.pertidaksamaan.selesai ? 'pertidaksamaan belum benar' : null,
        s.jurnal.bolong > 0 ? `${s.jurnal.bolong} hari jurnal kosong` : null,
      ]
        .filter(Boolean)
        .join(', '),
    }));

  return c.json({
    ringkasan: {
      totalKelompok: kelompok.length,
      totalSiswa: siswa.length,
      siswaTanpaKelompok: tanpaKelompok.length,
      hariKe: hari.hariKe,
      totalHari: hari.totalHari,
      rataKuis,
      lulusKuis: kuis.filter((k: any) => k.lulus).length,
      ambangLulus: NILAI_LULUS,
      namaProyek: p.nama_proyek,
    },
    hari,
    kelompok: barisKelompok,
    tanpaKelompok,
    perluPerhatian,
  });
});

/* ------------------------- Detail jurnal (kalender) --------------------- */

guru.get('/jurnal', async (c) => {
  const hari = await infoHari(c.env);
  const kelompok = (await c.env.DB.prepare('SELECT * FROM groups ORDER BY id').all<any>()).results || [];
  const siswa = (await c.env.DB.prepare('SELECT * FROM students ORDER BY full_name').all<any>()).results || [];
  const jurnal = (await c.env.DB.prepare('SELECT * FROM journals ORDER BY day_number').all<any>()).results || [];

  const data = kelompok.map((g: any) => ({
    id: g.id,
    nama: g.name,
    anggota: siswa
      .filter((s: any) => s.group_id === g.id)
      .map((s: any) => {
        const jr = jurnal.filter((j: any) => j.student_id === s.id);
        return {
          id: s.id,
          nama: s.full_name,
          kalender: susunKalender(hari, jr),
          entri: jr.map((j: any) => ({
            hari: j.day_number,
            kegiatan: j.activity,
            kendala: j.obstacle,
            file_url: j.file_url,
            file_name: j.file_name,
            waktu: j.created_at,
          })),
        };
      }),
  }));
  return c.json({ hari, kelompok: data });
});

/* --------------------- Detail percobaan pertidaksamaan ------------------ */

guru.get('/pertidaksamaan', async (c) => {
  const kelompok = (await c.env.DB.prepare('SELECT * FROM groups ORDER BY id').all<any>()).results || [];
  const sub = (
    await c.env.DB.prepare(
      `SELECT i.*, s.full_name FROM inequality_submissions i
       LEFT JOIN students s ON s.id = i.student_id ORDER BY i.id DESC`,
    ).all<any>()
  ).results || [];

  const data = kelompok.map((g: any) => {
    const punya = sub.filter((x: any) => x.group_id === g.id);
    const terakhir = punya[0];
    let ringkas = 'Belum ada percobaan';
    if (terakhir) {
      const baris = JSON.parse(terakhir.inequalities || '[]');
      const salah = baris.filter((b: any) => !b.correct);
      if (terakhir.all_correct) {
        ringkas = `${punya.length} percobaan, SELESAI ✅`;
      } else {
        const kodeKoefisien = salah.filter((b: any) => b.kode === 'koefisien').map((b: any) => b.label);
        const lain = salah.filter((b: any) => b.kode !== 'koefisien').map((b: any) => b.label);
        const bagian: string[] = [];
        if (kodeKoefisien.length) bagian.push(`salah di koefisien ${kodeKoefisien.join(' dan ')}`);
        if (lain.length) bagian.push(`kendala ${lain.join(', ')} belum tepat`);
        if (!terakhir.objective_correct) bagian.push('fungsi tujuan belum tepat');
        ringkas = `${punya.length} percobaan, ${bagian.join('; ') || 'masih ada bagian yang keliru'}`;
      }
    }
    return {
      id: g.id,
      nama: g.name,
      ringkas,
      selesai: !!terakhir?.all_correct,
      jumlahPercobaan: punya.length,
      riwayat: punya.slice(0, 15).map((x: any) => ({
        percobaan: x.attempt_number,
        oleh: x.full_name,
        waktu: x.created_at,
        semuaBenar: !!x.all_correct,
        baris: JSON.parse(x.inequalities || '[]'),
        tujuan: x.objective_function,
        tujuanBenar: !!x.objective_correct,
      })),
    };
  });
  return c.json({ kelompok: data });
});

/* ----------------------------- Daftar siswa ----------------------------- */

guru.get('/siswa', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT s.*, g.name AS nama_kelompok, g.pin,
            (SELECT MAX(score) FROM quiz_results q WHERE q.student_id = s.id) AS nilai_kuis,
            (SELECT MAX(last_seen) FROM sessions se WHERE se.student_id = s.id) AS terakhir_aktif
     FROM students s LEFT JOIN groups g ON g.id = s.group_id
     ORDER BY s.group_id IS NULL DESC, g.name, s.full_name`,
  ).all<any>();
  const kelompok = (await c.env.DB.prepare('SELECT * FROM groups ORDER BY name').all<any>()).results || [];
  return c.json({
    siswa: results || [],
    kelompok,
    ringkasan: {
      total: (results || []).length,
      sudahKelompok: (results || []).filter((s: any) => s.group_id).length,
      belumKelompok: (results || []).filter((s: any) => !s.group_id).length,
    },
  });
});

guru.delete('/siswa/:id', async (c) => {
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('DELETE FROM sessions WHERE student_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM module_progress WHERE student_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM quiz_results WHERE student_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM journals WHERE student_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM reflections WHERE student_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM notifications WHERE student_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM pin_attempts WHERE student_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM students WHERE id = ?').bind(id).run();
  return c.json({ berhasil: true, pesan: 'Data siswa dihapus.' });
});

/* --------------------------- Kelompok & PIN ----------------------------- */

async function pinUnik(env: any): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const p = pinAcak();
    const ada = await env.DB.prepare('SELECT id FROM groups WHERE pin = ?').bind(p).first();
    if (!ada) return p;
  }
  throw new Error('Gagal membuat PIN unik');
}

guru.get('/kelompok', async (c) => {
  const kelompok = (await c.env.DB.prepare('SELECT * FROM groups ORDER BY id').all<any>()).results || [];
  const siswa = (await c.env.DB.prepare('SELECT * FROM students ORDER BY full_name').all<any>()).results || [];
  return c.json({
    kelompok: kelompok.map((g: any) => ({
      ...g,
      anggota: siswa.filter((s: any) => s.group_id === g.id).map((s: any) => ({ id: s.id, nama: s.full_name, pin_entered: !!s.pin_entered })),
    })),
    tanpaKelompok: siswa.filter((s: any) => !s.group_id).map((s: any) => ({ id: s.id, nama: s.full_name })),
  });
});

guru.post('/kelompok', async (c) => {
  const b = await c.req.json<{ nama?: string; jumlah?: number }>().catch(() => ({}) as any);
  const jumlah = Math.min(Math.max(Number(b.jumlah) || 1, 1), 20);
  const dibuat: any[] = [];
  const ada = (await c.env.DB.prepare('SELECT COUNT(*) AS n FROM groups').first<{ n: number }>())?.n ?? 0;
  for (let i = 0; i < jumlah; i++) {
    const nama = (b.nama && jumlah === 1 ? b.nama.trim() : '') || `Kelompok ${ada + i + 1}`;
    const pin = await pinUnik(c.env);
    const r = await c.env.DB.prepare('INSERT INTO groups (name, pin) VALUES (?, ?)').bind(nama, pin).run();
    dibuat.push({ id: Number((r as any).meta?.last_row_id), nama, pin });
  }
  return c.json({ berhasil: true, pesan: `${dibuat.length} kelompok dibuat.`, kelompok: dibuat });
});

guru.post('/kelompok/acak', async (c) => {
  const b = await c.req.json<{ perKelompok?: number; acakUlangSemua?: boolean }>().catch(() => ({}) as any);
  const perKelompok = Math.min(Math.max(Number(b.perKelompok) || 4, 2), 8);
  const semua = b.acakUlangSemua === true;

  const siswa = (
    await c.env.DB.prepare(
      semua ? 'SELECT * FROM students' : 'SELECT * FROM students WHERE group_id IS NULL',
    ).all<any>()
  ).results || [];
  if (siswa.length === 0) return c.json({ pesan: 'Tidak ada siswa yang perlu dibagi.' }, 400);

  if (semua) {
    await c.env.DB.prepare('DELETE FROM interview_data').run();
    await c.env.DB.prepare('DELETE FROM inequality_submissions').run();
    await c.env.DB.prepare('DELETE FROM portfolios').run();
    await c.env.DB.prepare('DELETE FROM groups').run();
    await c.env.DB.prepare('UPDATE students SET group_id = NULL, pin_entered = 0').run();
    await c.env.DB.prepare("UPDATE sessions SET level = 1 WHERE role = 'siswa'").run();
  }

  // Acak (Fisher–Yates)
  const urut = [...siswa];
  for (let i = urut.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [urut[i], urut[j]] = [urut[j], urut[i]];
  }

  const jumlahKelompok = Math.ceil(urut.length / perKelompok);
  const adaSekarang = (await c.env.DB.prepare('SELECT COUNT(*) AS n FROM groups').first<{ n: number }>())?.n ?? 0;
  const hasil: any[] = [];
  for (let i = 0; i < jumlahKelompok; i++) {
    const pin = await pinUnik(c.env);
    const nama = `Kelompok ${adaSekarang + i + 1}`;
    const r = await c.env.DB.prepare('INSERT INTO groups (name, pin) VALUES (?, ?)').bind(nama, pin).run();
    const gid = Number((r as any).meta?.last_row_id);
    const anggota = urut.slice(i * perKelompok, (i + 1) * perKelompok);
    for (const a of anggota) {
      await c.env.DB.prepare('UPDATE students SET group_id = ?, pin_entered = 0 WHERE id = ?').bind(gid, a.id).run();
    }
    hasil.push({ id: gid, nama, pin, anggota: anggota.map((a: any) => a.full_name) });
  }
  return c.json({ berhasil: true, pesan: `${hasil.length} kelompok terbentuk secara acak.`, kelompok: hasil });
});

guru.post('/siswa/:id/kelompok', async (c) => {
  const id = Number(c.req.param('id'));
  const b = await c.req.json<{ group_id?: number | null }>().catch(() => ({}) as any);
  const gid = b.group_id === null || b.group_id === undefined ? null : Number(b.group_id);
  if (gid !== null) {
    const ada = await c.env.DB.prepare('SELECT id FROM groups WHERE id = ?').bind(gid).first();
    if (!ada) return c.json({ pesan: 'Kelompok tidak ditemukan.' }, 404);
  }
  await c.env.DB.prepare('UPDATE students SET group_id = ?, pin_entered = 0 WHERE id = ?').bind(gid, id).run();
  await c.env.DB.prepare("UPDATE sessions SET level = 1 WHERE student_id = ? AND role = 'siswa'").bind(id).run();
  return c.json({ berhasil: true, pesan: 'Penempatan kelompok diperbarui.' });
});

guru.post('/kelompok/:id/pin', async (c) => {
  const id = Number(c.req.param('id'));
  const pin = await pinUnik(c.env);
  await c.env.DB.prepare('UPDATE groups SET pin = ? WHERE id = ?').bind(pin, id).run();
  await c.env.DB.prepare('UPDATE students SET pin_entered = 0 WHERE group_id = ?').bind(id).run();
  await c.env.DB.prepare(
    "UPDATE sessions SET level = 1 WHERE role = 'siswa' AND student_id IN (SELECT id FROM students WHERE group_id = ?)",
  )
    .bind(id)
    .run();
  return c.json({ berhasil: true, pesan: 'PIN kelompok direset.', pin });
});

guru.patch('/kelompok/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const b = await c.req.json<{ nama?: string }>().catch(() => ({}) as any);
  const nama = (b.nama || '').trim();
  if (!nama) return c.json({ pesan: 'Nama kelompok tidak boleh kosong.' }, 400);
  await c.env.DB.prepare('UPDATE groups SET name = ? WHERE id = ?').bind(nama, id).run();
  return c.json({ berhasil: true, pesan: 'Nama kelompok diperbarui.' });
});

guru.delete('/kelompok/:id', async (c) => {
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('UPDATE students SET group_id = NULL, pin_entered = 0 WHERE group_id = ?').bind(id).run();
  await c.env.DB.prepare(
    "UPDATE sessions SET level = 1 WHERE role = 'siswa' AND student_id IN (SELECT id FROM students WHERE group_id = ?)",
  )
    .bind(id)
    .run();
  await c.env.DB.prepare('DELETE FROM interview_data WHERE group_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM inequality_submissions WHERE group_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM portfolios WHERE group_id = ?').bind(id).run();
  await c.env.DB.prepare('UPDATE journals SET group_id = NULL WHERE group_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(id).run();
  return c.json({ berhasil: true, pesan: 'Kelompok dihapus.' });
});

/* ------------------------------ Pengingat ------------------------------- */

guru.post('/pengingat', async (c) => {
  const b = await c.req.json<{ student_id?: number; pesan?: string }>().catch(() => ({}) as any);
  const id = Number(b.student_id);
  if (!id) return c.json({ pesan: 'Siswa tidak valid.' }, 400);
  const siswa = await c.env.DB.prepare('SELECT full_name FROM students WHERE id = ?').bind(id).first<any>();
  if (!siswa) return c.json({ pesan: 'Siswa tidak ditemukan.' }, 404);
  const teks =
    (b.pesan || '').trim() ||
    '⏰ Pengingat dari guru: segera lanjutkan tugas proyekmu dan isi jurnal hari ini ya!';
  await c.env.DB.prepare('INSERT INTO notifications (student_id, message, kind) VALUES (?, ?, ?)')
    .bind(id, teks, 'pengingat')
    .run();
  return c.json({ berhasil: true, pesan: `Pengingat terkirim ke ${siswa.full_name}.` });
});

guru.post('/pengingat/massal', async (c) => {
  const b = await c.req.json<{ ids?: number[]; pesan?: string }>().catch(() => ({}) as any);
  const ids = Array.isArray(b.ids) ? b.ids.map(Number).filter(Boolean) : [];
  if (!ids.length) return c.json({ pesan: 'Tidak ada siswa yang dipilih.' }, 400);
  const teks = (b.pesan || '').trim() || '⏰ Pengingat dari guru: ayo lanjutkan proyekmu!';
  for (const id of ids) {
    await c.env.DB.prepare('INSERT INTO notifications (student_id, message, kind) VALUES (?, ?, ?)')
      .bind(id, teks, 'pengingat')
      .run();
  }
  return c.json({ berhasil: true, pesan: `Pengingat terkirim ke ${ids.length} siswa.` });
});

/* ------------------------------ Pengaturan ------------------------------ */

guru.get('/pengaturan', async (c) => {
  const p = await ambilPengaturan(c.env);
  const hari = await infoHari(c.env);
  return c.json({ pengaturan: p, hari });
});

guru.post('/pengaturan', async (c) => {
  const b = await c.req.json<Record<string, string>>().catch(() => ({}) as any);
  const boleh = ['nama_proyek', 'total_hari', 'tanggal_mulai', 'video_url', 'wajib_lulus_kuis', 'batas_jurnal'];
  for (const [k, v] of Object.entries(b)) {
    if (boleh.includes(k)) await simpanPengaturan(c.env, k, String(v));
  }
  const p = await ambilPengaturan(c.env);
  return c.json({ berhasil: true, pesan: 'Pengaturan tersimpan ✅', pengaturan: p });
});
