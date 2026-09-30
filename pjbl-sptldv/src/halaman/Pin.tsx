import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { kirim, GalatApi } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { Pesan } from '../komponen/UI';

export default function Pin() {
  const [digit, setDigit] = useState(['', '', '', '']);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState('');
  const [sukses, setSukses] = useState('');
  const [belumKelompok, setBelumKelompok] = useState(false);
  const [terkunciSampai, setTerkunciSampai] = useState<number | null>(null);
  const [sisaDetik, setSisaDetik] = useState(0);
  const kotak = useRef<(HTMLInputElement | null)[]>([]);
  const { sesi, segarkan, memuat: memuatSesi } = useSesi();
  const navigate = useNavigate();
  const lokasi = useLocation() as { state?: { pesan?: string; punyaKelompok?: boolean } };

  useEffect(() => {
    if (!memuatSesi && (!sesi?.masuk || sesi.peran !== 'siswa')) navigate('/masuk', { replace: true });
    if (!memuatSesi && sesi?.level === 2) navigate('/beranda', { replace: true });
  }, [sesi, memuatSesi, navigate]);

  useEffect(() => {
    if (!terkunciSampai) return;
    const t = setInterval(() => {
      const sisa = Math.max(0, Math.ceil((terkunciSampai - Date.now()) / 1000));
      setSisaDetik(sisa);
      if (sisa === 0) {
        setTerkunciSampai(null);
        setGalat('');
      }
    }, 1000);
    return () => clearInterval(t);
  }, [terkunciSampai]);

  const ubah = (i: number, nilai: string) => {
    const bersih = nilai.replace(/\D/g, '');
    if (bersih.length > 1) {
      // tempel (paste) 4 angka sekaligus
      const baru = bersih.slice(0, 4).split('');
      setDigit([0, 1, 2, 3].map((n) => baru[n] ?? ''));
      kotak.current[Math.min(baru.length, 3)]?.focus();
      return;
    }
    const d = [...digit];
    d[i] = bersih;
    setDigit(d);
    if (bersih && i < 3) kotak.current[i + 1]?.focus();
  };

  const tekan = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digit[i] && i > 0) kotak.current[i - 1]?.focus();
  };

  const kirimPin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pin = digit.join('');
    setGalat('');
    setSukses('');
    if (pin.length !== 4) {
      setGalat('Masukkan 4 angka PIN dari gurumu.');
      return;
    }
    setMemuat(true);
    try {
      const r = await kirim('/auth/siswa/pin', { pin });
      setSukses(r.pesan);
      await segarkan();
      setTimeout(() => navigate('/beranda'), 900);
    } catch (err) {
      const g = err as GalatApi;
      setGalat(g.message);
      if (g.data?.belumPunyaKelompok) setBelumKelompok(true);
      if (g.data?.terkunci) setTerkunciSampai(Date.now() + (g.data.sisaMenit ?? 5) * 60_000);
      setDigit(['', '', '', '']);
      kotak.current[0]?.focus();
    } finally {
      setMemuat(false);
    }
  };

  const terkunci = !!terkunciSampai;

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-kuning-50 to-oranye-50 p-4">
      <div className="w-full max-w-md">
        <div className="kartu p-6 animate-fade-up sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-kuning-100">
              <KeyRound className="h-8 w-8 text-kuning-600" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-oranye-800">PIN Kelompok</h1>
            <p className="mt-1 text-sm text-oranye-600">
              Langkah 2 dari 2 — masukkan 4 angka PIN yang diberikan gurumu untuk membuka fitur proyek (5–10).
            </p>
          </div>

          {lokasi.state?.pesan && !sukses && (
            <div className="mt-4">
              <Pesan jenis="sukses">{lokasi.state.pesan}</Pesan>
            </div>
          )}

          <form onSubmit={kirimPin} className="mt-6">
            <div className="flex justify-center gap-3" dir="ltr">
              {digit.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (kotak.current[i] = el)}
                  value={d}
                  onChange={(e) => ubah(i, e.target.value)}
                  onKeyDown={(e) => tekan(i, e)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  disabled={terkunci || memuat}
                  aria-label={`Angka PIN ke-${i + 1}`}
                  className="h-16 w-14 rounded-2xl border-2 border-oranye-200 bg-white text-center text-3xl font-extrabold text-oranye-800 focus:border-oranye-500 disabled:bg-gray-100 sm:h-20 sm:w-16"
                />
              ))}
            </div>

            {terkunci && (
              <div className="mt-4">
                <Pesan jenis="peringatan">
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Terkunci sementara. Coba lagi dalam{' '}
                    <strong>
                      {Math.floor(sisaDetik / 60)}:{String(sisaDetik % 60).padStart(2, '0')}
                    </strong>
                  </span>
                </Pesan>
              </div>
            )}

            {galat && !terkunci && (
              <div className="mt-4">
                <Pesan jenis="galat">{galat}</Pesan>
              </div>
            )}
            {sukses && (
              <div className="mt-4">
                <Pesan jenis="sukses">{sukses}</Pesan>
              </div>
            )}

            {belumKelompok && (
              <div className="mt-4 rounded-xl bg-kuning-50 p-4 text-sm text-kuning-800">
                <p className="font-bold">Belum punya kelompok?</p>
                <p className="mt-1">
                  Tidak apa-apa! Kamu tetap bisa belajar Fitur 1–4 (video, materi, grafik, dan kuis) sambil menunggu
                  gurumu membagi kelompok.
                </p>
              </div>
            )}

            <button type="submit" disabled={memuat || terkunci} className="tombol-utama mt-5 w-full text-lg">
              {memuat ? <Loader2 className="h-5 w-5 animate-spin" /> : '🔓'}
              {memuat ? 'Memeriksa…' : 'Buka Fitur Proyek'}
            </button>
          </form>

          <button onClick={() => navigate('/beranda')} className="tombol-halus mt-3 w-full">
            Nanti saja — belajar Fitur 1–4 dulu
          </button>

          <p className="mt-4 text-center text-xs text-oranye-500">
            PIN salah 3 kali akan mengunci percobaan selama 5 menit.
          </p>
        </div>
      </div>
    </div>
  );
}
