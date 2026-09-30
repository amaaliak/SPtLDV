export function rupiah(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return 'Rp' + Math.round(Number(n)).toLocaleString('id-ID');
}

export function angka(n: number | null | undefined, desimal = 0): string {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('id-ID', { maximumFractionDigits: desimal });
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function tanggalPanjang(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return iso;
  return `${HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function tanggalPendek(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** Waktu WIB dari stempel UTC basis data. */
export function waktuWIB(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z'));
  if (isNaN(d.getTime())) return iso;
  const w = new Date(d.getTime() + 7 * 3600_000);
  const tgl = `${w.getUTCDate()}/${w.getUTCMonth() + 1}`;
  const jam = `${String(w.getUTCHours()).padStart(2, '0')}.${String(w.getUTCMinutes()).padStart(2, '0')}`;
  return `${tgl} pukul ${jam} WIB`;
}

export function potong(teks: string, n = 80): string {
  if (!teks) return '';
  return teks.length > n ? teks.slice(0, n) + '…' : teks;
}
