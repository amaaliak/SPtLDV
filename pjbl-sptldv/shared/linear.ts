/**
 * Mesin perhitungan program linear — dipakai BERSAMA oleh
 * frontend (Fitur 3 grafik interaktif & hadiah Fitur 6) dan
 * backend Worker (penentuan titik pojok + nilai optimum).
 *
 * Semua dihitung sendiri (tanpa GeoGebra / pustaka eksternal).
 */

export type Tanda = '<=' | '>=' | '<' | '>';

export interface Kendala {
  a: number; // koefisien x
  b: number; // koefisien y
  op: Tanda;
  c: number; // ruas kanan
  label?: string;
  warna?: string;
}

export interface Titik {
  x: number;
  y: number;
}

const EPS = 1e-7;

export function bulatkan(n: number, d = 4): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

/** Perpotongan dua garis a1x+b1y=c1 dan a2x+b2y=c2. */
export function potongGaris(k1: Kendala, k2: Kendala): Titik | null {
  const det = k1.a * k2.b - k2.a * k1.b;
  if (Math.abs(det) < EPS) return null; // sejajar / berimpit
  return {
    x: (k1.c * k2.b - k2.c * k1.b) / det,
    y: (k1.a * k2.c - k2.a * k1.c) / det,
  };
}

/** Apakah titik memenuhi sebuah kendala (dengan toleransi kecil). */
export function penuhiSatu(t: Titik, k: Kendala, toleransi = 1e-6): boolean {
  const nilai = k.a * t.x + k.b * t.y;
  if (k.op === '<=' || k.op === '<') return nilai <= k.c + toleransi;
  return nilai >= k.c - toleransi;
}

/** Apakah titik memenuhi SEMUA kendala. */
export function penuhiSemua(t: Titik, kendala: Kendala[], toleransi = 1e-6): boolean {
  return kendala.every((k) => penuhiSatu(t, k, toleransi));
}

/** Kendala non-negatif x >= 0 dan y >= 0. */
export function kendalaNonNegatif(): Kendala[] {
  return [
    { a: 1, b: 0, op: '>=', c: 0, label: 'x ≥ 0' },
    { a: 0, b: 1, op: '>=', c: 0, label: 'y ≥ 0' },
  ];
}

/**
 * Titik pojok (vertex) daerah penyelesaian: semua perpotongan pasangan
 * garis pembatas yang memenuhi seluruh kendala, diurutkan berlawanan
 * arah jarum jam.
 */
export function titikPojok(kendala: Kendala[], sertakanNonNegatif = true): Titik[] {
  const semua = sertakanNonNegatif ? [...kendala, ...kendalaNonNegatif()] : [...kendala];
  const kandidat: Titik[] = [];
  for (let i = 0; i < semua.length; i++) {
    for (let j = i + 1; j < semua.length; j++) {
      const t = potongGaris(semua[i], semua[j]);
      if (!t) continue;
      if (!isFinite(t.x) || !isFinite(t.y)) continue;
      if (Math.abs(t.x) > 1e7 || Math.abs(t.y) > 1e7) continue;
      if (penuhiSemua(t, semua, 1e-6)) kandidat.push({ x: bulatkan(t.x, 6), y: bulatkan(t.y, 6) });
    }
  }
  // buang duplikat
  const unik: Titik[] = [];
  for (const t of kandidat) {
    if (!unik.some((u) => Math.abs(u.x - t.x) < 1e-6 && Math.abs(u.y - t.y) < 1e-6)) unik.push(t);
  }
  return urutkanPoligon(unik);
}

/** Urutkan titik membentuk poligon (berlawanan arah jarum jam). */
export function urutkanPoligon(titik: Titik[]): Titik[] {
  if (titik.length < 3) return titik;
  const cx = titik.reduce((s, t) => s + t.x, 0) / titik.length;
  const cy = titik.reduce((s, t) => s + t.y, 0) / titik.length;
  return [...titik].sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx));
}

/**
 * Potong poligon dengan setengah bidang (algoritma Sutherland–Hodgman).
 * Dipakai untuk mengarsir daerah penyelesaian, termasuk daerah tak terbatas
 * (dipotong oleh kotak tampilan grafik).
 */
export function klipSetengahBidang(poligon: Titik[], k: Kendala): Titik[] {
  if (poligon.length === 0) return [];
  const f = (t: Titik) => (k.op === '<=' || k.op === '<' ? k.c - (k.a * t.x + k.b * t.y) : k.a * t.x + k.b * t.y - k.c);
  const hasil: Titik[] = [];
  for (let i = 0; i < poligon.length; i++) {
    const kini = poligon[i];
    const lalu = poligon[(i + poligon.length - 1) % poligon.length];
    const fk = f(kini);
    const fl = f(lalu);
    const kiniDalam = fk >= -1e-9;
    const laluDalam = fl >= -1e-9;
    if (kiniDalam) {
      if (!laluDalam) {
        const t = fl / (fl - fk);
        hasil.push({ x: lalu.x + t * (kini.x - lalu.x), y: lalu.y + t * (kini.y - lalu.y) });
      }
      hasil.push(kini);
    } else if (laluDalam) {
      const t = fl / (fl - fk);
      hasil.push({ x: lalu.x + t * (kini.x - lalu.x), y: lalu.y + t * (kini.y - lalu.y) });
    }
  }
  return hasil;
}

/** Poligon daerah penyelesaian yang sudah dipotong kotak tampilan. */
export function daerahPenyelesaian(
  kendala: Kendala[],
  batas: { xMin: number; xMaks: number; yMin: number; yMaks: number },
  sertakanNonNegatif = true,
): Titik[] {
  let poligon: Titik[] = [
    { x: batas.xMin, y: batas.yMin },
    { x: batas.xMaks, y: batas.yMin },
    { x: batas.xMaks, y: batas.yMaks },
    { x: batas.xMin, y: batas.yMaks },
  ];
  const semua = sertakanNonNegatif ? [...kendala, ...kendalaNonNegatif()] : kendala;
  for (const k of semua) {
    poligon = klipSetengahBidang(poligon, k);
    if (poligon.length === 0) break;
  }
  return poligon;
}

export interface HasilOptimum {
  titik: Titik | null;
  nilai: number;
  semuaTitik: { x: number; y: number; z: number }[];
  mode: 'maks' | 'min';
}

/** Uji titik pojok untuk fungsi tujuan Z = ax + by. */
export function nilaiOptimum(
  kendala: Kendala[],
  tujuan: { a: number; b: number },
  mode: 'maks' | 'min' = 'maks',
): HasilOptimum {
  const pojok = titikPojok(kendala);
  const dinilai = pojok.map((t) => ({ x: t.x, y: t.y, z: tujuan.a * t.x + tujuan.b * t.y }));
  if (dinilai.length === 0) return { titik: null, nilai: 0, semuaTitik: [], mode };
  const terbaik = dinilai.reduce((acc, t) => {
    if (mode === 'maks') return t.z > acc.z ? t : acc;
    return t.z < acc.z ? t : acc;
  }, dinilai[0]);
  return { titik: { x: terbaik.x, y: terbaik.y }, nilai: terbaik.z, semuaTitik: dinilai, mode };
}

/** Teks pertidaksamaan yang rapi, mis. "200x + 150y ≤ 10000". */
export function tulisKendala(k: Kendala): string {
  const tanda = k.op === '<=' ? '≤' : k.op === '>=' ? '≥' : k.op;
  const suku: string[] = [];
  if (Math.abs(k.a) > EPS) suku.push(`${ringkas(k.a)}x`);
  if (Math.abs(k.b) > EPS) suku.push(`${k.b < 0 ? '− ' : suku.length ? '+ ' : ''}${ringkas(Math.abs(k.b))}y`);
  return `${suku.join(' ') || '0'} ${tanda} ${ringkas(k.c)}`;
}

function ringkas(n: number): string {
  const b = bulatkan(n, 3);
  if (b === 1) return '';
  if (b === -1) return '−';
  return String(b);
}

/** Skala sumbu otomatis berdasarkan titik potong kendala. */
export function batasOtomatis(kendala: Kendala[]): { xMaks: number; yMaks: number } {
  let xMaks = 10;
  let yMaks = 10;
  for (const k of kendala) {
    if (Math.abs(k.a) > EPS) xMaks = Math.max(xMaks, Math.abs(k.c / k.a));
    if (Math.abs(k.b) > EPS) yMaks = Math.max(yMaks, Math.abs(k.c / k.b));
  }
  const rapi = (n: number) => {
    const pad = Math.pow(10, Math.floor(Math.log10(Math.max(n, 1))) - 1) || 1;
    return Math.ceil((n * 1.25) / pad) * pad;
  };
  return { xMaks: rapi(xMaks), yMaks: rapi(yMaks) };
}
