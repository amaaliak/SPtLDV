import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChefHat,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Settings,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { FITUR_SISWA } from '../lib/fitur';
import { fiturTerbuka, useSesi } from '../lib/sesi';
import { BilahLangkah } from './UI';

/* ======================= TATA LETAK HALAMAN SISWA ======================= */

export function TataSiswa({
  langkah,
  judul,
  emoji,
  children,
  lebar = 'sedang',
}: {
  langkah?: number;
  judul: string;
  emoji?: string;
  children: ReactNode;
  lebar?: 'sedang' | 'lebar';
}) {
  const { sesi, status, keluar } = useSesi();
  const [menuBuka, setMenuBuka] = useState(false);
  const navigate = useNavigate();

  const keluarSekarang = async () => {
    await keluar();
    navigate('/');
  };

  const daftarNav = (
    <nav className="space-y-1">
      <NavLink
        to="/beranda"
        onClick={() => setMenuBuka(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            isActive ? 'bg-oranye-500 text-white shadow-lembut' : 'text-oranye-800 hover:bg-oranye-50'
          }`
        }
      >
        <Home className="h-5 w-5" /> Beranda
      </NavLink>
      {FITUR_SISWA.map((f) => {
        const kunci = !fiturTerbuka(sesi, f.no).boleh;
        return (
          <NavLink
            key={f.no}
            to={f.jalur}
            onClick={() => setMenuBuka(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-oranye-500 text-white shadow-lembut' : 'text-oranye-800 hover:bg-oranye-50'
              } ${kunci ? 'opacity-60' : ''}`
            }
          >
            <span className="w-5 text-center">{f.emoji}</span>
            <span className="flex-1 truncate">
              {f.no}. {f.nama}
            </span>
            {kunci ? <Lock className="h-3.5 w-3.5" /> : null}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-krem">
      {/* ---------------------- Sidebar (desktop) ---------------------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-oranye-100 bg-white p-4 lg:flex">
        <Link to="/beranda" className="mb-5 flex items-center gap-2 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-oranye-500 text-xl">🧁</div>
          <div>
            <p className="text-sm font-extrabold leading-tight text-oranye-800">PjBL SPtLDV</p>
            <p className="text-xs text-oranye-500">Tata Boga</p>
          </div>
        </Link>
        <div className="flex-1 overflow-y-auto">{daftarNav}</div>
        <div className="mt-4 rounded-xl bg-oranye-50 p-3">
          <p className="truncate text-sm font-bold text-oranye-800">{sesi?.siswa?.nama ?? 'Siswa'}</p>
          <p className="text-xs text-oranye-600">
            {sesi?.kelompok?.name ?? 'Belum punya kelompok'} · Hari ke-{status?.hari.hariKe ?? 1}
          </p>
          <button onClick={keluarSekarang} className="tombol-kedua mt-2 w-full py-2 text-sm">
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* ------------------------ Bilah atas --------------------------- */}
      <header className="sticky top-0 z-20 border-b border-oranye-100 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/beranda" className="flex items-center gap-2">
            <span className="text-2xl">🧁</span>
            <span className="text-sm font-extrabold text-oranye-800">PjBL SPtLDV</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/beranda" className="relative rounded-full p-2 text-oranye-600 hover:bg-oranye-50" aria-label="Notifikasi">
              <Bell className="h-5 w-5" />
              {!!sesi?.notifikasiBaru && (
                <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {sesi.notifikasiBaru}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMenuBuka(true)}
              className="rounded-full p-2 text-oranye-600 hover:bg-oranye-50"
              aria-label="Buka menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ----------------------- Menu (ponsel) ------------------------- */}
      {menuBuka && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuBuka(false)}>
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-extrabold text-oranye-800">Menu Belajar</p>
              <button onClick={() => setMenuBuka(false)} className="rounded-full p-2 hover:bg-oranye-50" aria-label="Tutup menu">
                <X className="h-5 w-5 text-oranye-600" />
              </button>
            </div>
            {daftarNav}
            <div className="mt-4 rounded-xl bg-oranye-50 p-3">
              <p className="truncate text-sm font-bold text-oranye-800">{sesi?.siswa?.nama ?? 'Siswa'}</p>
              <p className="text-xs text-oranye-600">{sesi?.kelompok?.name ?? 'Belum punya kelompok'}</p>
              <button onClick={keluarSekarang} className="tombol-kedua mt-2 w-full py-2 text-sm">
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------- Konten --------------------------- */}
      <main className="lg:pl-72">
        <div className={`mx-auto px-4 pb-28 pt-5 lg:pb-12 ${lebar === 'lebar' ? 'max-w-6xl' : 'max-w-3xl'}`}>
          {langkah ? <BilahLangkah langkah={langkah} /> : null}
          <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-oranye-800 sm:text-2xl">
            {emoji && <span>{emoji}</span>} {judul}
          </h1>
          {children}
        </div>
      </main>

      {/* ----------------------- Navigasi bawah ------------------------ */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-oranye-100 bg-white aman-bawah lg:hidden">
        <div className="grid grid-cols-5">
          {[
            { ke: '/beranda', label: 'Beranda', emoji: '🏠' },
            { ke: '/fitur/2', label: 'Materi', emoji: '📚' },
            { ke: '/fitur/3', label: 'Grafik', emoji: '📈' },
            { ke: '/fitur/7', label: 'Jurnal', emoji: '🗓️' },
            { ke: '/fitur/6', label: 'Model', emoji: '🧮' },
          ].map((n) => (
            <NavLink
              key={n.ke}
              to={n.ke}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                  isActive ? 'text-oranye-600' : 'text-oranye-400'
                }`
              }
            >
              <span className="text-lg">{n.emoji}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ======================== TATA LETAK HALAMAN GURU ======================= */

export function TataGuru({ judul, emoji, children }: { judul: string; emoji?: string; children: ReactNode }) {
  const { sesi, status, keluar } = useSesi();
  const [buka, setBuka] = useState(false);
  const navigate = useNavigate();

  const menu = [
    { ke: '/guru/dashboard', label: 'Dashboard', ikon: LayoutDashboard },
    { ke: '/guru/siswa', label: 'Data Siswa', ikon: Users },
    { ke: '/guru/kelompok', label: 'Kelompok & PIN', ikon: UsersRound },
    { ke: '/guru/pengaturan', label: 'Pengaturan', ikon: Settings },
  ];

  const isiNav = (
    <nav className="space-y-1">
      {menu.map((m) => (
        <NavLink
          key={m.ke}
          to={m.ke}
          onClick={() => setBuka(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive ? 'bg-oranye-500 text-white shadow-lembut' : 'text-oranye-800 hover:bg-oranye-50'
            }`
          }
        >
          <m.ikon className="h-5 w-5" /> {m.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-krem">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-oranye-100 bg-white p-4 lg:flex">
        <div className="mb-5 flex items-center gap-2 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-oranye-500 text-white">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight text-oranye-800">Panel Guru</p>
            <p className="text-xs text-oranye-500">{status?.kelas ?? 'SMK Tata Boga'}</p>
          </div>
        </div>
        <div className="flex-1">{isiNav}</div>
        <div className="rounded-xl bg-oranye-50 p-3">
          <p className="truncate text-sm font-bold text-oranye-800">{sesi?.guru?.name ?? 'Guru'}</p>
          <button
            onClick={async () => {
              await keluar();
              navigate('/');
            }}
            className="tombol-kedua mt-2 w-full py-2 text-sm"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-oranye-100 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-extrabold text-oranye-800">
            <ChefHat className="h-5 w-5 text-oranye-500" /> Panel Guru
          </span>
          <button onClick={() => setBuka(!buka)} className="rounded-full p-2 text-oranye-600 hover:bg-oranye-50" aria-label="Menu">
            {buka ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {buka && <div className="border-t border-oranye-100 p-3">{isiNav}</div>}
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-5">
          <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-oranye-800 sm:text-2xl">
            {emoji && <span>{emoji}</span>} {judul}
          </h1>
          {children}
        </div>
      </main>
    </div>
  );
}
