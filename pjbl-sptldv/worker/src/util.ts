/**
 * Utilitas umum: kata sandi, sesi, waktu WIB, validasi berkas.
 */

const ENC = new TextEncoder();

/* ------------------------------ Kata sandi ------------------------------ */

function bufKeHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexKeBuf(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** PBKDF2-SHA256 (tersedia di Workers maupun Node 18+). */
export async function hashSandi(sandi: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kunci = await crypto.subtle.importKey('raw', ENC.encode(sandi), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    kunci,
    256,
  );
  return `pbkdf2$100000$${bufKeHex(salt.buffer as ArrayBuffer)}$${bufKeHex(bits)}`;
}

export async function cocokSandi(sandi: string, tersimpan: string): Promise<boolean> {
  try {
    const [algo, iterStr, saltHex, hashHex] = tersimpan.split('$');
    if (algo !== 'pbkdf2') return false;
    const kunci = await crypto.subtle.importKey('raw', ENC.encode(sandi), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: hexKeBuf(saltHex) as unknown as BufferSource, iterations: Number(iterStr), hash: 'SHA-256' },
      kunci,
      256,
    );
    const a = new Uint8Array(bits);
    const b = hexKeBuf(hashHex);
    if (a.length !== b.length) return false;
    let beda = 0;
    for (let i = 0; i < a.length; i++) beda |= a[i] ^ b[i];
    return beda === 0;
  } catch {
    return false;
  }
}

/* -------------------------------- Sesi ---------------------------------- */

export const NAMA_COOKIE = 'pjbl_sesi';

export function idAcak(panjang = 32): string {
  return bufKeHex(crypto.getRandomValues(new Uint8Array(panjang)).buffer as ArrayBuffer);
}

export function pinAcak(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/* ----------------------------- Waktu (WIB) ------------------------------ */

const WIB_OFFSET_MENIT = 7 * 60;

/** Tanggal "YYYY-MM-DD" menurut zona Asia/Jakarta. */
export function tanggalWIB(d: Date = new Date()): string {
  const t = new Date(d.getTime() + WIB_OFFSET_MENIT * 60_000);
  return t.toISOString().slice(0, 10);
}

/** Jam "HH:MM" menurut zona Asia/Jakarta. */
export function jamWIB(d: Date = new Date()): string {
  const t = new Date(d.getTime() + WIB_OFFSET_MENIT * 60_000);
  return t.toISOString().slice(11, 16);
}

export function tambahHari(tanggal: string, n: number): string {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function selisihHari(dari: string, sampai: string): number {
  const a = new Date(`${dari}T00:00:00Z`).getTime();
  const b = new Date(`${sampai}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function tanggalIndonesia(tanggal: string): string {
  const d = new Date(`${tanggal}T00:00:00Z`);
  return `${HARI_ID[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN_ID[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/* ------------------------------- Berkas --------------------------------- */

export const EKSTENSI_JURNAL = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'mp4'];
export const EKSTENSI_PORTOFOLIO = [...EKSTENSI_JURNAL, 'webp', 'gif'];

export const MAKS_JURNAL = 10 * 1024 * 1024; // 10 MB
export const MAKS_PORTOFOLIO = 50 * 1024 * 1024; // 50 MB

export function ekstensi(nama: string): string {
  const p = nama.split('.');
  return p.length > 1 ? p.pop()!.toLowerCase() : '';
}

export function ukuranTerbaca(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function amankanNamaBerkas(nama: string): string {
  return nama.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
}

/* -------------------------------- Teks ---------------------------------- */

/** Rapikan nama: hapus spasi ganda, trim, kapitalisasi tiap kata. */
export function rapikanNama(nama: string): string {
  return nama
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((k) => (k.length > 2 ? k[0].toUpperCase() + k.slice(1).toLowerCase() : k.toUpperCase()))
    .join(' ');
}

export function rupiah(n: number): string {
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
}
