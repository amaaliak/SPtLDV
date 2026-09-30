import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2, Trophy, XCircle } from 'lucide-react';
import { ambil, kirim } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { TataSiswa } from '../komponen/Tata';
import { Galat, Muat, Pesan } from '../komponen/UI';
import { waktuWIB } from '../lib/format';

const DURASI = 15 * 60; // 15 menit

export default function Fitur4() {
  const { segarkan } = useSesi();
  const [data, setData] = useState<any>(null);
  const [galat, setGalat] = useState('');
  const [tahap, setTahap] = useState<'mulai' | 'kerja' | 'hasil'>('mulai');
  const [jawaban, setJawaban] = useState<Record<string, number>>({});
  const [indeks, setIndeks] = useState(0);
  const [sisa, setSisa] = useState(DURASI);
  const [hasil, setHasil] = useState<any>(null);
  const [mengirim, setMengirim] = useState(false);
  const sedangKirim = useRef(false);

  const muat = useCallback(async () => {
    try {
      setGalat('');
      setData(await ambil('/kuis'));
    } catch (e: any) {
      setGalat(e.message || 'Gagal memuat kuis.');
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  const kirimJawaban = useCallback(
    async (otomatis = false) => {
      if (sedangKirim.current) return;
      sedangKirim.current = true;
      setMengirim(true);
      try {
        const r = await kirim('/kuis', { jawaban, otomatis });
        setHasil(r);
        setTahap('hasil');
        await Promise.all([muat(), segarkan()]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e: any) {
        setGalat(e.message || 'Gagal mengirim jawaban.');
      } finally {
        setMengirim(false);
        sedangKirim.current = false;
      }
    },
    [jawaban, muat, segarkan],
  );

  useEffect(() => {
    if (tahap !== 'kerja') return;
    const t = setInterval(() => {
      setSisa((s) => {
        if (s <= 1) {
          clearInterval(t);
          kirimJawaban(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [tahap, kirimJawaban]);

  if (galat && !data) return <TataSiswa langkah={4} judul="Kuis Otomatis" emoji="📝"><Galat pesan={galat} onCoba={muat} /></TataSiswa>;
  if (!data) return <TataSiswa langkah={4} judul="Kuis Otomatis" emoji="📝"><Muat teks="Menyiapkan soal…" /></TataSiswa>;

  const soal = data.soal || [];
  const terjawab = Object.keys(jawaban).length;

  /* ------------------------------- MULAI ------------------------------- */
  if (tahap === 'mulai') {
    return (
      <TataSiswa langkah={4} judul="Kuis Otomatis" emoji="📝">
        <div className="kartu p-6 text-center">
          <div className="text-5xl">🧠</div>
          <h2 className="mt-3 text-xl font-extrabold text-oranye-800">Kuis SPtLDV Bertema Kuliner</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-oranye-600">
            Kerjakan {data.totalSoal} soal pilihan ganda dalam waktu {data.durasiMenit} menit. Nilai minimal untuk
            lulus adalah <strong>{data.ambangLulus}</strong>. Kamu boleh mengulang sebanyak yang kamu mau — nilai
            terbaik yang disimpan.
          </p>

          <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-oranye-50 p-3">
              <p className="text-2xl font-extrabold text-oranye-700">{data.totalSoal}</p>
              <p className="text-xs text-oranye-600">Soal</p>
            </div>
            <div className="rounded-xl bg-kuning-50 p-3">
              <p className="text-2xl font-extrabold text-kuning-700">{data.durasiMenit}</p>
              <p className="text-xs text-kuning-700">Menit</p>
            </div>
            <div className="rounded-xl bg-hijau-50 p-3">
              <p className="text-2xl font-extrabold text-hijau-700">{data.terbaik ?? '—'}</p>
              <p className="text-xs text-hijau-700">Nilai terbaik</p>
            </div>
          </div>

          {data.lulus && (
            <div className="mt-5">
              <Pesan jenis="sukses">
                🎉 Kamu sudah lulus kuis dengan nilai {data.terbaik}. Fitur proyek (5–10) sudah terbuka!
              </Pesan>
            </div>
          )}

          <button
            onClick={() => {
              setJawaban({});
              setIndeks(0);
              setSisa(DURASI);
              setHasil(null);
              setTahap('kerja');
            }}
            className="tombol-utama mx-auto mt-6 w-full max-w-xs text-lg"
          >
            {data.percobaan > 0 ? '🔄 Ulangi Kuis' : '🚀 Mulai Kuis'}
          </button>
        </div>

        {/* Riwayat percobaan */}
        {data.riwayat?.length > 0 && (
          <div className="kartu mt-4 overflow-hidden">
            <div className="border-b border-oranye-100 bg-oranye-50 px-4 py-2.5">
              <h3 className="font-bold text-oranye-800">📊 Riwayat Percobaan</h3>
            </div>
            <ul className="divide-y divide-oranye-50">
              {data.riwayat.map((r: any, i: number) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-semibold text-oranye-700">Percobaan ke-{r.attempt_number}</span>
                  <span className="text-xs text-oranye-400">{waktuWIB(r.created_at)}</span>
                  <span className={`font-extrabold ${r.passed ? 'text-hijau-600' : 'text-red-500'}`}>{r.score}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pembahasan hanya bila sudah lulus */}
        {data.lulus && data.pembahasan && <Pembahasan soal={soal} pembahasan={data.pembahasan} />}

        {!data.lulus && (
          <div className="mt-4">
            <Pesan jenis="info">
              Kunci jawaban dan pembahasan akan terbuka setelah nilaimu mencapai {data.ambangLulus}. Semangat! 💪{' '}
              <Link to="/fitur/2" className="font-bold underline">
                Pelajari modul dulu
              </Link>
            </Pesan>
          </div>
        )}
      </TataSiswa>
    );
  }

  /* ------------------------------- KERJA ------------------------------- */
  if (tahap === 'kerja') {
    const s = soal[indeks];
    const menit = Math.floor(sisa / 60);
    const detik = sisa % 60;
    const mepet = sisa <= 120;

    return (
      <TataSiswa langkah={4} judul="Kuis Otomatis" emoji="📝">
        <div className="sticky top-0 z-10 -mx-4 mb-4 bg-krem/95 px-4 py-2 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-oranye-700">
              Soal {indeks + 1}/{soal.length}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-extrabold tabular-nums ${
                mepet ? 'animate-pulse bg-red-100 text-red-700' : 'bg-oranye-100 text-oranye-700'
              }`}
            >
              <Clock className="h-4 w-4" /> {menit}:{String(detik).padStart(2, '0')}
            </span>
            <span className="text-sm font-bold text-hijau-600">{terjawab} terisi</span>
          </div>
        </div>

        <div className="kartu p-5 animate-fade-up">
          <p className="text-base font-bold leading-relaxed text-oranye-900">{s.pertanyaan}</p>
          <div className="mt-4 space-y-2.5">
            {s.pilihan.map((p: string, i: number) => {
              const dipilih = jawaban[String(s.id)] === i;
              return (
                <button
                  key={i}
                  onClick={() => setJawaban((j) => ({ ...j, [String(s.id)]: i }))}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition ${
                    dipilih
                      ? 'border-oranye-500 bg-oranye-50 shadow-lembut'
                      : 'border-oranye-100 bg-white hover:border-oranye-300'
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      dipilih ? 'bg-oranye-500 text-white' : 'bg-oranye-100 text-oranye-700'
                    }`}
                  >
                    {['A', 'B', 'C', 'D'][i]}
                  </span>
                  <span className="text-sm text-oranye-800">{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => setIndeks((i) => Math.max(0, i - 1))} disabled={indeks === 0} className="tombol-kedua">
            <ChevronLeft className="h-5 w-5" /> Sebelumnya
          </button>
          {indeks < soal.length - 1 ? (
            <button onClick={() => setIndeks((i) => i + 1)} className="tombol-utama flex-1">
              Berikutnya <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={() => kirimJawaban(false)} disabled={mengirim} className="tombol-hijau flex-1">
              {mengirim ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Kirim Jawaban
            </button>
          )}
        </div>

        {/* Navigasi nomor soal */}
        <div className="kartu mt-4 p-4">
          <p className="mb-2 text-xs font-bold text-oranye-600">Loncat ke soal:</p>
          <div className="grid grid-cols-10 gap-1.5">
            {soal.map((q: any, i: number) => (
              <button
                key={q.id}
                onClick={() => setIndeks(i)}
                className={`aspect-square rounded-lg text-sm font-bold transition ${
                  i === indeks
                    ? 'bg-oranye-500 text-white'
                    : jawaban[String(q.id)] !== undefined
                      ? 'bg-hijau-100 text-hijau-700'
                      : 'bg-oranye-50 text-oranye-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {terjawab < soal.length && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-kuning-700">
              <AlertTriangle className="h-3.5 w-3.5" /> Masih ada {soal.length - terjawab} soal yang belum dijawab.
            </p>
          )}
          <button onClick={() => kirimJawaban(false)} disabled={mengirim} className="tombol-hijau mt-3 w-full">
            {mengirim ? <Loader2 className="h-5 w-5 animate-spin" /> : '✅'} Kirim Sekarang
          </button>
        </div>
      </TataSiswa>
    );
  }

  /* ------------------------------- HASIL ------------------------------- */
  const lulus = hasil?.lulus;
  return (
    <TataSiswa langkah={4} judul="Hasil Kuis" emoji="📝">
      <div className={`kartu p-6 text-center animate-pop ${lulus ? 'border-hijau-300' : 'border-red-200'}`}>
        <div
          className={`mx-auto grid h-28 w-28 place-items-center rounded-full ${
            lulus ? 'bg-hijau-100 text-hijau-700' : 'bg-red-50 text-red-600'
          }`}
        >
          <div>
            <p className="text-4xl font-extrabold">{hasil.skor}</p>
            <p className="text-xs font-bold">dari 100</p>
          </div>
        </div>
        <p className="mt-4 text-lg font-extrabold text-oranye-800">
          {lulus ? '🎉 Selamat!' : '💪 Belum berhasil'}
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-oranye-600">{hasil.pesan}</p>
        <p className="mt-2 text-xs text-oranye-500">
          Benar {hasil.benar} dari {hasil.totalSoal} soal · Percobaan ke-{hasil.percobaan} · Nilai terbaik{' '}
          {hasil.nilaiTerbaik}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {lulus ? (
            <>
              <Link to="/fitur/5" className="tombol-hijau">
                <Trophy className="h-5 w-5" /> Lanjut ke Proyek (Fitur 5)
              </Link>
              <button onClick={() => setTahap('mulai')} className="tombol-kedua">
                Lihat Pembahasan
              </button>
            </>
          ) : (
            <>
              <Link to="/fitur/2" className="tombol-utama">
                📚 Pelajari Modul Lagi
              </Link>
              <button
                onClick={() => {
                  setJawaban({});
                  setIndeks(0);
                  setSisa(DURASI);
                  setTahap('kerja');
                }}
                className="tombol-kedua"
              >
                🔄 Coba Lagi
              </button>
            </>
          )}
        </div>
      </div>

      {lulus && hasil.pembahasan && <Pembahasan soal={soal} pembahasan={hasil.pembahasan} rincian={hasil.rincian} />}

      {!lulus && (
        <div className="kartu mt-4 p-5">
          <h3 className="font-bold text-oranye-800">💡 Saran belajar</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-oranye-700">
            <li>Baca ulang Bab 1 untuk mengenali kata kunci “paling banyak” (≤) dan “minimal” (≥).</li>
            <li>Latih menggambar daerah penyelesaian di Fitur 3 sambil menggeser slider.</li>
            <li>Ingat: fungsi tujuan memakai KEUNTUNGAN (harga jual − modal), bukan harga jual.</li>
          </ul>
        </div>
      )}
    </TataSiswa>
  );
}

/* --------------------------- Bagian pembahasan -------------------------- */

function Pembahasan({ soal, pembahasan, rincian }: { soal: any[]; pembahasan: any[]; rincian?: any[] }) {
  const petaKunci = new Map(pembahasan.map((p: any) => [p.id, p]));
  const petaJawab = new Map((rincian || []).map((r: any) => [r.id, r]));
  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-lg font-extrabold text-oranye-800">🔑 Kunci Jawaban & Pembahasan</h3>
      {soal.map((s: any, i: number) => {
        const k = petaKunci.get(s.id);
        const j = petaJawab.get(s.id);
        if (!k) return null;
        return (
          <div key={s.id} className="kartu p-4">
            <div className="flex items-start gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-oranye-100 text-xs font-bold text-oranye-700">
                {i + 1}
              </span>
              <p className="flex-1 text-sm font-bold text-oranye-900">{s.pertanyaan}</p>
              {j && (j.benar ? <CheckCircle2 className="h-5 w-5 text-hijau-500" /> : <XCircle className="h-5 w-5 text-red-500" />)}
            </div>
            <p className="mt-2 rounded-lg bg-hijau-50 px-3 py-2 text-sm font-semibold text-hijau-700">
              ✅ Jawaban benar: {['A', 'B', 'C', 'D'][k.kunci]}. {s.pilihan[k.kunci]}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-oranye-700">{k.pembahasan}</p>
          </div>
        );
      })}
    </div>
  );
}
