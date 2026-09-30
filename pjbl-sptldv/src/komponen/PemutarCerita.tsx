import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward, Volume2 } from 'lucide-react';

/**
 * Pemutar "video" cerita masalah — dibangun sendiri (SVG + animasi CSS),
 * sehingga tetap berjalan tanpa koneksi ke layanan video pihak ketiga.
 * Jika guru mengisi URL video di Pengaturan, pemutar video asli dipakai.
 */

export interface Adegan {
  durasi: number; // detik
  judul: string;
  narasi: string;
  emoji: string;
  gambar?: string;
  warna: string;
}

export const ADEGAN: Adegan[] = [
  {
    durasi: 25,
    judul: 'Selamat datang di Kantin Tata Boga',
    narasi:
      'Setiap pagi, dapur kantin SMK kita sibuk sejak pukul 06.00. Para siswa jurusan Tata Boga memproduksi kue untuk dijual saat istirahat.',
    emoji: '🏫',
    gambar: '/gambar/adegan-1.png',
    warna: '#FFEDD5',
  },
  {
    durasi: 25,
    judul: 'Dua produk andalan',
    narasi:
      'Kantin punya dua produk favorit: Kue Lapis dan Risoles. Keduanya laris, tetapi keuntungan per porsinya berbeda.',
    emoji: '🍰',
    gambar: '/gambar/adegan-2.png',
    warna: '#FEF9C3',
  },
  {
    durasi: 25,
    judul: 'Masalah pertama: bahan baku terbatas',
    narasi:
      'Stok tepung hanya 6.000 gram dan telur 40 butir per hari. Satu Kue Lapis butuh 200 gram tepung dan 1 telur, satu Risoles butuh 150 gram tepung dan 2 telur.',
    emoji: '🥣',
    gambar: '/gambar/adegan-3.png',
    warna: '#FFEDD5',
  },
  {
    durasi: 25,
    judul: 'Masalah kedua: waktu produksi terbatas',
    narasi:
      'Dapur hanya beroperasi 450 menit. Satu Kue Lapis perlu 30 menit karena harus dikukus berlapis, sedangkan satu Risoles cukup 10 menit. Waktu pun harus dibagi dengan cermat.',
    emoji: '⏰',
    gambar: '/gambar/adegan-4.png',
    warna: '#FEF9C3',
  },
  {
    durasi: 25,
    judul: 'Pertanyaan besar hari ini',
    narasi:
      'Berapa banyak Kue Lapis dan Risoles yang harus dibuat agar keuntungan kantin PALING BESAR, tanpa melanggar batas bahan dan waktu?',
    emoji: '🤔',
    gambar: '/gambar/adegan-5.png',
    warna: '#FFEDD5',
  },
  {
    durasi: 25,
    judul: 'Tugasmu: jadi konsultan dapur!',
    narasi:
      'Bersama kelompokmu, wawancarai pengelola kantin, susun model matematikanya dengan pertidaksamaan linear, lalu temukan kombinasi produksi paling menguntungkan.',
    emoji: '👩‍🍳',
    gambar: '/gambar/adegan-6.png',
    warna: '#DCFCE7',
  },
];

const TOTAL = ADEGAN.reduce((t, a) => t + a.durasi, 0);

function jamTeks(detik: number) {
  const m = Math.floor(detik / 60);
  const s = Math.floor(detik % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PemutarCerita({ onSelesai }: { onSelesai?: () => void }) {
  const [waktu, setWaktu] = useState(0);
  const [main, setMain] = useState(false);
  const [gambarGagal, setGambarGagal] = useState<Record<number, boolean>>({});
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!main) return;
    timer.current = window.setInterval(() => {
      setWaktu((w) => {
        if (w + 0.1 >= TOTAL) {
          setMain(false);
          onSelesai?.();
          return TOTAL;
        }
        return w + 0.1;
      });
    }, 100);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [main, onSelesai]);

  let lewat = 0;
  let indeks = 0;
  for (let i = 0; i < ADEGAN.length; i++) {
    if (waktu >= lewat + ADEGAN[i].durasi) {
      lewat += ADEGAN[i].durasi;
      indeks = Math.min(i + 1, ADEGAN.length - 1);
    } else {
      indeks = i;
      break;
    }
  }
  const adegan = ADEGAN[indeks];
  const majuAdegan = Math.min(1, (waktu - lewat) / adegan.durasi);

  const lompat = () => {
    const berikut = lewat + adegan.durasi;
    setWaktu(Math.min(berikut, TOTAL));
  };

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-oranye-200 bg-white shadow-kartu">
      {/* ------------------------------ Layar ----------------------------- */}
      <div className="relative aspect-video w-full overflow-hidden" style={{ background: adegan.warna }}>
        {adegan.gambar && !gambarGagal[indeks] ? (
          <img
            key={indeks}
            src={adegan.gambar}
            alt={adegan.judul}
            onError={() => setGambarGagal((g) => ({ ...g, [indeks]: true }))}
            className="h-full w-full object-cover animate-fade-up"
          />
        ) : (
          <div key={indeks} className="grid h-full w-full place-items-center animate-pop">
            <span style={{ fontSize: 'clamp(64px, 18vw, 140px)' }}>{adegan.emoji}</span>
          </div>
        )}

        {/* Teks judul + narasi */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent p-4 pt-12 text-white sm:p-5 sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-wide text-kuning-300">
            Adegan {indeks + 1} dari {ADEGAN.length}
          </p>
          <h3 className="mt-0.5 text-base font-extrabold leading-tight sm:text-xl">{adegan.judul}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/90 sm:text-sm">{adegan.narasi}</p>
        </div>

        {!main && waktu === 0 && (
          <button
            onClick={() => setMain(true)}
            className="absolute inset-0 grid place-items-center bg-black/30 transition hover:bg-black/40"
            aria-label="Putar cerita"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/95 shadow-xl">
              <Play className="ml-1 h-9 w-9 fill-oranye-500 text-oranye-500" />
            </span>
          </button>
        )}

        {waktu >= TOTAL && (
          <div className="absolute inset-0 grid place-items-center bg-black/55 text-center text-white">
            <div>
              <p className="text-4xl">🎬</p>
              <p className="mt-2 text-lg font-extrabold">Cerita selesai!</p>
              <p className="text-sm text-white/80">Sekarang pelajari data dapurnya di bawah ini.</p>
              <button
                onClick={() => {
                  setWaktu(0);
                  setMain(true);
                }}
                className="tombol-kedua mx-auto mt-4"
              >
                <RotateCcw className="h-4 w-4" /> Putar Ulang
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------- Kendali ----------------------------- */}
      <div className="px-4 py-3">
        <div className="flex h-2 w-full gap-1">
          {ADEGAN.map((a, i) => (
            <div key={i} className="h-full flex-1 overflow-hidden rounded-full bg-oranye-100" style={{ flexGrow: a.durasi }}>
              <div
                className="h-full rounded-full bg-oranye-500 transition-all"
                style={{ width: i < indeks ? '100%' : i === indeks ? `${majuAdegan * 100}%` : '0%' }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => setMain((m) => !m)}
            className="grid h-10 w-10 place-items-center rounded-full bg-oranye-500 text-white"
            aria-label={main ? 'Jeda' : 'Putar'}
          >
            {main ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
          <button
            onClick={lompat}
            className="grid h-10 w-10 place-items-center rounded-full bg-oranye-100 text-oranye-700"
            aria-label="Adegan berikutnya"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setWaktu(0);
              setMain(false);
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-oranye-100 text-oranye-700"
            aria-label="Ulang dari awal"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <span className="ml-1 text-xs font-bold tabular-nums text-oranye-700">
            {jamTeks(waktu)} / {jamTeks(TOTAL)}
          </span>
          <span className="ml-auto hidden items-center gap-1 text-xs text-oranye-500 sm:flex">
            <Volume2 className="h-3.5 w-3.5" /> Cerita bergambar (tanpa suara)
          </span>
        </div>
      </div>
    </div>
  );
}
