import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, HelpCircle, Lightbulb, Loader2, RefreshCw, Send, XCircle } from 'lucide-react';
import { ambil, kirim } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { TataSiswa } from '../komponen/Tata';
import { Galat, Muat, Pesan } from '../komponen/UI';
import BidangKoordinat from '../komponen/BidangKoordinat';
import { rupiah } from '../lib/format';
import type { Kendala } from '../../shared/linear';

interface BarisIsian {
  key: string;
  jenis: string;
  label: string;
  satuan: string;
}

export default function Fitur6() {
  const { segarkan } = useSesi();
  const [data, setData] = useState<any>(null);
  const [galat, setGalat] = useState('');
  const [isian, setIsian] = useState<Record<string, string>>({});
  const [nonneg, setNonneg] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [hasil, setHasil] = useState<any>(null);
  const [mengirim, setMengirim] = useState(false);

  const muat = async () => {
    try {
      setGalat('');
      const d = await ambil('/pertidaksamaan');
      setData(d);
      if (d.terakhir?.inequalities) {
        const map: Record<string, string> = {};
        for (const b of d.terakhir.inequalities) {
          if (b.key === 'nonneg') setNonneg(b.input || '');
          else map[b.key] = b.input || '';
        }
        setIsian(map);
      }
      if (d.terakhir?.objective_function) setTujuan(d.terakhir.objective_function);
      if (d.selesai && d.hadiah) {
        setHasil({ semuaBenar: true, hadiah: d.hadiah, pesan: 'Kelompokmu sudah menyelesaikan model matematikanya 🎉' });
      }
    } catch (e: any) {
      setGalat(e.message || 'Gagal memuat data.');
      setData({ perluWawancara: e.data?.perluWawancara });
    }
  };

  useEffect(() => {
    muat();
  }, []);

  const kirimJawaban = async () => {
    setMengirim(true);
    try {
      const r = await kirim('/pertidaksamaan/cek', { jawaban: isian, nonneg, tujuan });
      setHasil(r);
      if (r.semuaBenar) await segarkan();
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
    } catch (e: any) {
      setGalat(e.message || 'Gagal mengirim jawaban.');
    } finally {
      setMengirim(false);
    }
  };

  const petaHasil = useMemo(() => {
    const m: Record<string, any> = {};
    for (const h of hasil?.hasil || []) m[h.key] = h;
    if (hasil?.tujuan) m['tujuan'] = hasil.tujuan;
    return m;
  }, [hasil]);

  if (galat && !data?.referensi) {
    return (
      <TataSiswa langkah={6} judul="Feedback Pertidaksamaan" emoji="🧮">
        {data?.perluWawancara ? (
          <div className="kartu p-6 text-center">
            <p className="text-4xl">📋</p>
            <h2 className="mt-2 text-lg font-extrabold text-oranye-800">Data wawancara belum ada</h2>
            <p className="mt-1 text-sm text-oranye-600">
              Kelompokmu harus mengisi Form Wawancara (Fitur 5) terlebih dahulu. Model matematika disusun dari data itu.
            </p>
            <Link to="/fitur/5" className="tombol-utama mx-auto mt-4">
              🍳 Isi Form Wawancara
            </Link>
          </div>
        ) : (
          <Galat pesan={galat} onCoba={muat} />
        )}
      </TataSiswa>
    );
  }
  if (!data) return <TataSiswa langkah={6} judul="Feedback Pertidaksamaan" emoji="🧮"><Muat /></TataSiswa>;

  const ref = data.referensi;
  const baris: BarisIsian[] = data.baris || [];
  const selesai = hasil?.semuaBenar;

  return (
    <TataSiswa langkah={6} judul="Susun Pertidaksamaanmu" emoji="🧮" lebar="lebar">
      {/* --------------------------- Reward ----------------------------- */}
      {selesai && hasil?.hadiah && <Hadiah hadiah={hasil.hadiah} />}

      {!selesai && (
        <div className="mb-4">
          <Pesan jenis="info">
            Sistem ini <strong>tidak memberikan jawaban</strong>. Ia hanya memberi petunjuk supaya kamu menemukan
            sendiri model matematikanya. Perbaiki dan cek lagi sebanyak yang kamu perlukan 💪
          </Pesan>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ------------------------ Data referensi ---------------------- */}
        <div className="lg:col-span-2">
          <div className="kartu overflow-hidden lg:sticky lg:top-4">
            <div className="border-b border-oranye-100 bg-oranye-50 px-4 py-3">
              <h2 className="font-extrabold text-oranye-800">📋 Data Wawancara Kelompokmu</h2>
              <p className="text-xs text-oranye-600">
                x = {ref.produkA} · y = {ref.produkB}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-oranye-500">
                  <tr>
                    <th className="px-3 py-2">Kebutuhan</th>
                    <th className="px-3 py-2">per {ref.produkA}</th>
                    <th className="px-3 py-2">per {ref.produkB}</th>
                    <th className="px-3 py-2">Tersedia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-oranye-50">
                  {ref.bahan.map((b: any) => (
                    <tr key={b.name}>
                      <td className="px-3 py-2 font-semibold text-oranye-800">
                        {b.name} <span className="text-xs font-normal text-oranye-400">({b.unit})</span>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{b.per_a}</td>
                      <td className="px-3 py-2 tabular-nums">{b.per_b}</td>
                      <td className="px-3 py-2 font-bold tabular-nums text-hijau-600">{b.total}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-3 py-2 font-semibold text-oranye-800">
                      Waktu <span className="text-xs font-normal text-oranye-400">(menit)</span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{ref.waktu.per_a}</td>
                    <td className="px-3 py-2 tabular-nums">{ref.waktu.per_b}</td>
                    <td className="px-3 py-2 font-bold tabular-nums text-hijau-600">{ref.waktu.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="border-t border-oranye-100 bg-kuning-50/60 px-3 py-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold text-oranye-500">{ref.produkA}</p>
                  <p>Harga jual: {rupiah(ref.harga.price_a)}</p>
                  <p>Modal: {rupiah(ref.harga.cost_a)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-oranye-500">{ref.produkB}</p>
                  <p>Harga jual: {rupiah(ref.harga.price_b)}</p>
                  <p>Modal: {rupiah(ref.harga.cost_b)}</p>
                </div>
              </div>
              <Link to="/fitur/5" className="mt-2 inline-block text-xs font-bold text-oranye-600 underline">
                Perlu mengubah data? Buka Form Wawancara
              </Link>
            </div>
          </div>
        </div>

        {/* --------------------------- Isian ---------------------------- */}
        <div className="lg:col-span-3">
          <div className="kartu p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold text-oranye-800">✍️ Tulis Model Matematikamu</h2>
              <span className="lencana bg-oranye-100 text-oranye-700">Percobaan ke-{(data.percobaan || 0) + (hasil ? 0 : 1)}</span>
            </div>
            <p className="mt-1 text-xs text-oranye-600">
              Gunakan tanda <code className="rounded bg-oranye-50 px-1">&lt;=</code> atau{' '}
              <code className="rounded bg-oranye-50 px-1">≤</code>. Contoh pola penulisan:{' '}
              <code className="rounded bg-oranye-50 px-1">…x + …y &lt;= …</code>
            </p>

            <div className="mt-4 space-y-4">
              {baris.map((b) => (
                <Isian
                  key={b.key}
                  judul={`Batasan ${b.label}${b.satuan ? ` (${b.satuan})` : ''}`}
                  nilai={isian[b.key] || ''}
                  ubah={(v) => setIsian((s) => ({ ...s, [b.key]: v }))}
                  umpan={petaHasil[b.key]}
                  contoh="…x + …y <= …"
                />
              ))}
              <Isian
                judul="Syarat non-negatif"
                nilai={nonneg}
                ubah={setNonneg}
                umpan={petaHasil['nonneg']}
                contoh="x >= 0, y >= 0"
              />
              <Isian
                judul="Fungsi tujuan (keuntungan)"
                nilai={tujuan}
                ubah={setTujuan}
                umpan={petaHasil['tujuan']}
                contoh="Z = …x + …y"
              />
            </div>

            {hasil && !hasil.semuaBenar && (
              <div className="mt-4">
                <Pesan jenis="peringatan">{hasil.pesan}</Pesan>
              </div>
            )}

            <button onClick={kirimJawaban} disabled={mengirim} className="tombol-utama mt-5 w-full text-lg">
              {mengirim ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Cek Jawaban Saya
            </button>

            {hasil && !hasil.semuaBenar && (
              <button onClick={() => setHasil(null)} className="tombol-halus mt-2 w-full">
                <RefreshCw className="h-4 w-4" /> Sembunyikan hasil & perbaiki dulu
              </button>
            )}
          </div>

          <div className="kartu mt-4 border-kuning-200 bg-kuning-50 p-4 text-sm text-kuning-900">
            <p className="flex items-center gap-2 font-bold">
              <Lightbulb className="h-4 w-4" /> Cara berpikir
            </p>
            <ol className="mt-1.5 list-inside list-decimal space-y-1">
              <li>Satu baris batasan = satu bahan atau satu sumber daya.</li>
              <li>Koefisien x = kebutuhan untuk 1 porsi {ref.produkA}; koefisien y untuk 1 porsi {ref.produkB}.</li>
              <li>Ruas kanan = jumlah yang TERSEDIA per hari.</li>
              <li>Fungsi tujuan memakai keuntungan per porsi, bukan harga jual.</li>
            </ol>
          </div>
        </div>
      </div>
    </TataSiswa>
  );
}

/* ---------------------------- Kotak isian ------------------------------ */

function Isian({
  judul,
  nilai,
  ubah,
  umpan,
  contoh,
}: {
  judul: string;
  nilai: string;
  ubah: (v: string) => void;
  umpan?: { correct: boolean; hint: string };
  contoh: string;
}) {
  const benar = umpan?.correct;
  return (
    <div>
      <label className="label flex items-center justify-between">
        <span>{judul}</span>
        {umpan && (
          <span className={`lencana ${benar ? 'bg-hijau-100 text-hijau-700' : 'bg-red-100 text-red-700'}`}>
            {benar ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Tepat!
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" /> Belum tepat
              </>
            )}
          </span>
        )}
      </label>
      <div className="flex gap-2">
        <input
          className={`isian font-mono ${
            umpan ? (benar ? 'border-hijau-400 bg-hijau-50' : 'border-red-300 bg-red-50') : ''
          }`}
          placeholder={contoh}
          value={nilai}
          onChange={(e) => ubah(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => ubah(nilai + '≤')}
            className="rounded-lg bg-oranye-100 px-2.5 py-0.5 text-sm font-bold text-oranye-700 hover:bg-oranye-200"
            aria-label="Sisipkan tanda kurang dari sama dengan"
          >
            ≤
          </button>
          <button
            type="button"
            onClick={() => ubah(nilai + '≥')}
            className="rounded-lg bg-oranye-100 px-2.5 py-0.5 text-sm font-bold text-oranye-700 hover:bg-oranye-200"
            aria-label="Sisipkan tanda lebih dari sama dengan"
          >
            ≥
          </button>
        </div>
      </div>
      {umpan && !benar && umpan.hint && (
        <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-kuning-50 px-3 py-2 text-sm text-kuning-900 animate-fade-up">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-kuning-600" />
          <span>{umpan.hint}</span>
        </p>
      )}
    </div>
  );
}

/* ------------------------------- Hadiah -------------------------------- */

function Hadiah({ hadiah }: { hadiah: any }) {
  const kendala: Kendala[] = hadiah.kendala;
  const opt = hadiah.optimum;
  return (
    <div className="kartu mb-5 overflow-hidden border-hijau-300 animate-pop">
      <div className="bg-gradient-to-r from-hijau-500 to-hijau-600 p-5 text-center text-white">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-1 text-xl font-extrabold">Model Matematikamu Sudah Tepat!</h2>
        <p className="mt-1 text-sm text-white/90">
          Inilah hadiahmu: grafik daerah penyelesaian beserta titik pojok dan solusi optimalnya.
        </p>
      </div>
      <div className="p-5">
        <BidangKoordinat
          kendala={kendala}
          tujuan={hadiah.tujuan}
          tampilkanOptimum
          labelX={`x = banyaknya ${hadiah.produkA} (porsi)`}
          labelY={`y = banyaknya ${hadiah.produkB} (porsi)`}
          satuanZ={(n) => rupiah(n)}
          tinggi={420}
        />

        <div className="mt-4 overflow-hidden rounded-xl border border-oranye-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-oranye-50 text-xs uppercase text-oranye-600">
              <tr>
                <th className="px-3 py-2">Titik pojok (x, y)</th>
                <th className="px-3 py-2">Keuntungan Z</th>
                <th className="px-3 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oranye-50">
              {opt.semuaTitik.map((t: any, i: number) => {
                const juara = opt.titik && t.x === opt.titik.x && t.y === opt.titik.y;
                return (
                  <tr key={i} className={juara ? 'bg-hijau-50 font-bold text-hijau-700' : ''}>
                    <td className="px-3 py-2 tabular-nums">
                      ({Number(t.x.toFixed(2))} , {Number(t.y.toFixed(2))})
                    </td>
                    <td className="px-3 py-2 tabular-nums">{rupiah(t.z)}</td>
                    <td className="px-3 py-2">{juara ? '⭐ Keuntungan maksimum' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {opt.titik && (
          <div className="mt-4 rounded-xl bg-hijau-50 p-4 text-center">
            <p className="text-sm font-semibold text-hijau-700">Rekomendasi produksi untuk kantin:</p>
            <p className="mt-1 text-lg font-extrabold text-hijau-800">
              {Number(opt.titik.x.toFixed(2))} porsi {hadiah.produkA} + {Number(opt.titik.y.toFixed(2))} porsi{' '}
              {hadiah.produkB}
            </p>
            <p className="text-sm font-bold text-hijau-700">Keuntungan maksimum {rupiah(opt.nilai)} per hari</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link to="/fitur/7" className="tombol-utama flex-1">
            Lanjut: Jurnal Harian 🗓️
          </Link>
          <Link to="/fitur/9" className="tombol-kedua flex-1">
            Siapkan Portofolio 📤
          </Link>
        </div>
      </div>
    </div>
  );
}
