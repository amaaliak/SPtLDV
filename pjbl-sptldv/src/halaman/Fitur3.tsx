import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { ambil, kirim } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { TataSiswa } from '../komponen/Tata';
import { Pesan } from '../komponen/UI';
import BidangKoordinat, { WARNA_GARIS } from '../komponen/BidangKoordinat';
import { nilaiOptimum, tulisKendala, type Kendala, type Tanda } from '../../shared/linear';
import { rupiah } from '../lib/format';

interface Baris extends Kendala {
  id: number;
  maksA: number;
  maksB: number;
  maksC: number;
}

let urutan = 100;

function rapi(n: number) {
  const pangkat = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(n, 1)))));
  return Math.max(10, Math.ceil(n / pangkat) * pangkat);
}

function buatBaris(k: Kendala): Baris {
  return {
    ...k,
    id: ++urutan,
    maksA: rapi(Math.max(k.a * 4, 10)),
    maksB: rapi(Math.max(k.b * 4, 10)),
    maksC: rapi(Math.max(k.c * 2.5, 20)),
  };
}

const CONTOH_KANTIN: Kendala[] = [
  { a: 200, b: 150, op: '<=', c: 6000, label: 'Tepung (gram)' },
  { a: 1, b: 2, op: '<=', c: 40, label: 'Telur (butir)' },
  { a: 30, b: 10, op: '<=', c: 450, label: 'Waktu (menit)' },
];

export default function Fitur3() {
  const { segarkan } = useSesi();
  const [baris, setBaris] = useState<Baris[]>(() => CONTOH_KANTIN.map(buatBaris));
  const [pakaiTujuan, setPakaiTujuan] = useState(true);
  const [tujuanA, setTujuanA] = useState(6000);
  const [tujuanB, setTujuanB] = useState(3000);
  const [selesai, setSelesai] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    ambil('/siswa/beranda')
      .then((d) => setSelesai(!!d.progres?.[3]))
      .catch(() => {});
  }, []);

  const kendala: Kendala[] = useMemo(
    () => baris.map((b, i) => ({ a: b.a, b: b.b, op: b.op, c: b.c, label: b.label, warna: WARNA_GARIS[i % WARNA_GARIS.length] })),
    [baris],
  );

  const hasil = useMemo(
    () => (pakaiTujuan ? nilaiOptimum(kendala, { a: tujuanA, b: tujuanB }, 'maks') : null),
    [kendala, pakaiTujuan, tujuanA, tujuanB],
  );

  const ubah = (id: number, bagian: Partial<Baris>) =>
    setBaris((s) => s.map((b) => (b.id === id ? { ...b, ...bagian } : b)));

  const tambah = () =>
    setBaris((s) => [...s, buatBaris({ a: 1, b: 1, op: '<=', c: 20, label: `Batasan ${s.length + 1}` })]);

  const hapus = (id: number) => setBaris((s) => (s.length > 1 ? s.filter((b) => b.id !== id) : s));

  const tandaiSelesai = async () => {
    setMenyimpan(true);
    try {
      await kirim('/siswa/progres', { fitur: 3, selesai: true });
      setSelesai(true);
      await segarkan();
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <TataSiswa langkah={3} judul="Grafik Interaktif" emoji="📈" lebar="lebar">
      <p className="mb-4 text-sm text-oranye-700">
        Geser slider dan lihat bagaimana garis serta <strong>daerah penyelesaian</strong> ikut bergerak. Semua grafik di
        sini dibuat khusus untuk kelas ini — bukan aplikasi luar.
      </p>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ----------------------------- Grafik --------------------------- */}
        <div className="lg:col-span-3">
          <div className="kartu p-4">
            <BidangKoordinat
              kendala={kendala}
              tujuan={pakaiTujuan ? { a: tujuanA, b: tujuanB } : null}
              tampilkanOptimum={pakaiTujuan}
              labelX="x = banyaknya Produk A (porsi)"
              labelY="y = banyaknya Produk B (porsi)"
              satuanZ={(n) => rupiah(n)}
              tinggi={430}
            />
          </div>

          {/* Sistem pertidaksamaan */}
          <div className="kartu mt-4 p-4">
            <h3 className="font-bold text-oranye-800">🧾 Sistem Pertidaksamaanmu</h3>
            <div className="mt-2 space-y-1 font-mono text-sm text-oranye-700">
              {kendala.map((k, i) => (
                <p key={i} style={{ color: k.warna }}>
                  {tulisKendala(k)} <span className="text-xs text-oranye-400">({k.label})</span>
                </p>
              ))}
              <p>x ≥ 0 , y ≥ 0</p>
              {pakaiTujuan && (
                <p className="pt-1 font-bold text-oranye-800">
                  Z = {tujuanA.toLocaleString('id-ID')}x + {tujuanB.toLocaleString('id-ID')}y
                </p>
              )}
            </div>
          </div>

          {/* Hasil titik pojok */}
          {pakaiTujuan && hasil && hasil.semuaTitik.length > 0 && (
            <div className="kartu mt-4 overflow-hidden">
              <div className="border-b border-oranye-100 bg-oranye-50 px-4 py-2.5">
                <h3 className="font-bold text-oranye-800">🏆 Uji Titik Pojok</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-oranye-500">
                    <tr>
                      <th className="px-4 py-2">Titik (x, y)</th>
                      <th className="px-4 py-2">Nilai Z</th>
                      <th className="px-4 py-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-oranye-50">
                    {hasil.semuaTitik.map((t, i) => {
                      const juara = hasil.titik && t.x === hasil.titik.x && t.y === hasil.titik.y;
                      return (
                        <tr key={i} className={juara ? 'bg-hijau-50 font-bold text-hijau-700' : ''}>
                          <td className="px-4 py-2 tabular-nums">
                            ({Number(t.x.toFixed(2))} , {Number(t.y.toFixed(2))})
                          </td>
                          <td className="px-4 py-2 tabular-nums">{rupiah(t.z)}</td>
                          <td className="px-4 py-2">{juara ? '⭐ Nilai maksimum' : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ---------------------------- Kendali --------------------------- */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <button onClick={tambah} className="tombol-halus flex-1 py-2 text-sm">
              <Plus className="h-4 w-4" /> Tambah Pertidaksamaan
            </button>
            <button
              onClick={() => setBaris(CONTOH_KANTIN.map(buatBaris))}
              className="tombol-kedua flex-1 py-2 text-sm"
            >
              <RotateCcw className="h-4 w-4" /> Contoh Kantin
            </button>
          </div>

          {baris.map((b, i) => (
            <div key={b.id} className="kartu p-4">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: WARNA_GARIS[i % WARNA_GARIS.length] }}
                />
                <input
                  value={b.label ?? ''}
                  onChange={(e) => ubah(b.id, { label: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-oranye-200 px-2 py-1 text-sm font-bold text-oranye-800"
                  placeholder="Nama batasan"
                  aria-label="Nama batasan"
                />
                <select
                  value={b.op}
                  onChange={(e) => ubah(b.id, { op: e.target.value as Tanda })}
                  className="rounded-lg border border-oranye-200 px-2 py-1 text-sm font-bold"
                  aria-label="Tanda pertidaksamaan"
                >
                  <option value="<=">≤</option>
                  <option value=">=">≥</option>
                  <option value="<">&lt;</option>
                  <option value=">">&gt;</option>
                </select>
                <button
                  onClick={() => hapus(b.id)}
                  disabled={baris.length <= 1}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30"
                  aria-label="Hapus pertidaksamaan"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-2 rounded-lg bg-oranye-50 py-1.5 text-center font-mono text-sm font-bold text-oranye-800">
                {tulisKendala(b)}
              </p>

              {[
                { kunci: 'a' as const, nama: 'Koefisien x', maks: b.maksA },
                { kunci: 'b' as const, nama: 'Koefisien y', maks: b.maksB },
                { kunci: 'c' as const, nama: 'Ruas kanan', maks: b.maksC },
              ].map((s) => (
                <div key={s.kunci} className="mb-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-oranye-700">
                    <label htmlFor={`${b.id}-${s.kunci}`}>{s.nama}</label>
                    <input
                      type="number"
                      value={b[s.kunci]}
                      onChange={(e) => ubah(b.id, { [s.kunci]: Number(e.target.value) || 0 } as any)}
                      className="w-24 rounded-lg border border-oranye-200 px-2 py-0.5 text-right tabular-nums"
                      aria-label={`${s.nama} angka`}
                    />
                  </div>
                  <input
                    id={`${b.id}-${s.kunci}`}
                    type="range"
                    min={0}
                    max={s.maks}
                    step={s.maks > 1000 ? 50 : s.maks > 100 ? 5 : 1}
                    value={b[s.kunci]}
                    onChange={(e) => ubah(b.id, { [s.kunci]: Number(e.target.value) } as any)}
                    className="mt-1 w-full"
                  />
                </div>
              ))}
            </div>
          ))}

          {/* Fungsi tujuan */}
          <div className="kartu p-4">
            <button
              onClick={() => setPakaiTujuan((v) => !v)}
              className="flex w-full items-center justify-between font-bold text-oranye-800"
            >
              <span>💰 Fungsi Tujuan (keuntungan)</span>
              {pakaiTujuan ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            {pakaiTujuan && (
              <div className="mt-3 space-y-2">
                <p className="rounded-lg bg-kuning-50 py-1.5 text-center font-mono text-sm font-bold text-kuning-800">
                  Z = {tujuanA.toLocaleString('id-ID')}x + {tujuanB.toLocaleString('id-ID')}y
                </p>
                {[
                  { nama: 'Untung Produk A (x)', nilai: tujuanA, set: setTujuanA },
                  { nama: 'Untung Produk B (y)', nilai: tujuanB, set: setTujuanB },
                ].map((s) => (
                  <div key={s.nama}>
                    <div className="flex items-center justify-between text-xs font-semibold text-oranye-700">
                      <span>{s.nama}</span>
                      <span className="tabular-nums">{rupiah(s.nilai)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20000}
                      step={500}
                      value={s.nilai}
                      onChange={(e) => s.set(Number(e.target.value))}
                      className="mt-1 w-full"
                      aria-label={s.nama}
                    />
                  </div>
                ))}
                {hasil?.titik && (
                  <p className="rounded-lg bg-hijau-50 p-2 text-center text-sm font-bold text-hijau-700">
                    ⭐ Optimum: ({Number(hasil.titik.x.toFixed(2))} , {Number(hasil.titik.y.toFixed(2))}) → {rupiah(hasil.nilai)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tantangan */}
          <div className="kartu border-kuning-200 bg-kuning-50 p-4">
            <h3 className="font-bold text-kuning-800">🎯 Tantangan Eksplorasi</h3>
            <ol className="mt-1.5 list-inside list-decimal space-y-1 text-sm text-kuning-900">
              <li>Geser “ruas kanan” batas waktu sampai daerah penyelesaian berubah bentuk. Apa yang terjadi?</li>
              <li>Ubah tanda ≤ menjadi ≥ pada satu batasan. Ke mana arsiran berpindah?</li>
              <li>Naikkan untung Produk B. Pada nilai berapa titik optimum berpindah?</li>
            </ol>
          </div>
        </div>
      </div>

      {selesai && (
        <div className="mt-5">
          <Pesan jenis="sukses">Kamu sudah mencoba grafik interaktif. Siap untuk kuis? 📝</Pesan>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button onClick={tandaiSelesai} disabled={menyimpan || selesai} className="tombol-hijau flex-1">
          {menyimpan ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          {selesai ? 'Sudah Dicoba ✓' : 'Saya Sudah Mencoba'}
        </button>
        <Link to="/fitur/4" className="tombol-utama flex-1">
          Lanjut: Kuis Otomatis 📝
        </Link>
      </div>
    </TataSiswa>
  );
}
