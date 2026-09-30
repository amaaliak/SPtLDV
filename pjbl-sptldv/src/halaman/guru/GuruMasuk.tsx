import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, Loader2 } from 'lucide-react';
import { kirim } from '../../lib/api';
import { useSesi } from '../../lib/sesi';
import { Pesan } from '../../komponen/UI';

export default function GuruMasuk() {
  const { sesi, status, segarkan, memuat } = useSesi();
  const [sandi, setSandi] = useState('');
  const [galat, setGalat] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const navigate = useNavigate();

  if (!memuat && sesi?.peran === 'guru') return <Navigate to="/guru/dashboard" replace />;
  if (!memuat && status && !status.guruTerdaftar) return <Navigate to="/admin/setup" replace />;

  const masuk = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalat('');
    setMengirim(true);
    try {
      await kirim('/auth/guru/masuk', { sandi });
      const ss = await segarkan();
      if (ss?.peran !== 'guru') {
        setGalat('Kata sandi benar, tetapi sesi tidak tersimpan karena peramban memblokir cookie. Coba buka aplikasi ini di tab baru (bukan di dalam kotak pratinjau), lalu masuk lagi.');
        return;
      }
      navigate('/guru/dashboard');
    } catch (err: any) {
      setGalat(err.message || 'Gagal masuk.');
    } finally {
      setMengirim(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-oranye-50 to-kuning-50 p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-oranye-600">
          <ArrowLeft className="h-4 w-4" /> Halaman utama
        </Link>
        <div className="kartu p-6 animate-fade-up sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-oranye-100">
              <ChefHat className="h-8 w-8 text-oranye-600" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-oranye-800">Masuk Guru</h1>
            <p className="mt-1 text-sm text-oranye-600">
              {status?.namaGuru ? `Halo, ${status.namaGuru}!` : 'Masukkan kata sandi guru.'}
            </p>
          </div>

          <form onSubmit={masuk} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="sandi">
                Kata Sandi
              </label>
              <input
                id="sandi"
                type="password"
                className="isian text-lg"
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />
            </div>
            {galat && <Pesan jenis="galat">{galat}</Pesan>}
            <button type="submit" disabled={mengirim} className="tombol-utama w-full text-lg">
              {mengirim ? <Loader2 className="h-5 w-5 animate-spin" /> : '🔐'} Masuk
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-oranye-500">
          Siswa?{' '}
          <Link to="/masuk" className="font-bold underline">
            Masuk dengan nama di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
