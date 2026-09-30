import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, Lock, RefreshCw, Star, XCircle } from 'lucide-react';

/* ------------------------------- Memuat --------------------------------- */

export function Muat({ teks = 'Memuat…' }: { teks?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-oranye-600">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm font-medium">{teks}</p>
    </div>
  );
}

/* -------------------------------- Galat --------------------------------- */

export function Galat({ pesan, onCoba }: { pesan: string; onCoba?: () => void }) {
  return (
    <div className="kartu border-red-200 bg-red-50 p-5 text-center animate-fade-up">
      <XCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p className="font-semibold text-red-700">{pesan}</p>
      {onCoba && (
        <button onClick={onCoba} className="tombol-kedua mt-4 mx-auto">
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </button>
      )}
    </div>
  );
}

/* ------------------------------- Pesan ---------------------------------- */

type JenisPesan = 'sukses' | 'galat' | 'info' | 'peringatan';

const gaya: Record<JenisPesan, string> = {
  sukses: 'bg-hijau-50 border-hijau-200 text-hijau-700',
  galat: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-oranye-50 border-oranye-200 text-oranye-800',
  peringatan: 'bg-kuning-50 border-kuning-300 text-kuning-700',
};

const ikonPesan: Record<JenisPesan, ReactNode> = {
  sukses: <CheckCircle2 className="h-5 w-5 shrink-0" />,
  galat: <XCircle className="h-5 w-5 shrink-0" />,
  info: <Info className="h-5 w-5 shrink-0" />,
  peringatan: <AlertTriangle className="h-5 w-5 shrink-0" />,
};

export function Pesan({ jenis = 'info', children }: { jenis?: JenisPesan; children: ReactNode }) {
  return (
    <div className={`flex items-start gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium ${gaya[jenis]} animate-fade-up`}>
      {ikonPesan[jenis]}
      <div className="flex-1">{children}</div>
    </div>
  );
}

/* ------------------------------ Lencana --------------------------------- */

export function Lencana({
  warna = 'oranye',
  children,
}: {
  warna?: 'hijau' | 'kuning' | 'merah' | 'oranye' | 'abu';
  children: ReactNode;
}) {
  const kelas = {
    hijau: 'bg-hijau-100 text-hijau-700',
    kuning: 'bg-kuning-100 text-kuning-700',
    merah: 'bg-red-100 text-red-700',
    oranye: 'bg-oranye-100 text-oranye-700',
    abu: 'bg-gray-100 text-gray-600',
  }[warna];
  return <span className={`lencana ${kelas}`}>{children}</span>;
}

/* --------------------------- Bilah kemajuan ----------------------------- */

export function BilahLangkah({ langkah, total = 10 }: { langkah: number; total?: number }) {
  const persen = Math.round((langkah / total) * 100);
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-oranye-700">
        <span>
          Langkah {langkah} dari {total}
        </span>
        <span>{persen}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-oranye-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-kuning-400 to-oranye-500 transition-all duration-500"
          style={{ width: `${persen}%` }}
        />
      </div>
    </div>
  );
}

export function BilahPersen({ persen, warna = 'bg-hijau-500' }: { persen: number; warna?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-oranye-100">
      <div className={`h-full rounded-full ${warna} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, persen))}%` }} />
    </div>
  );
}

/* ------------------------------- Kosong --------------------------------- */

export function Kosong({ emoji = '🍽️', judul, teks }: { emoji?: string; judul: string; teks?: string }) {
  return (
    <div className="kartu p-8 text-center">
      <div className="mb-2 text-4xl">{emoji}</div>
      <h3 className="font-bold text-oranye-800">{judul}</h3>
      {teks && <p className="mt-1 text-sm text-oranye-600">{teks}</p>}
    </div>
  );
}

/* ------------------------------- Terkunci ------------------------------- */

export function Terkunci({ judul, alasan, aksi }: { judul: string; alasan: string; aksi?: ReactNode }) {
  return (
    <div className="kartu border-kuning-300 bg-kuning-50 p-8 text-center animate-pop">
      <Lock className="mx-auto mb-3 h-10 w-10 text-kuning-600" />
      <h3 className="text-lg font-bold text-kuning-700">{judul}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-kuning-700">{alasan}</p>
      {aksi && <div className="mt-5 flex flex-wrap justify-center gap-3">{aksi}</div>}
    </div>
  );
}

/* ------------------------------- Bintang -------------------------------- */

export function Bintang({
  nilai,
  onPilih,
  ukuran = 36,
}: {
  nilai: number;
  onPilih?: (n: number) => void;
  ukuran?: number;
}) {
  const label = ['Masih bingung', 'Sedikit paham', 'Cukup paham', 'Paham', 'Sangat paham'];
  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPilih?.(n)}
            disabled={!onPilih}
            aria-label={`${n} bintang — ${label[n - 1]}`}
            className="transition hover:scale-110 disabled:hover:scale-100"
          >
            <Star
              style={{ width: ukuran, height: ukuran }}
              className={n <= nilai ? 'fill-kuning-400 text-kuning-500' : 'text-oranye-200'}
            />
          </button>
        ))}
      </div>
      {nilai > 0 && <p className="mt-1.5 text-sm font-semibold text-oranye-700">{label[nilai - 1]}</p>}
    </div>
  );
}

/* ------------------------------- Dialog --------------------------------- */

export function Dialog({
  buka,
  judul,
  children,
  onTutup,
}: {
  buka: boolean;
  judul: string;
  children: ReactNode;
  onTutup: () => void;
}) {
  if (!buka) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onTutup}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-oranye-800">{judul}</h3>
          <button onClick={onTutup} className="rounded-full p-2 text-oranye-500 hover:bg-oranye-50" aria-label="Tutup">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
