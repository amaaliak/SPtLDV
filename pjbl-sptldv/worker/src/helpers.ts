/**
 * Pembantu basis data & logika status (dipakai lintas rute).
 */
import type { Env, SiswaRow, WawancaraRow, Bahan } from './types';
import { tanggalWIB, jamWIB, selisihHari, tambahHari, tanggalIndonesia } from './util';
import { NILAI_LULUS } from './quiz';

/* ----------------------------- Pengaturan ------------------------------- */

export async function ambilPengaturan(env: Env): Promise<Record<string, string>> {
  const { results } = await env.DB.prepare('SELECT key, value FROM app_settings').all<{ key: string; value: string }>();
  const out: Record<string, string> = {};
  for (const r of results || []) out[r.key] = r.value ?? '';
  // nilai bawaan bila belum ada
  if (!out.total_hari) out.total_hari = '10';
  if (!out.tanggal_mulai) out.tanggal_mulai = tanggalWIB();
  if (!out.nama_proyek) out.nama_proyek = 'Proyek Kantin Tata Boga';
  if (!out.wajib_lulus_kuis) out.wajib_lulus_kuis = '1';
  return out;
}

export async function simpanPengaturan(env: Env, key: string, value: string) {
  await env.DB.prepare(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(key, value)
    .run();
}

export interface InfoHari {
  hariKe: number;
  totalHari: number;
  tanggalMulai: string;
  tanggalHariIni: string;
  tanggalTeks: string;
  jamSekarang: string;
  batasJurnal: string;
}

export async function infoHari(env: Env): Promise<InfoHari> {
  const p = await ambilPengaturan(env);
  const hariIni = tanggalWIB();
  const total = Math.max(1, parseInt(p.total_hari || '10', 10));
  const beda = selisihHari(p.tanggal_mulai, hariIni);
  const hariKe = Math.min(Math.max(beda + 1, 1), total);
  return {
    hariKe,
    totalHari: total,
    tanggalMulai: p.tanggal_mulai,
    tanggalHariIni: hariIni,
    tanggalTeks: tanggalIndonesia(hariIni),
    jamSekarang: jamWIB(),
    batasJurnal: p.batas_jurnal || '23:59',
  };
}

/* -------------------------------- Siswa --------------------------------- */

export async function ambilSiswa(env: Env, id: number): Promise<SiswaRow | null> {
  return await env.DB.prepare('SELECT * FROM students WHERE id = ?').bind(id).first<SiswaRow>();
}

export async function progresSiswa(env: Env, siswaId: number): Promise<Record<number, boolean>> {
  const { results } = await env.DB.prepare(
    'SELECT feature_number, completed FROM module_progress WHERE student_id = ?',
  )
    .bind(siswaId)
    .all<{ feature_number: number; completed: number }>();
  const out: Record<number, boolean> = {};
  for (const r of results || []) out[r.feature_number] = !!r.completed;
  return out;
}

export async function tandaiProgres(env: Env, siswaId: number, fitur: number, selesai: boolean) {
  await env.DB.prepare(
    `INSERT INTO module_progress (student_id, feature_number, completed, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(student_id, feature_number)
     DO UPDATE SET completed = excluded.completed, updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(siswaId, fitur, selesai ? 1 : 0)
    .run();
}

export async function nilaiKuisTerbaik(env: Env, siswaId: number) {
  const row = await env.DB.prepare(
    `SELECT MAX(score) AS terbaik, COUNT(*) AS percobaan,
            MAX(CASE WHEN passed THEN 1 ELSE 0 END) AS lulus
     FROM quiz_results WHERE student_id = ?`,
  )
    .bind(siswaId)
    .first<{ terbaik: number | null; percobaan: number; lulus: number }>();
  return {
    terbaik: row?.terbaik ?? null,
    percobaan: row?.percobaan ?? 0,
    lulus: !!row?.lulus,
    ambangLulus: NILAI_LULUS,
  };
}

/* ------------------------------ Wawancara ------------------------------- */

export async function ambilWawancara(env: Env, groupId: number): Promise<WawancaraRow | null> {
  return await env.DB.prepare(
    'SELECT * FROM interview_data WHERE group_id = ? ORDER BY id DESC LIMIT 1',
  )
    .bind(groupId)
    .first<WawancaraRow>();
}

export function bacaBahan(row: WawancaraRow): Bahan[] {
  try {
    const arr = JSON.parse(row.ingredients);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/* ------------------------------- Jurnal --------------------------------- */

export interface StatusHari {
  hari: number;
  tanggal: string;
  status: 'terisi' | 'kosong' | 'hari_ini' | 'belum_mulai';
  adaBerkas: boolean;
}

export function susunKalender(
  info: InfoHari,
  jurnal: { day_number: number; file_url: string | null }[],
): StatusHari[] {
  const peta = new Map(jurnal.map((j) => [j.day_number, j]));
  const out: StatusHari[] = [];
  for (let h = 1; h <= info.totalHari; h++) {
    const tgl = tambahHari(info.tanggalMulai, h - 1);
    const ada = peta.get(h);
    let status: StatusHari['status'];
    if (ada) status = 'terisi';
    else if (h === info.hariKe) status = 'hari_ini';
    else if (h > info.hariKe) status = 'belum_mulai';
    else status = 'kosong'; // lewat 23:59 tanpa isi -> Tidak Ada Kemajuan
    out.push({ hari: h, tanggal: tgl, status, adaBerkas: !!ada?.file_url });
  }
  return out;
}

/* ------------------------- Status siswa (Fitur 8) ----------------------- */

export type Warna = 'hijau' | 'kuning' | 'merah';

export function hitungStatus(tertinggal: number, adaAktivitas: boolean): { warna: Warna; teks: string } {
  if (!adaAktivitas) return { warna: 'merah', teks: 'Macet' };
  if (tertinggal === 0) return { warna: 'hijau', teks: 'Lancar' };
  if (tertinggal <= 2) return { warna: 'kuning', teks: 'Lambat' };
  return { warna: 'merah', teks: 'Macet' };
}
