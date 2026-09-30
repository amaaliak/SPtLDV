import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, UserRound } from 'lucide-react';
import { kirim, GalatApi } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { Pesan } from '../komponen/UI';

export default function Masuk() {
  const [nama, setNama] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState('');
  const { segarkan } = useSesi();
  const navigate = useNavigate();

  const kirimNama = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalat('');
    if (nama.trim().length < 3) {
      setGalat('Tulis nama lengkapmu minimal 3 huruf, ya.');
      return;
    }
    setMemuat(true);
    try {
      const r = await kirim('/auth/siswa/masuk', { nama });
      const s = await segarkan();
      if (!s?.masuk) {
        setGalat(
          'Kamu berhasil dikenali, tetapi sesi tidak tersimpan karena peramban memblokir cookie. Coba buka aplikasi ini di tab baru (bukan di dalam kotak pratinjau), lalu masuk lagi.',
        );
        return;
      }
      navigate('/pin', { state: { pesan: r.pesan, punyaKelompok: r.punyaKelompok } });
    } catch (err) {
      setGalat(err instanceof GalatApi ? err.message : 'Gagal masuk. Periksa koneksimu.');
    } finally {
      setMemuat(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-oranye-50 to-kuning-50 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-oranye-600">
          <ArrowLeft className="h-4 w-4" /> Halaman utama
        </Link>

        <div className="kartu p-6 animate-fade-up sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-oranye-100 text-3xl">👩‍🍳</div>
            <h1 className="mt-4 text-2xl font-extrabold text-oranye-800">Masuk Siswa</h1>
            <p className="mt-1 text-sm text-oranye-600">
              Langkah 1 dari 2 — cukup tulis nama lengkapmu. <strong>Tidak perlu kata sandi.</strong>
            </p>
          </div>

          <form onSubmit={kirimNama} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="nama">
                Nama Lengkap
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-oranye-400" />
                <input
                  id="nama"
                  className="isian pl-11 text-lg"
                  placeholder="Contoh: Andi Pratama Wijaya"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  autoComplete="name"
                  autoFocus
                  maxLength={60}
                />
              </div>
              <p className="mt-1.5 text-xs text-oranye-500">
                Gunakan nama asli sesuai absen agar gurumu dapat menemukanmu di daftar siswa.
              </p>
            </div>

            {galat && <Pesan jenis="galat">{galat}</Pesan>}

            <button type="submit" disabled={memuat} className="tombol-utama w-full text-lg">
              {memuat ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              {memuat ? 'Memproses…' : 'Masuk & Mulai Belajar'}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-oranye-50 p-3 text-xs text-oranye-700">
            <p className="font-bold">ℹ️ Setelah masuk:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Fitur 1–4 (video, materi, grafik, kuis) langsung terbuka.</li>
              <li>Fitur 5–10 (proyek kelompok) terbuka setelah kamu memasukkan PIN kelompok.</li>
            </ul>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-oranye-500">
          Guru?{' '}
          <Link to="/guru/masuk" className="font-bold underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
