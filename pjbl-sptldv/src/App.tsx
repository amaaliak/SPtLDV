import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { fiturTerbuka, useSesi } from './lib/sesi';
import { TataSiswa } from './komponen/Tata';
import { Terkunci } from './komponen/UI';

import Landing from './halaman/Landing';
import Masuk from './halaman/Masuk';
import Pin from './halaman/Pin';
import Dasbor from './halaman/Dasbor';
import Fitur1 from './halaman/Fitur1';
import Fitur2 from './halaman/Fitur2';
import Fitur3 from './halaman/Fitur3';
import Fitur4 from './halaman/Fitur4';
import Fitur5 from './halaman/Fitur5';
import Fitur6 from './halaman/Fitur6';
import Fitur7 from './halaman/Fitur7';
import Fitur9 from './halaman/Fitur9';
import Fitur10 from './halaman/Fitur10';
import GuruMasuk from './halaman/guru/GuruMasuk';
import GuruSetup from './halaman/guru/GuruSetup';
import GuruDasbor from './halaman/guru/GuruDasbor';
import GuruSiswa from './halaman/guru/GuruSiswa';
import GuruKelompok from './halaman/guru/GuruKelompok';
import GuruPengaturan from './halaman/guru/GuruPengaturan';

function PemuatLayar() {
  return (
    <div className="grid min-h-screen place-items-center bg-krem">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-oranye-500" />
        <p className="mt-3 text-sm font-semibold text-oranye-700">Menyiapkan dapur belajar…</p>
      </div>
    </div>
  );
}

function ButuhSiswa({ children, fitur }: { children: ReactNode; fitur?: number }) {
  const { sesi, memuat } = useSesi();
  const navigate = useNavigate();
  const lokasi = useLocation();

  if (memuat) return <PemuatLayar />;
  if (!sesi?.masuk || sesi.peran !== 'siswa') return <Navigate to="/masuk" replace state={{ dari: lokasi.pathname }} />;

  if (fitur) {
    const { boleh, alasan } = fiturTerbuka(sesi, fitur);
    if (!boleh) {
      const butuhPin = sesi.level < 2;
      return (
        <TataSiswa judul={`Fitur ${fitur} masih terkunci`} emoji="🔒">
          <Terkunci
            judul={butuhPin ? 'Butuh PIN Kelompok' : 'Selesaikan Kuis Dulu'}
            alasan={
              butuhPin
                ? `${alasan} Fitur proyek (5–10) baru terbuka setelah kamu memasukkan PIN kelompok dari gurumu.`
                : alasan
            }
            aksi={
              <>
                {butuhPin ? (
                  <button onClick={() => navigate('/pin')} className="tombol-utama">
                    🔑 Masukkan PIN Kelompok
                  </button>
                ) : (
                  <button onClick={() => navigate('/fitur/4')} className="tombol-utama">
                    📝 Kerjakan Kuis
                  </button>
                )}
                <button onClick={() => navigate('/beranda')} className="tombol-kedua">
                  🏠 Kembali ke Beranda
                </button>
              </>
            }
          />
        </TataSiswa>
      );
    }
  }
  return <>{children}</>;
}

function ButuhGuru({ children }: { children: ReactNode }) {
  const { sesi, memuat } = useSesi();
  if (memuat) return <PemuatLayar />;
  if (!sesi?.masuk || sesi.peran !== 'guru') return <Navigate to="/guru/masuk" replace />;
  return <>{children}</>;
}

function TidakDitemukan() {
  return (
    <div className="grid min-h-screen place-items-center bg-krem p-6 text-center">
      <div>
        <p className="text-6xl">🍽️</p>
        <h1 className="mt-4 text-2xl font-extrabold text-oranye-800">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-oranye-600">Sepertinya menu yang kamu cari tidak ada di daftar.</p>
        <a href="/" className="tombol-utama mt-6 inline-flex">
          🏠 Kembali ke Halaman Utama
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/masuk" element={<Masuk />} />
      <Route path="/pin" element={<Pin />} />

      <Route
        path="/beranda"
        element={
          <ButuhSiswa>
            <Dasbor />
          </ButuhSiswa>
        }
      />

      <Route path="/fitur/1" element={<ButuhSiswa fitur={1}><Fitur1 /></ButuhSiswa>} />
      <Route path="/fitur/2" element={<ButuhSiswa fitur={2}><Fitur2 /></ButuhSiswa>} />
      <Route path="/fitur/3" element={<ButuhSiswa fitur={3}><Fitur3 /></ButuhSiswa>} />
      <Route path="/fitur/4" element={<ButuhSiswa fitur={4}><Fitur4 /></ButuhSiswa>} />
      <Route path="/fitur/5" element={<ButuhSiswa fitur={5}><Fitur5 /></ButuhSiswa>} />
      <Route path="/fitur/6" element={<ButuhSiswa fitur={6}><Fitur6 /></ButuhSiswa>} />
      <Route path="/fitur/7" element={<ButuhSiswa fitur={7}><Fitur7 /></ButuhSiswa>} />
      <Route path="/fitur/8" element={<Navigate to="/guru/dashboard" replace />} />
      <Route path="/fitur/9" element={<ButuhSiswa fitur={9}><Fitur9 /></ButuhSiswa>} />
      <Route path="/fitur/10" element={<ButuhSiswa fitur={10}><Fitur10 /></ButuhSiswa>} />

      {/* ------------------------------ Guru ------------------------------ */}
      <Route path="/guru/masuk" element={<GuruMasuk />} />
      <Route path="/guru/setup" element={<GuruSetup />} />
      <Route path="/admin/setup" element={<GuruSetup />} />
      <Route path="/guru/dashboard" element={<ButuhGuru><GuruDasbor /></ButuhGuru>} />
      <Route path="/dashboard/guru" element={<Navigate to="/guru/dashboard" replace />} />
      <Route path="/guru/siswa" element={<ButuhGuru><GuruSiswa /></ButuhGuru>} />
      <Route path="/admin/siswa" element={<Navigate to="/guru/siswa" replace />} />
      <Route path="/guru/kelompok" element={<ButuhGuru><GuruKelompok /></ButuhGuru>} />
      <Route path="/admin/kelompok" element={<Navigate to="/guru/kelompok" replace />} />
      <Route path="/guru/pengaturan" element={<ButuhGuru><GuruPengaturan /></ButuhGuru>} />

      <Route path="*" element={<TidakDitemukan />} />
    </Routes>
  );
}
