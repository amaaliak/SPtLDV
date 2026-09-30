/**
 * Rute siswa: progres modul, kuis, wawancara, feedback pertidaksamaan,
 * jurnal harian, portofolio, refleksi, dan berkas R2.
 */
import { Hono } from 'hono';
import type { Variabel, Bahan } from '../types';
import {
  ambilPengaturan,
  ambilWawancara,
  bacaBahan,
  infoHari,
  nilaiKuisTerbaik,
  progresSiswa,
  susunKalender,
  tandaiProgres,
} from '../helpers';
import { nilaiKuis, soalUntukSiswa, BANK_SOAL, TOTAL_SOAL, NILAI_LULUS } from '../quiz';
import {
  periksaFungsiTujuan,
  periksaNonNegatif,
  periksaPertidaksamaan,
  type HasilPeriksa,
  type KonteksPetunjuk,
} from '../grader';
import { nilaiOptimum, titikPojok, type Kendala } from '../../../shared/linear';
import { EKSTENSI_JURNAL, EKSTENSI_PORTOFOLIO, MAKS_JURNAL, MAKS_PORTOFOLIO, amankanNamaBerkas, ekstensi, ukuranTerbaca } from '../util';

export const siswa = new Hono<Variabel>();

/* ----------------------------- Penjaga akses ---------------------------- */

const wajibSiswa = async (c: any, next: any) => {
  const s = c.get('sesi');
  if (!s || s.role !== 'siswa' || !c.get('siswa')) {
    return c.json({ pesan: 'Kamu belum masuk. Silakan masukkan namamu dulu.' }, 401);
  }
  await next();
};

/** Fitur proyek (5,6,7,9,10): wajib PIN + (opsional) lulus kuis. */
const wajibProyek = async (c: any, next: any) => {
  const s = c.get('sesi');
  const siswaRow = c.get('siswa');
  if (!s || s.role !== 'siswa' || !siswaRow) {
    return c.json({ pesan: 'Kamu belum masuk. Silakan masukkan namamu dulu.' }, 401);
  }
  if (!siswaRow.group_id) {
    return c.json({ pesan: 'Kamu belum memiliki kelompok. Minta PIN ke gurumu.', perluPin: true }, 403);
  }
  if (s.level < 2) {
    return c.json({ pesan: 'Masukkan PIN kelompokmu dulu untuk membuka fitur proyek.', perluPin: true }, 403);
  }
  const p = await ambilPengaturan(c.env);
  if (p.wajib_lulus_kuis === '1') {
    const kuis = await nilaiKuisTerbaik(c.env, siswaRow.id);
    if (!kuis.lulus) {
      return c.json(
        {
          pesan: `Nilai kuismu belum mencapai ${NILAI_LULUS}. Pelajari kembali modul materi lalu ulangi kuis untuk membuka fitur proyek.`,
          perluKuis: true,
        },
        403,
      );
    }
  }
  await next();
};

/* ------------------------------- Beranda -------------------------------- */

siswa.get('/siswa/beranda', wajibSiswa, async (c) => {
  const s = c.get('siswa')!;
  const sesi = c.get('sesi')!;
  const hari = await infoHari(c.env);
  const p = await ambilPengaturan(c.env);
  const progres = await progresSiswa(c.env, s.id);
  const kuis = await nilaiKuisTerbaik(c.env, s.id);

  const kelompok = s.group_id
    ? await c.env.DB.prepare('SELECT id, name, pin FROM groups WHERE id = ?').bind(s.group_id).first<any>()
    : null;
  const anggota = s.group_id
    ? (await c.env.DB.prepare('SELECT id, full_name, pin_entered FROM students WHERE group_id = ? ORDER BY full_name')
        .bind(s.group_id)
        .all<any>()).results
    : [];

  const wawancara = s.group_id ? await ambilWawancara(c.env, s.group_id) : null;
  const ineq = s.group_id
    ? await c.env.DB.prepare(
        `SELECT COUNT(*) AS percobaan, MAX(CASE WHEN all_correct THEN 1 ELSE 0 END) AS selesai
         FROM inequality_submissions WHERE group_id = ?`,
      )
        .bind(s.group_id)
        .first<any>()
    : null;

  const jurnal = (
    await c.env.DB.prepare('SELECT day_number, file_url FROM journals WHERE student_id = ? ORDER BY day_number')
      .bind(s.id)
      .all<any>()
  ).results;
  const kalender = susunKalender(hari, jurnal || []);
  const jurnalHariIni = (jurnal || []).some((j: any) => j.day_number === hari.hariKe);

  const portofolio = s.group_id
    ? await c.env.DB.prepare('SELECT * FROM portfolios WHERE group_id = ? ORDER BY id DESC LIMIT 1')
        .bind(s.group_id)
        .first<any>()
    : null;
  const refleksi = await c.env.DB.prepare('SELECT * FROM reflections WHERE student_id = ? ORDER BY id DESC LIMIT 1')
    .bind(s.id)
    .first<any>();

  const notif = (
    await c.env.DB.prepare(
      'SELECT id, message, kind, read_at, created_at FROM notifications WHERE student_id = ? ORDER BY id DESC LIMIT 10',
    )
      .bind(s.id)
      .all<any>()
  ).results;

  return c.json({
    siswa: { id: s.id, nama: s.full_name },
    level: sesi.level,
    kelompok,
    anggota,
    hari,
    namaProyek: p.nama_proyek,
    wajibLulusKuis: p.wajib_lulus_kuis === '1',
    progres,
    kuis,
    status: {
      wawancara: !!wawancara,
      pertidaksamaan: { percobaan: ineq?.percobaan ?? 0, selesai: !!ineq?.selesai },
      jurnal: {
        terisi: (jurnal || []).length,
        target: hari.hariKe,
        hariIniTerisi: jurnalHariIni,
        bolong: kalender.filter((k) => k.status === 'kosong').length,
      },
      portofolio: !!portofolio,
      refleksi: !!refleksi,
    },
    notifikasi: notif,
  });
});

/* ------------------------------ Progres --------------------------------- */

siswa.post('/siswa/progres', wajibSiswa, async (c) => {
  const s = c.get('siswa')!;
  const b = await c.req.json<{ fitur?: number; selesai?: boolean }>().catch(() => ({}) as any);
  const fitur = Number(b.fitur);
  // 1–10 = fitur utama; 21–24 = bab pada Modul Materi (Fitur 2)
  const sah = Number.isInteger(fitur) && ((fitur >= 1 && fitur <= 10) || (fitur >= 21 && fitur <= 24));
  if (!sah) return c.json({ pesan: 'Nomor fitur tidak valid.' }, 400);
  await tandaiProgres(c.env, s.id, fitur, b.selesai !== false);
  const progres = await progresSiswa(c.env, s.id);
  return c.json({ berhasil: true, pesan: 'Progres tersimpan ✅', progres });
});

/* -------------------------- FITUR 4 — Kuis ------------------------------ */

siswa.get('/kuis', wajibSiswa, async (c) => {
  const s = c.get('siswa')!;
  const kuis = await nilaiKuisTerbaik(c.env, s.id);
  const riwayat = (
    await c.env.DB.prepare(
      'SELECT score, passed, attempt_number, created_at FROM quiz_results WHERE student_id = ? ORDER BY id DESC LIMIT 10',
    )
      .bind(s.id)
      .all<any>()
  ).results;
  return c.json({
    soal: soalUntukSiswa(),
    totalSoal: TOTAL_SOAL,
    durasiMenit: 15,
    ...kuis,
    riwayat,
    // Kunci & pembahasan HANYA dibuka setelah siswa lulus
    pembahasan: kuis.lulus ? BANK_SOAL.map((q) => ({ id: q.id, kunci: q.kunci, pembahasan: q.pembahasan })) : null,
  });
});

siswa.post('/kuis', wajibSiswa, async (c) => {
  const s = c.get('siswa')!;
  const b = await c.req.json<{ jawaban?: Record<string, number> }>().catch(() => ({}) as any);
  const hasil = nilaiKuis(b.jawaban || {});
  const sebelum = await nilaiKuisTerbaik(c.env, s.id);
  const percobaan = sebelum.percobaan + 1;

  await c.env.DB.prepare(
    'INSERT INTO quiz_results (student_id, score, total_questions, passed, attempt_number) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(s.id, hasil.skor, TOTAL_SOAL, hasil.lulus ? 1 : 0, percobaan)
    .run();

  if (hasil.lulus) await tandaiProgres(c.env, s.id, 4, true);

  const sesudah = await nilaiKuisTerbaik(c.env, s.id);
  return c.json({
    skor: hasil.skor,
    benar: hasil.benar,
    totalSoal: TOTAL_SOAL,
    lulus: hasil.lulus,
    percobaan,
    nilaiTerbaik: sesudah.terbaik,
    pesan: hasil.lulus
      ? 'Selamat! Kamu lulus kuis. Silakan lanjut ke proyek.'
      : `Nilai kamu belum mencapai ${NILAI_LULUS}. Silakan pelajari kembali modul materi dan coba lagi.`,
    rincian: hasil.lulus ? hasil.rincian : null,
    pembahasan: hasil.lulus ? BANK_SOAL.map((q) => ({ id: q.id, kunci: q.kunci, pembahasan: q.pembahasan })) : null,
  });
});

/* ---------------------- FITUR 5 — Form wawancara ------------------------ */

function keMenit(nilai: number, satuan: string) {
  return satuan === 'jam' ? Math.round(nilai * 60) : Math.round(nilai);
}

siswa.get('/wawancara', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const row = await ambilWawancara(c.env, s.group_id!);
  return c.json({
    data: row ? { ...row, ingredients: bacaBahan(row) } : null,
    pilihanBahan: ['Tepung', 'Telur', 'Gula', 'Mentega', 'Susu', 'Cokelat', 'Keju'],
    pilihanSatuan: ['gram', 'kg', 'butir', 'ml', 'liter', 'sdm', 'sdt'],
  });
});

siswa.post('/wawancara', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const b = await c.req.json<any>().catch(() => ({}) as any);

  const namaA = String(b.product_a_name || '').trim();
  const namaB = String(b.product_b_name || '').trim();
  if (!namaA || !namaB) return c.json({ pesan: 'Nama Produk A dan Produk B wajib diisi.' }, 400);
  if (namaA.toLowerCase() === namaB.toLowerCase())
    return c.json({ pesan: 'Nama Produk A dan Produk B tidak boleh sama.' }, 400);

  const bahanMentah: any[] = Array.isArray(b.ingredients) ? b.ingredients : [];
  if (bahanMentah.length < 2) return c.json({ pesan: 'Minimal ada 2 baris bahan.' }, 400);

  const bahan: Bahan[] = [];
  for (const [i, x] of bahanMentah.entries()) {
    const nama = String(x.name || '').trim();
    const satuan = String(x.unit || '').trim() || 'gram';
    const perA = Number(x.per_a);
    const perB = Number(x.per_b);
    const total = Number(x.total);
    if (!nama) return c.json({ pesan: `Nama bahan pada baris ${i + 1} belum diisi.` }, 400);
    if (![perA, perB, total].every((n) => Number.isFinite(n) && n >= 0))
      return c.json({ pesan: `Angka pada baris bahan "${nama}" belum lengkap atau tidak valid.` }, 400);
    if (perA === 0 && perB === 0)
      return c.json({ pesan: `Bahan "${nama}" tidak dipakai di kedua produk. Isi minimal salah satu.` }, 400);
    if (total <= 0) return c.json({ pesan: `Total ${nama} per hari harus lebih dari 0.` }, 400);
    bahan.push({ name: nama, unit: satuan, per_a: perA, per_b: perB, total });
  }

  const satuanA = String(b.time_unit_a || b.time_unit || 'menit');
  const satuanB = String(b.time_unit_b || b.time_unit || 'menit');
  const satuanTotal = String(b.time_unit_total || b.time_unit || 'menit');
  const waktuA = keMenit(Number(b.time_per_a), satuanA);
  const waktuB = keMenit(Number(b.time_per_b), satuanB);
  const waktuTotal = keMenit(Number(b.time_total), satuanTotal);
  if (![waktuA, waktuB, waktuTotal].every((n) => Number.isFinite(n) && n >= 0))
    return c.json({ pesan: 'Data waktu belum lengkap atau tidak valid.' }, 400);
  if (waktuTotal <= 0) return c.json({ pesan: 'Total waktu kerja per hari harus lebih dari 0.' }, 400);
  if (waktuA === 0 && waktuB === 0) return c.json({ pesan: 'Waktu pembuatan produk tidak boleh 0 keduanya.' }, 400);

  const hargaA = Number(b.price_a);
  const modalA = Number(b.cost_a);
  const hargaB = Number(b.price_b);
  const modalB = Number(b.cost_b);
  if (![hargaA, modalA, hargaB, modalB].every((n) => Number.isFinite(n) && n >= 0))
    return c.json({ pesan: 'Data harga jual dan modal belum lengkap.' }, 400);
  if (hargaA <= modalA || hargaB <= modalB)
    return c.json({ pesan: 'Harga jual harus lebih besar dari modal agar ada keuntungan.' }, 400);

  await c.env.DB.prepare('DELETE FROM interview_data WHERE group_id = ?').bind(s.group_id).run();
  await c.env.DB.prepare(
    `INSERT INTO interview_data
      (group_id, product_a_name, product_b_name, ingredients, time_per_a, time_per_b, time_total,
       time_unit, price_a, cost_a, price_b, cost_b)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'menit', ?, ?, ?, ?)`,
  )
    .bind(s.group_id, namaA, namaB, JSON.stringify(bahan), waktuA, waktuB, waktuTotal, hargaA, modalA, hargaB, modalB)
    .run();

  await tandaiProgres(c.env, s.id, 5, true);
  return c.json({
    berhasil: true,
    pesan: 'Data wawancara tersimpan ✅ Lanjut ke Fitur 6 untuk menyusun pertidaksamaan.',
    keuntungan: { a: hargaA - modalA, b: hargaB - modalB },
  });
});

/* ------------- FITUR 6 — Feedback bertahap (BUKAN kalkulator) ----------- */

interface BarisKunci {
  key: string;
  jenis: 'bahan' | 'waktu';
  label: string;
  satuan: string;
  kunci: Kendala;
}

function susunKunci(w: any): BarisKunci[] {
  const bahan = bacaBahan(w);
  const baris: BarisKunci[] = bahan.map((b, i) => ({
    key: `bahan-${i}`,
    jenis: 'bahan',
    label: b.name,
    satuan: b.unit,
    kunci: { a: b.per_a, b: b.per_b, op: '<=', c: b.total, label: b.name },
  }));
  baris.push({
    key: 'waktu',
    jenis: 'waktu',
    label: 'Waktu produksi',
    satuan: 'menit',
    kunci: { a: w.time_per_a, b: w.time_per_b, op: '<=', c: w.time_total, label: 'Waktu' },
  });
  return baris;
}

siswa.get('/pertidaksamaan', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const w = await ambilWawancara(c.env, s.group_id!);
  if (!w) {
    return c.json({ pesan: 'Kelompokmu belum mengisi Form Wawancara (Fitur 5).', perluWawancara: true }, 400);
  }
  const baris = susunKunci(w).map(({ key, jenis, label, satuan }) => ({ key, jenis, label, satuan }));

  const terakhir = await c.env.DB.prepare(
    'SELECT * FROM inequality_submissions WHERE group_id = ? ORDER BY id DESC LIMIT 1',
  )
    .bind(s.group_id)
    .first<any>();
  const jumlah = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n, MAX(CASE WHEN all_correct THEN 1 ELSE 0 END) AS selesai
     FROM inequality_submissions WHERE group_id = ?`,
  )
    .bind(s.group_id)
    .first<any>();

  const selesai = !!jumlah?.selesai;
  let hadiah: any = null;
  if (selesai) hadiah = hitungHadiah(w);

  return c.json({
    referensi: {
      produkA: w.product_a_name,
      produkB: w.product_b_name,
      bahan: bacaBahan(w),
      waktu: { per_a: w.time_per_a, per_b: w.time_per_b, total: w.time_total, satuan: 'menit' },
      harga: { price_a: w.price_a, cost_a: w.cost_a, price_b: w.price_b, cost_b: w.cost_b },
    },
    baris,
    percobaan: jumlah?.n ?? 0,
    selesai,
    terakhir: terakhir
      ? {
          inequalities: JSON.parse(terakhir.inequalities || '[]'),
          objective_function: terakhir.objective_function,
          objective_correct: !!terakhir.objective_correct,
          all_correct: !!terakhir.all_correct,
          attempt_number: terakhir.attempt_number,
        }
      : null,
    hadiah,
  });
});

function hitungHadiah(w: any) {
  const bahan = bacaBahan(w);
  const kendala: Kendala[] = bahan.map((b) => ({
    a: b.per_a,
    b: b.per_b,
    op: '<=' as const,
    c: b.total,
    label: `${b.name} (${b.unit})`,
  }));
  kendala.push({ a: w.time_per_a, b: w.time_per_b, op: '<=', c: w.time_total, label: 'Waktu (menit)' });
  const tujuan = { a: w.price_a - w.cost_a, b: w.price_b - w.cost_b };
  const pojok = titikPojok(kendala);
  const optimum = nilaiOptimum(kendala, tujuan, 'maks');
  return {
    produkA: w.product_a_name,
    produkB: w.product_b_name,
    kendala,
    tujuan,
    pojok,
    optimum,
  };
}

siswa.post('/pertidaksamaan/cek', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const w = await ambilWawancara(c.env, s.group_id!);
  if (!w) return c.json({ pesan: 'Kelompokmu belum mengisi Form Wawancara (Fitur 5).', perluWawancara: true }, 400);

  const b = await c.req.json<{ jawaban?: Record<string, string>; nonneg?: string; tujuan?: string }>().catch(
    () => ({}) as any,
  );
  const jawaban = b.jawaban || {};
  const kunci = susunKunci(w);

  const hasil: (HasilPeriksa & { key: string; jenis: string })[] = [];
  for (const k of kunci) {
    const ctx: KonteksPetunjuk = {
      jenis: k.jenis,
      label: k.label,
      satuan: k.satuan,
      produkA: w.product_a_name,
      produkB: w.product_b_name,
    };
    const teks = jawaban[k.key] ?? '';
    const r = periksaPertidaksamaan(teks, k.kunci as any, ctx, {
      perAJam: w.time_per_a / 60,
      perBJam: w.time_per_b / 60,
      totalDalamJam: w.time_total / 60,
    });
    hasil.push({ ...r, key: k.key, jenis: k.jenis });
  }

  const ctxNon: KonteksPetunjuk = {
    jenis: 'nonneg',
    label: 'Syarat non-negatif',
    produkA: w.product_a_name,
    produkB: w.product_b_name,
  };
  const hasilNon = periksaNonNegatif(b.nonneg || '', ctxNon);
  hasil.push({ ...hasilNon, key: 'nonneg', jenis: 'nonneg' });

  const ctxTujuan: KonteksPetunjuk = {
    jenis: 'tujuan',
    label: 'Fungsi tujuan',
    produkA: w.product_a_name,
    produkB: w.product_b_name,
  };
  const hasilTujuan = periksaFungsiTujuan(
    b.tujuan || '',
    { a: w.price_a - w.cost_a, b: w.price_b - w.cost_b },
    ctxTujuan,
    { hargaA: w.price_a, modalA: w.cost_a, hargaB: w.price_b, modalB: w.cost_b },
  );

  const semuaBenar = hasil.every((h) => h.correct) && hasilTujuan.correct;

  const jumlah = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM inequality_submissions WHERE group_id = ?')
    .bind(s.group_id)
    .first<{ n: number }>();
  const percobaan = (jumlah?.n ?? 0) + 1;

  await c.env.DB.prepare(
    `INSERT INTO inequality_submissions
      (group_id, student_id, attempt_number, inequalities, objective_function, objective_correct, all_correct)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      s.group_id,
      s.id,
      percobaan,
      JSON.stringify(
        hasil.map((h) => ({ key: h.key, label: h.label, input: h.input, correct: h.correct, hint: h.hint, kode: h.kode })),
      ),
      b.tujuan || '',
      hasilTujuan.correct ? 1 : 0,
      semuaBenar ? 1 : 0,
    )
    .run();

  if (semuaBenar) await tandaiProgres(c.env, s.id, 6, true);

  const benarBanyak = hasil.filter((h) => h.correct).length + (hasilTujuan.correct ? 1 : 0);
  const totalBaris = hasil.length + 1;

  return c.json({
    hasil: hasil.map((h) => ({ key: h.key, label: h.label, correct: h.correct, hint: h.hint })),
    tujuan: { key: 'tujuan', label: hasilTujuan.label, correct: hasilTujuan.correct, hint: hasilTujuan.hint },
    semuaBenar,
    percobaan,
    benar: benarBanyak,
    total: totalBaris,
    pesan: semuaBenar
      ? '🎉 Hebat! Semua pertidaksamaan dan fungsi tujuanmu sudah tepat!'
      : `Sudah ${benarBanyak} dari ${totalBaris} bagian yang tepat. Baca petunjuknya, perbaiki, lalu cek lagi. Kamu pasti bisa! 💪`,
    // Hadiah HANYA diberikan setelah semua benar
    hadiah: semuaBenar ? hitungHadiah(w) : null,
  });
});

/* ------------------------ FITUR 7 — Jurnal harian ----------------------- */

siswa.get('/jurnal', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const hari = await infoHari(c.env);
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM journals WHERE student_id = ? ORDER BY day_number',
  )
    .bind(s.id)
    .all<any>();
  const kalender = susunKalender(hari, results || []);
  const hariIni = (results || []).find((j: any) => j.day_number === hari.hariKe) || null;
  return c.json({
    hari,
    jurnal: results || [],
    kalender,
    hariIni,
    perluIsi: !hariIni,
    peringatan: !hariIni ? `⚠️ Kamu belum mengisi jurnal hari ini! Segera isi sebelum pukul ${hari.batasJurnal}.` : null,
    maksUkuran: MAKS_JURNAL,
    ekstensiDiizinkan: EKSTENSI_JURNAL,
  });
});

siswa.post('/jurnal', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const hari = await infoHari(c.env);
  const form = await c.req.formData().catch(() => null);
  if (!form) return c.json({ pesan: 'Data formulir tidak terbaca.' }, 400);

  const kegiatan = String(form.get('activity') || '').trim();
  const kendala = String(form.get('obstacle') || '').trim();
  const hariKe = Number(form.get('day_number') || hari.hariKe);
  if (!kegiatan) return c.json({ pesan: 'Isi dulu "Apa yang kamu kerjakan hari ini?".' }, 400);
  if (!Number.isInteger(hariKe) || hariKe < 1 || hariKe > hari.totalHari)
    return c.json({ pesan: 'Nomor hari tidak valid.' }, 400);
  if (hariKe > hari.hariKe) return c.json({ pesan: 'Belum bisa mengisi jurnal untuk hari yang belum tiba.' }, 400);

  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;

  const berkas = form.get('berkas') as File | null;
  if (berkas && typeof berkas === 'object' && berkas.size > 0) {
    if (berkas.size > MAKS_JURNAL)
      return c.json({ pesan: `Ukuran berkas ${ukuranTerbaca(berkas.size)} melebihi batas 10 MB.` }, 400);
    const ext = ekstensi(berkas.name);
    if (!EKSTENSI_JURNAL.includes(ext))
      return c.json({ pesan: `Jenis berkas .${ext} tidak diizinkan. Gunakan: ${EKSTENSI_JURNAL.join(', ')}.` }, 400);
    const kunciR2 = `jurnal/${s.id}/hari-${hariKe}-${Date.now()}-${amankanNamaBerkas(berkas.name)}`;
    await c.env.R2.put(kunciR2, await berkas.arrayBuffer(), {
      httpMetadata: { contentType: berkas.type || 'application/octet-stream' },
    });
    fileUrl = `/api/berkas/${kunciR2}`;
    fileName = berkas.name;
    fileType = berkas.type || ext;
  }

  const ada = await c.env.DB.prepare('SELECT id, file_url, file_name, file_type FROM journals WHERE student_id = ? AND day_number = ?')
    .bind(s.id, hariKe)
    .first<any>();

  if (ada) {
    await c.env.DB.prepare(
      `UPDATE journals SET activity = ?, obstacle = ?, file_url = ?, file_name = ?, file_type = ?,
        created_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
      .bind(kegiatan, kendala, fileUrl ?? ada.file_url, fileName ?? ada.file_name, fileType ?? ada.file_type, ada.id)
      .run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO journals (student_id, group_id, day_number, activity, obstacle, file_url, file_name, file_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(s.id, s.group_id, hariKe, kegiatan, kendala, fileUrl, fileName, fileType)
      .run();
  }

  await tandaiProgres(c.env, s.id, 7, true);
  return c.json({ berhasil: true, pesan: `Jurnal hari ke-${hariKe} tersimpan ✅` });
});

/* ---------------------- FITUR 9 — Upload portofolio --------------------- */

const FORMAT_PORTOFOLIO = ['Laporan Tertulis', 'Infografis', 'Presentasi', 'Video', 'Booklet', 'Lainnya'];

siswa.get('/portofolio', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const row = await c.env.DB.prepare('SELECT * FROM portfolios WHERE group_id = ? ORDER BY id DESC LIMIT 1')
    .bind(s.group_id)
    .first<any>();
  return c.json({ data: row, format: FORMAT_PORTOFOLIO, maksUkuran: MAKS_PORTOFOLIO, ekstensiDiizinkan: EKSTENSI_PORTOFOLIO });
});

siswa.post('/portofolio', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const form = await c.req.formData().catch(() => null);
  if (!form) return c.json({ pesan: 'Data formulir tidak terbaca.' }, 400);
  const format = String(form.get('format_type') || '').trim();
  const catatan = String(form.get('notes') || '').trim();
  if (!format) return c.json({ pesan: 'Pilih dulu format portofolio kelompokmu.' }, 400);

  const berkas = form.get('berkas') as File | null;
  if (!berkas || typeof berkas !== 'object' || berkas.size === 0)
    return c.json({ pesan: 'Berkas portofolio wajib diunggah.' }, 400);
  if (berkas.size > MAKS_PORTOFOLIO)
    return c.json({ pesan: `Ukuran berkas ${ukuranTerbaca(berkas.size)} melebihi batas 50 MB.` }, 400);
  const ext = ekstensi(berkas.name);
  if (!EKSTENSI_PORTOFOLIO.includes(ext))
    return c.json({ pesan: `Jenis berkas .${ext} tidak diizinkan. Gunakan: ${EKSTENSI_PORTOFOLIO.join(', ')}.` }, 400);

  const kunciR2 = `portofolio/${s.group_id}/${Date.now()}-${amankanNamaBerkas(berkas.name)}`;
  await c.env.R2.put(kunciR2, await berkas.arrayBuffer(), {
    httpMetadata: { contentType: berkas.type || 'application/octet-stream' },
  });

  await c.env.DB.prepare('DELETE FROM portfolios WHERE group_id = ?').bind(s.group_id).run();
  await c.env.DB.prepare(
    'INSERT INTO portfolios (group_id, format_type, file_url, file_name, notes) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(s.group_id, format, `/api/berkas/${kunciR2}`, berkas.name, catatan || null)
    .run();

  await tandaiProgres(c.env, s.id, 9, true);
  return c.json({ berhasil: true, pesan: 'Portofolio kelompok berhasil diunggah 🎊' });
});

/* --------------------------- FITUR 10 — Refleksi ------------------------ */

siswa.get('/refleksi', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const row = await c.env.DB.prepare('SELECT * FROM reflections WHERE student_id = ? ORDER BY id DESC LIMIT 1')
    .bind(s.id)
    .first<any>();
  const kuis = await nilaiKuisTerbaik(c.env, s.id);
  const pertama = await c.env.DB.prepare(
    'SELECT score FROM quiz_results WHERE student_id = ? ORDER BY id ASC LIMIT 1',
  )
    .bind(s.id)
    .first<{ score: number }>();
  return c.json({
    data: row,
    kuisAwal: pertama?.score ?? null,
    kuisTerbaik: kuis.terbaik,
    grafik: row
      ? [
          { nama: 'Nilai Kuis Awal', nilai: pertama?.score ?? 0 },
          { nama: 'Nilai Kuis Terbaik', nilai: kuis.terbaik ?? 0 },
          { nama: 'Pemahaman Akhir', nilai: (row.improvement_rating || 0) * 20 },
        ]
      : null,
  });
});

siswa.post('/refleksi', wajibProyek, async (c) => {
  const s = c.get('siswa')!;
  const b = await c.req.json<any>().catch(() => ({}) as any);
  const belajar = String(b.what_learned || '').trim();
  const sulit = String(b.what_was_hard || '').trim();
  const rating = Number(b.improvement_rating);
  if (belajar.length < 10) return c.json({ pesan: 'Ceritakan minimal 10 karakter tentang hal baru yang kamu pelajari.' }, 400);
  if (sulit.length < 10) return c.json({ pesan: 'Ceritakan minimal 10 karakter tentang bagian yang paling sulit.' }, 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return c.json({ pesan: 'Pilih rating pemahaman 1 sampai 5 bintang.' }, 400);

  await c.env.DB.prepare('DELETE FROM reflections WHERE student_id = ?').bind(s.id).run();
  await c.env.DB.prepare(
    'INSERT INTO reflections (student_id, what_learned, what_was_hard, improvement_rating) VALUES (?, ?, ?, ?)',
  )
    .bind(s.id, belajar, sulit, rating)
    .run();
  await tandaiProgres(c.env, s.id, 10, true);

  return c.json({ berhasil: true, pesan: '🎉 Selamat! Kamu telah menyelesaikan seluruh proyek PjBL SPtLDV!' });
});

/* ------------------------------ Notifikasi ------------------------------ */

siswa.get('/notifikasi', wajibSiswa, async (c) => {
  const s = c.get('siswa')!;
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM notifications WHERE student_id = ? ORDER BY id DESC LIMIT 20',
  )
    .bind(s.id)
    .all<any>();
  return c.json({ notifikasi: results || [] });
});

siswa.post('/notifikasi/baca', wajibSiswa, async (c) => {
  const s = c.get('siswa')!;
  await c.env.DB.prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE student_id = ? AND read_at IS NULL')
    .bind(s.id)
    .run();
  return c.json({ berhasil: true });
});

/* ------------------------------ Berkas R2 ------------------------------- */

siswa.get('/berkas/*', async (c) => {
  const sesi = c.get('sesi');
  if (!sesi) return c.json({ pesan: 'Akses berkas memerlukan login.' }, 401);
  const kunci = decodeURIComponent(c.req.path.replace('/api/berkas/', ''));
  if (!kunci) return c.json({ pesan: 'Berkas tidak ditemukan.' }, 404);
  const obj = await c.env.R2.get(kunci);
  if (!obj) return c.json({ pesan: 'Berkas tidak ditemukan di penyimpanan.' }, 404);
  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'private, max-age=600');
  const nama = kunci.split('/').pop() || 'berkas';
  headers.set('Content-Disposition', `inline; filename="${nama}"`);
  return new Response(obj.body as any, { headers });
});
