/**
 * Tipe data bersama untuk backend Cloudflare Worker.
 */
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  NAMA_APLIKASI?: string;
  ZONA_WAKTU?: string;
}

export interface Sesi {
  id: string;
  role: 'siswa' | 'guru';
  student_id: number | null;
  teacher_id: number | null;
  level: number;
}

export interface SiswaRow {
  id: number;
  full_name: string;
  group_id: number | null;
  pin_entered: number;
  created_at: string;
}

export interface KelompokRow {
  id: number;
  name: string;
  pin: string;
  created_at: string;
}

export interface Bahan {
  name: string;
  unit: string;
  per_a: number;
  per_b: number;
  total: number;
}

export interface WawancaraRow {
  id: number;
  group_id: number;
  product_a_name: string;
  product_b_name: string;
  ingredients: string;
  time_per_a: number;
  time_per_b: number;
  time_total: number;
  time_unit: string;
  price_a: number;
  cost_a: number;
  price_b: number;
  cost_b: number;
  created_at: string;
}

export type Variabel = {
  Bindings: Env;
  Variables: {
    sesi: Sesi | null;
    siswa: SiswaRow | null;
  };
};
