/**
 * FITUR 6 — Mesin FEEDBACK BERTAHAP (bukan kalkulator!).
 *
 * ATURAN MUTLAK: fungsi-fungsi di berkas ini TIDAK PERNAH mengembalikan
 * jawaban benar, koefisien kunci, maupun angka dari kunci jawaban.
 * Yang dikembalikan hanya: benar/salah + PETUNJUK kontekstual berbahasa
 * Indonesia yang mengarahkan siswa kembali ke data wawancaranya.
 */

export interface Linear {
  a: number; // koefisien x
  b: number; // koefisien y
  op: '<=' | '>=' | '<' | '>' | '=';
  c: number; // ruas kanan
}

export interface KonteksPetunjuk {
  jenis: 'bahan' | 'waktu' | 'nonneg' | 'tujuan';
  label: string; // mis. "Tepung"
  satuan?: string; // mis. "gram"
  produkA: string;
  produkB: string;
}

export interface HasilPeriksa {
  label: string;
  input: string;
  correct: boolean;
  hint: string;
  kode: string; // kode jenis kesalahan (untuk analitik guru)
}

const EPS = 1e-6;

/* --------------------------- Normalisasi teks --------------------------- */

export function normalisasiDasar(teks: string): string {
  return (teks || '')
    .toLowerCase()
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/[\u00d7\u00b7]/g, '*')
    .replace(/rp\.?/g, '')
    .replace(/\s+/g, '');
}

/** Hilangkan pemisah ribuan: 10.000 / 10,000 -> 10000 */
function bersihkanAngka(s: string): string {
  return s.replace(/(\d)[.,](?=\d{3}(\D|$))/g, '$1').replace(/,/g, '.');
}

/* ------------------------------ Parser ---------------------------------- */

function parseEkspresi(s: string): { a: number; b: number; k: number } | null {
  if (!s) return null;
  let i = 0;
  let a = 0;
  let b = 0;
  let k = 0;
  let suku = 0;
  while (i < s.length) {
    let tanda = 1;
    if (s[i] === '+') i++;
    else if (s[i] === '-') {
      tanda = -1;
      i++;
    } else if (suku > 0) return null; // suku harus dipisah + atau -
    const m = /^(\d+(?:\.\d+)?)?(\*)?([xy])?/.exec(s.slice(i));
    if (!m || m[0].length === 0) return null;
    if (m[1] === undefined && m[3] === undefined) return null;
    const angka = m[1] === undefined ? 1 : parseFloat(m[1]);
    if (m[3] === 'x') a += tanda * angka;
    else if (m[3] === 'y') b += tanda * angka;
    else k += tanda * angka;
    i += m[0].length;
    suku++;
  }
  return { a, b, k };
}

/** Ubah teks pertidaksamaan menjadi bentuk baku ax + by (op) c. */
export function parsePertidaksamaan(teks: string): Linear | null {
  const s = bersihkanAngka(normalisasiDasar(teks));
  if (!s) return null;
  const m = /(<=|>=|=<|=>|<|>|=)/.exec(s);
  if (!m) return null;
  let op = m[1] as string;
  if (op === '=<') op = '<=';
  if (op === '=>') op = '>=';
  const kiri = parseEkspresi(s.slice(0, m.index));
  const kanan = parseEkspresi(s.slice(m.index + m[1].length));
  if (!kiri || !kanan) return null;
  let a = kiri.a - kanan.a;
  let b = kiri.b - kanan.b;
  let c = kanan.k - kiri.k;
  let arah = op as Linear['op'];
  // Bentuk terbalik (mis. "10000 >= 200x + 150y") -> baku
  if (a < -EPS || (Math.abs(a) < EPS && b < -EPS)) {
    a = -a;
    b = -b;
    c = -c;
    arah = arah === '<=' ? '>=' : arah === '>=' ? '<=' : arah === '<' ? '>' : arah === '>' ? '<' : '=';
  }
  return { a, b, op: arah, c };
}

/** Ubah teks fungsi tujuan (mis. "Z = 3000x + 2500y") menjadi koefisien. */
export function parseFungsiTujuan(teks: string): { a: number; b: number } | null {
  let s = bersihkanAngka(normalisasiDasar(teks));
  if (!s) return null;
  s = s.replace(/^(maks(imum|imalkan)?|max|min(imum)?|f\(x,y\)|f|z)+=?/, '');
  s = s.replace(/^=/, '');
  const e = parseEkspresi(s);
  if (!e) return null;
  if (Math.abs(e.a) < EPS && Math.abs(e.b) < EPS) return null;
  return { a: e.a, b: e.b };
}

/* -------------------------- Syarat non-negatif -------------------------- */

export function periksaNonNegatif(teks: string, ctx: KonteksPetunjuk): HasilPeriksa {
  const s = normalisasiDasar(teks).replace(/dan|&|\+/g, ',').replace(/;/g, ',');
  const bagian = s.split(',').filter(Boolean);
  const adaX = bagian.some((p) => /^x>=0$/.test(p) || /^0<=x$/.test(p));
  const adaY = bagian.some((p) => /^y>=0$/.test(p) || /^0<=y$/.test(p));
  const adaXsalahTanda = bagian.some((p) => /^x>0$/.test(p) || /^x<=0$/.test(p) || /^x<0$/.test(p));
  const adaYsalahTanda = bagian.some((p) => /^y>0$/.test(p) || /^y<=0$/.test(p) || /^y<0$/.test(p));

  if (adaX && adaY) return { label: 'Syarat non-negatif', input: teks, correct: true, hint: '', kode: 'ok' };

  if (adaXsalahTanda || adaYsalahTanda) {
    return {
      label: 'Syarat non-negatif',
      input: teks,
      correct: false,
      hint: 'Hampir tepat. Perhatikan tandanya: bolehkah kantin memproduksi tepat 0 porsi? Kalau boleh, tanda mana yang harus dipakai?',
      kode: 'nonneg_tanda',
    };
  }
  if (adaX !== adaY) {
    const kurang = adaX ? ctx.produkB : ctx.produkA;
    return {
      label: 'Syarat non-negatif',
      input: teks,
      correct: false,
      hint: `Syaratnya belum lengkap. Kamu baru menulis untuk satu produk saja — bagaimana dengan ${kurang}? Apakah mungkin memproduksi jumlah negatif? Tambahkan syarat yang kurang.`,
      kode: 'nonneg_kurang',
    };
  }
  return {
    label: 'Syarat non-negatif',
    input: teks,
    correct: false,
    hint: 'Apakah mungkin memproduksi jumlah negatif? Tambahkan syarat yang kurang untuk kedua variabel, tulis dengan format seperti "x ... 0, y ... 0".',
    kode: 'nonneg_kosong',
  };
}

/* ------------------------ Pemeriksa pertidaksamaan ---------------------- */

function sama(p: number, q: number) {
  return Math.abs(p - q) < 1e-6;
}

function rasio(p: number, q: number): number | null {
  if (Math.abs(q) < EPS) return null;
  return p / q;
}

/**
 * Bandingkan jawaban siswa dengan kunci (kunci TIDAK pernah dibocorkan).
 */
export function periksaPertidaksamaan(
  teks: string,
  kunci: Linear,
  ctx: KonteksPetunjuk,
  opsi?: { totalDalamJam?: number; perAJam?: number; perBJam?: number },
): HasilPeriksa {
  const dasar = { label: ctx.label, input: teks };

  if (!teks || !teks.trim()) {
    return {
      ...dasar,
      correct: false,
      hint: 'Bagian ini masih kosong. Tulis pertidaksamaannya dengan format seperti contoh: "…x + …y ≤ …".',
      kode: 'kosong',
    };
  }

  const p = parsePertidaksamaan(teks);
  if (!p) {
    return {
      ...dasar,
      correct: false,
      hint: 'Format penulisan belum terbaca. Gunakan pola: bilangan x + bilangan y ≤ bilangan (contoh pola: "…x + …y <= …"). Jangan gunakan satuan atau kata-kata.',
      kode: 'format',
    };
  }

  const cocokKoefA = sama(p.a, kunci.a);
  const cocokKoefB = sama(p.b, kunci.b);
  const cocokRuasKanan = sama(p.c, kunci.c);
  const cocokTanda = p.op === kunci.op;

  if (cocokKoefA && cocokKoefB && cocokRuasKanan && cocokTanda) {
    return { ...dasar, correct: true, hint: '', kode: 'ok' };
  }

  // --- Kesalahan satuan waktu (menit vs jam) ---
  if (ctx.jenis === 'waktu' && opsi) {
    const pakaiJam =
      (opsi.perAJam !== undefined && sama(p.a, opsi.perAJam)) ||
      (opsi.totalDalamJam !== undefined && sama(p.c, opsi.totalDalamJam));
    if (pakaiJam) {
      return {
        ...dasar,
        correct: false,
        hint: 'Satuan waktunya belum seragam. Samakan semua waktu ke satuan yang dipakai pada tabel data wawancaramu sebelum menyusun pertidaksamaan.',
        kode: 'waktu_satuan',
      };
    }
  }

  // --- Tertukar: koefisien x dan y terbalik ---
  if (sama(p.a, kunci.b) && sama(p.b, kunci.a) && !sama(kunci.a, kunci.b)) {
    return {
      ...dasar,
      correct: false,
      hint: `Angkanya sudah ada di data, tetapi posisinya tertukar. Ingat: x mewakili ${ctx.produkA} dan y mewakili ${ctx.produkB}. Cek lagi mana yang seharusnya jadi koefisien x.`,
      kode: 'tertukar',
    };
  }

  // --- Skala/kelipatan (mis. semua dibagi 50) ---
  const rA = rasio(p.a, kunci.a);
  const rB = rasio(p.b, kunci.b);
  const rC = rasio(p.c, kunci.c);
  if (rA !== null && rB !== null && rC !== null && sama(rA, rB) && sama(rB, rC) && !sama(rA, 1) && rA > 0) {
    return {
      ...dasar,
      correct: false,
      hint: 'Arah pemikiranmu sudah benar, tapi angkanya sudah kamu sederhanakan/ubah skalanya. Tuliskan angka PERSIS seperti yang tertulis pada tabel data wawancara kelompokmu.',
      kode: 'skala',
    };
  }

  // --- Tanda pertidaksamaan salah ---
  if (cocokKoefA && cocokKoefB && cocokRuasKanan && !cocokTanda) {
    const obj = ctx.jenis === 'waktu' ? 'waktu kerja' : ctx.label;
    return {
      ...dasar,
      correct: false,
      hint: `Semua angkanya sudah benar, tinggal tandanya. Pikirkan: apakah ${obj} itu batas MAKSIMAL (tidak boleh lebih) atau batas MINIMAL (tidak boleh kurang)?`,
      kode: 'tanda',
    };
  }

  // --- Ruas kanan salah ---
  if (cocokKoefA && cocokKoefB && !cocokRuasKanan) {
    const teksHint =
      ctx.jenis === 'waktu'
        ? 'Ruas kanan harus berisi TOTAL waktu kerja yang tersedia per hari. Cek kembali form data wawancaramu.'
        : `Ruas kanan harus berisi total ${ctx.label.toLowerCase()} yang tersedia per hari, bukan kebutuhan per porsi. Cek kembali form data wawancaramu.`;
    return { ...dasar, correct: false, hint: teksHint, kode: 'ruas_kanan' };
  }

  // --- Koefisien salah ---
  if (!cocokKoefA || !cocokKoefB) {
    const salahDi = !cocokKoefA && !cocokKoefB ? 'kedua' : !cocokKoefA ? 'x' : 'y';
    const produk = salahDi === 'y' ? ctx.produkB : ctx.produkA;
    if (ctx.jenis === 'waktu') {
      const hint =
        salahDi === 'kedua'
          ? `Cek data wawancaramu: berapa lama waktu untuk membuat 1 ${ctx.produkA} dan 1 ${ctx.produkB}?`
          : `Cek data wawancaramu: berapa lama waktu untuk membuat 1 ${produk}?`;
      return { ...dasar, correct: false, hint, kode: 'koefisien' };
    }
    const satuan = ctx.satuan ? ` ${ctx.satuan}` : '';
    const hint =
      salahDi === 'kedua'
        ? `Cek data wawancaramu: berapa${satuan} ${ctx.label.toLowerCase()} untuk 1 ${ctx.produkA}, dan berapa untuk 1 ${ctx.produkB}?`
        : `Cek data wawancaramu: berapa${satuan} ${ctx.label.toLowerCase()} untuk 1 ${produk}?`;
    return { ...dasar, correct: false, hint, kode: 'koefisien' };
  }

  return {
    ...dasar,
    correct: false,
    hint: 'Belum tepat. Bandingkan sekali lagi baris ini dengan tabel data wawancara kelompokmu, mulai dari koefisien x, koefisien y, lalu ruas kanannya.',
    kode: 'lain',
  };
}

/* ------------------------- Pemeriksa fungsi tujuan ---------------------- */

export function periksaFungsiTujuan(
  teks: string,
  kunci: { a: number; b: number },
  ctx: KonteksPetunjuk,
  data: { hargaA: number; modalA: number; hargaB: number; modalB: number },
): HasilPeriksa {
  const dasar = { label: 'Fungsi tujuan', input: teks };
  if (!teks || !teks.trim()) {
    return {
      ...dasar,
      correct: false,
      hint: 'Fungsi tujuan masih kosong. Tulis dengan pola "Z = …x + …y".',
      kode: 'kosong',
    };
  }
  const f = parseFungsiTujuan(teks);
  if (!f) {
    return {
      ...dasar,
      correct: false,
      hint: 'Format fungsi tujuan belum terbaca. Gunakan pola "Z = …x + …y" tanpa satuan Rp dan tanpa titik ribuan.',
      kode: 'format',
    };
  }
  if (sama(f.a, kunci.a) && sama(f.b, kunci.b)) {
    return { ...dasar, correct: true, hint: '', kode: 'ok' };
  }
  // Memakai harga jual
  if (sama(f.a, data.hargaA) && sama(f.b, data.hargaB)) {
    return {
      ...dasar,
      correct: false,
      hint: 'Fungsi tujuan harus berdasarkan KEUNTUNGAN (harga jual − modal), bukan harga jual.',
      kode: 'tujuan_harga',
    };
  }
  // Memakai modal
  if (sama(f.a, data.modalA) && sama(f.b, data.modalB)) {
    return {
      ...dasar,
      correct: false,
      hint: 'Yang kamu tulis adalah modal, bukan keuntungan. Fungsi tujuan memakai KEUNTUNGAN per porsi (harga jual − modal).',
      kode: 'tujuan_modal',
    };
  }
  // Memakai harga + modal
  if (sama(f.a, data.hargaA + data.modalA) && sama(f.b, data.hargaB + data.modalB)) {
    return {
      ...dasar,
      correct: false,
      hint: 'Harga jual dan modal jangan dijumlahkan. Keuntungan diperoleh dari harga jual DIKURANGI modal.',
      kode: 'tujuan_jumlah',
    };
  }
  // Tertukar
  if (sama(f.a, kunci.b) && sama(f.b, kunci.a) && !sama(kunci.a, kunci.b)) {
    return {
      ...dasar,
      correct: false,
      hint: `Nilainya sudah benar tetapi tertukar. Koefisien x adalah keuntungan ${ctx.produkA}, koefisien y keuntungan ${ctx.produkB}.`,
      kode: 'tujuan_tertukar',
    };
  }
  return {
    ...dasar,
    correct: false,
    hint: 'Belum tepat. Hitung ulang keuntungan tiap produk dari data wawancaramu: harga jual − modal, lalu jadikan koefisien x dan y.',
    kode: 'tujuan_lain',
  };
}
