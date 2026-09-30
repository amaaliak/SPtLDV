import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, ChefHat, GraduationCap, Lock, Sparkles } from 'lucide-react';
import { useSesi } from '../lib/sesi';
import { FITUR } from '../lib/fitur';

export default function Landing() {
  const { sesi, status, memuat } = useSesi();

  if (!memuat && sesi?.masuk && sesi.peran === 'siswa') return <Navigate to="/beranda" replace />;
  if (!memuat && sesi?.masuk && sesi.peran === 'guru') return <Navigate to="/guru/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-oranye-50 via-krem to-kuning-50">
      {/* ------------------------------ Hero ------------------------------ */}
      <header className="mx-auto max-w-5xl px-4 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-oranye-500 text-2xl shadow-lembut">🧁</div>
            <div>
              <p className="text-sm font-extrabold leading-tight text-oranye-800">PjBL SPtLDV</p>
              <p className="text-xs text-oranye-500">SMK Tata Boga</p>
            </div>
          </div>
          <Link to="/guru/masuk" className="tombol-kedua px-3 py-2 text-sm">
            <GraduationCap className="h-4 w-4" /> Guru
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <section className="text-center">
          <span className="lencana bg-kuning-100 text-kuning-700">
            <Sparkles className="h-3.5 w-3.5" /> Pembelajaran Berbasis Proyek
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-oranye-800 sm:text-5xl">
            Sistem Pertidaksamaan Linear Dua Variabel
            <span className="block text-oranye-500">untuk Dapur Kantin Sekolah 🍳</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-oranye-700 sm:text-lg">
            {status?.pengaturan.nama_proyek ??
              'Kantin Tata Boga bisa membuat 2 jenis kue. Tapi bahan baku terbatas dan waktu produksi terbatas. Kombinasi mana yang paling menguntungkan?'}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/masuk" className="tombol-utama w-full px-6 text-lg sm:w-auto">
              👩‍🍳 Masuk sebagai Siswa <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to={status?.guruTerdaftar ? '/guru/masuk' : '/admin/setup'} className="tombol-kedua w-full px-6 sm:w-auto">
              <ChefHat className="h-5 w-5" />
              {status?.guruTerdaftar ? 'Masuk sebagai Guru' : 'Daftarkan Akun Guru'}
            </Link>
          </div>
          <p className="mt-3 text-xs font-semibold text-oranye-500">
            Siswa cukup memasukkan NAMA LENGKAP — tanpa kata sandi 🔓
          </p>
        </section>

        {/* --------------------------- Alur belajar ------------------------ */}
        <section className="mt-14">
          <h2 className="text-center text-xl font-extrabold text-oranye-800">Alur Belajar 10 Langkah</h2>
          <p className="mt-1 text-center text-sm text-oranye-600">
            Langkah 1–4 terbuka untuk semua siswa. Langkah 5–10 terbuka setelah kamu punya PIN kelompok.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FITUR.map((f) => (
              <div key={f.no} className="kartu p-4 transition hover:-translate-y-0.5 hover:shadow-lembut">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-oranye-50 text-xl">{f.emoji}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-oranye-400">LANGKAH {f.no}</p>
                      {f.tahap === 'Proyek' && <Lock className="h-3 w-3 text-kuning-600" />}
                    </div>
                    <h3 className="truncate font-bold text-oranye-800">{f.nama}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-oranye-600">{f.ringkas}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------- Keunggulan ------------------------- */}
        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              emoji: '📈',
              judul: 'Grafik Buatan Sendiri',
              teks: 'Bidang koordinat interaktif dibuat khusus dengan SVG — geser slider, daerah penyelesaian ikut bergerak.',
            },
            {
              emoji: '💡',
              judul: 'Petunjuk, Bukan Jawaban',
              teks: 'Sistem feedback hanya memberi petunjuk supaya kamu menemukan sendiri model matematikanya.',
            },
            {
              emoji: '🍰',
              judul: 'Konteks Tata Boga',
              teks: 'Semua contoh memakai bahan, waktu produksi, dan keuntungan produk kuliner — bukan x dan y abstrak.',
            },
          ].map((k) => (
            <div key={k.judul} className="kartu p-5">
              <div className="text-3xl">{k.emoji}</div>
              <h3 className="mt-2 font-bold text-oranye-800">{k.judul}</h3>
              <p className="mt-1 text-sm text-oranye-600">{k.teks}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 text-center text-xs text-oranye-500">
          <p>Proyek {status?.hari.totalHari ?? 10} hari · Kelas {status?.kelas ?? 'XI SMK Tata Boga'}</p>
          <p className="mt-1">Dibangun dengan React, Cloudflare Workers, D1, dan R2.</p>
        </footer>
      </main>
    </div>
  );
}
