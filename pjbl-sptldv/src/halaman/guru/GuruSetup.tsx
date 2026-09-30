import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ChefHat, Loader2 } from 'lucide-react';
import { kirim } from '../../lib/api';
import { useSesi } from '../../lib/sesi';
import { Pesan } from '../../komponen/UI';

export default function GuruSetup() {
  const { status, segarkan, memuat } = useSesi();
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [sandi, setSandi] = useState('');
  const [ulangi, setUlangi] = useState('');
  const [galat, setGalat] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const navigate = useNavigate();

  if (!memuat && status?.guruTerdaftar) return <Navigate to="/guru/masuk" replace />;

  const daftar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalat('');
    if (nama.trim().length < 3) return setGalat('Nama guru minimal 3 huruf.');
    if (sandi.length < 6) return setGalat('Kata sandi minimal 6 karakter.');
    if (sandi !== ulangi) return setGalat('Konfirmasi kata sandi belum sama.');
    setMengirim(true);
    try {
      await kirim('/auth/guru/setup', { nama, sandi, kelas });
      const ss = await segarkan();
      if (ss?.peran !== 'guru') {
        setGalat(
          'Akun guru berhasil dibuat, tetapi sesi tidak tersimpan karena peramban memblokir cookie. ' +
            'Buka aplikasi di tab baru lalu masuk lewat halaman Masuk Guru.',
        );
        return;
      }
      navigate('/guru/kelompok');
    } catch (err: any) {
      setGalat(err.message || 'Gagal membuat akun guru.');
    } finally {
      setMengirim(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-oranye-50 to-kuning-50 p-4">
      <div className="w-full max-w-md">
        <div className="kartu p-6 animate-fade-up sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-oranye-100">
              <ChefHat className="h-8 w-8 text-oranye-600" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-oranye-800">Pendaftaran Akun Guru</h1>
            <p className="mt-1 text-sm text-oranye-600">
              Pengaturan awal — hanya dilakukan sekali. Akun ini dipakai untuk memantau seluruh kelompok.
            </p>
          </div>

          <form onSubmit={daftar} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="nama">
                Nama Guru
              </label>
              <input id="nama" className="isian" placeholder="Contoh: Ratna Kusuma, S.Pd." value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="kelas">
                Kelas yang diampu
              </label>
              <input id="kelas" className="isian" placeholder="Contoh: XI Tata Boga 1" value={kelas} onChange={(e) => setKelas(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="sandi">
                Kata Sandi
              </label>
              <input
                id="sandi"
                type="password"
                className="isian"
                placeholder="Minimal 6 karakter"
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label" htmlFor="ulangi">
                Ulangi Kata Sandi
              </label>
              <input
                id="ulangi"
                type="password"
                className="isian"
                value={ulangi}
                onChange={(e) => setUlangi(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {galat && <Pesan jenis="galat">{galat}</Pesan>}

            <button type="submit" disabled={mengirim} className="tombol-utama w-full text-lg">
              {mengirim ? <Loader2 className="h-5 w-5 animate-spin" /> : '✅'} Buat Akun Guru
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-oranye-500">
          Sudah punya akun?{' '}
          <Link to="/guru/masuk" className="font-bold underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
