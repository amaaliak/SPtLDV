import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ambil, kirim } from './api';

export interface DataSesi {
  masuk: boolean;
  peran: 'tamu' | 'siswa' | 'guru';
  level: number;
  siswa?: { id: number; nama: string; group_id: number | null };
  kelompok?: { id: number; name: string } | null;
  kuis?: { terbaik: number | null; percobaan: number; lulus: boolean; ambangLulus: number };
  progres?: Record<string, boolean>;
  notifikasiBaru?: number;
  guru?: { id: number; name: string; class_name: string | null };
  wajibLulusKuis?: boolean;
}

export interface StatusApl {
  aplikasi: string;
  guruTerdaftar: boolean;
  namaGuru: string | null;
  kelas: string | null;
  pengaturan: { nama_proyek: string; video_url: string; total_hari: number; wajib_lulus_kuis: boolean };
  hari: {
    hariKe: number;
    totalHari: number;
    tanggalMulai: string;
    tanggalHariIni: string;
    tanggalTeks: string;
    jamSekarang: string;
    batasJurnal: string;
  };
}

interface Nilai {
  sesi: DataSesi | null;
  status: StatusApl | null;
  memuat: boolean;
  segarkan: () => Promise<DataSesi | null>;
  keluar: () => Promise<void>;
}

const Konteks = createContext<Nilai>({
  sesi: null,
  status: null,
  memuat: true,
  segarkan: async () => null,
  keluar: async () => {},
});

export function PenyediaSesi({ children }: { children: ReactNode }) {
  const [sesi, setSesi] = useState<DataSesi | null>(null);
  const [status, setStatus] = useState<StatusApl | null>(null);
  const [memuat, setMemuat] = useState(true);

  const segarkan = useCallback(async (): Promise<DataSesi | null> => {
    try {
      const [s, st] = await Promise.all([ambil<DataSesi>('/auth/saya'), ambil<StatusApl>('/status')]);
      setSesi(s);
      setStatus(st);
      return s;
    } catch {
      const kosong: DataSesi = { masuk: false, peran: 'tamu', level: 0 };
      setSesi(kosong);
      return kosong;
    } finally {
      setMemuat(false);
    }
  }, []);

  const keluar = useCallback(async () => {
    try {
      await kirim('/auth/keluar');
    } finally {
      setSesi({ masuk: false, peran: 'tamu', level: 0 });
    }
  }, []);

  useEffect(() => {
    segarkan();
  }, [segarkan]);

  const nilai = useMemo(() => ({ sesi, status, memuat, segarkan, keluar }), [sesi, status, memuat, segarkan, keluar]);
  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useSesi() {
  return useContext(Konteks);
}

/** Apakah fitur tertentu (1–10) bisa diakses siswa saat ini? */
export function fiturTerbuka(sesi: DataSesi | null, fitur: number): { boleh: boolean; alasan: string } {
  if (!sesi?.masuk || sesi.peran !== 'siswa') return { boleh: false, alasan: 'Masuk dulu dengan namamu.' };
  if (fitur <= 4) return { boleh: true, alasan: '' };
  if (sesi.level < 2) return { boleh: false, alasan: 'Butuh PIN kelompok dari gurumu.' };
  if (sesi.wajibLulusKuis && !sesi.kuis?.lulus)
    return { boleh: false, alasan: `Lulus kuis dulu (nilai minimal ${sesi.kuis?.ambangLulus ?? 70}).` };
  return { boleh: true, alasan: '' };
}
