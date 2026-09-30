import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { ambil, kirim } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { TataSiswa } from '../komponen/Tata';
import { Galat, Muat, Pesan } from '../komponen/UI';
import { rupiah } from '../lib/format';

interface BarisBahan {
  id: number;
  name: string;
  lainnya: boolean;
  unit: string;
  per_a: string;
  per_b: string;
  total: string;
}

const PILIHAN_BAHAN = ['Tepung', 'Telur', 'Gula', 'Mentega', 'Susu', 'Cokelat', 'Keju'];
const PILIHAN_SATUAN = ['gram', 'kg', 'butir', 'ml', 'liter', 'sdm', 'sdt'];

let nomor = 0;
const barisBaru = (nama = '', satuan = 'gram'): BarisBahan => ({
  id: ++nomor,
  name: nama,
  lainnya: nama !== '' && !PILIHAN_BAHAN.includes(nama),
  unit: satuan,
  per_a: '',
  per_b: '',
  total: '',
});

export default function Fitur5() {
  const { segarkan } = useSesi();
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState('');
  const [pesan, setPesan] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);

  const [namaA, setNamaA] = useState('');
  const [namaB, setNamaB] = useState('');
  const [bahan, setBahan] = useState<BarisBahan[]>([barisBaru('Tepung', 'gram'), barisBaru('Telur', 'butir')]);
  const [waktuA, setWaktuA] = useState('');
  const [satuanWaktuA, setSatuanWaktuA] = useState('menit');
  const [waktuB, setWaktuB] = useState('');
  const [satuanWaktuB, setSatuanWaktuB] = useState('menit');
  const [waktuTotal, setWaktuTotal] = useState('');
  const [satuanWaktuTotal, setSatuanWaktuTotal] = useState('jam');
  const [hargaA, setHargaA] = useState('');
  const [modalA, setModalA] = useState('');
  const [hargaB, setHargaB] = useState('');
  const [modalB, setModalB] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const d = await ambil('/wawancara');
        if (d.data) {
          setNamaA(d.data.product_a_name);
          setNamaB(d.data.product_b_name);
          setBahan(
            (d.data.ingredients || []).map((b: any) => ({
              id: ++nomor,
              name: b.name,
              lainnya: !PILIHAN_BAHAN.includes(b.name),
              unit: b.unit,
              per_a: String(b.per_a),
              per_b: String(b.per_b),
              total: String(b.total),
            })),
          );
          setWaktuA(String(d.data.time_per_a));
          setSatuanWaktuA('menit');
          setWaktuB(String(d.data.time_per_b));
          setSatuanWaktuB('menit');
          setWaktuTotal(String(d.data.time_total));
          setSatuanWaktuTotal('menit');
          setHargaA(String(d.data.price_a));
          setModalA(String(d.data.cost_a));
          setHargaB(String(d.data.price_b));
          setModalB(String(d.data.cost_b));
        }
      } catch (e: any) {
        setGalat(e.message || 'Gagal memuat data wawancara.');
      } finally {
        setMemuat(false);
      }
    })();
  }, []);

  const ubahBahan = (id: number, bagian: Partial<BarisBahan>) =>
    setBahan((s) => s.map((b) => (b.id === id ? { ...b, ...bagian } : b)));

  const untungA = Number(hargaA) - Number(modalA);
  const untungB = Number(hargaB) - Number(modalB);

  const simpan = async () => {
    setGalat('');
    setPesan('');
    setMenyimpan(true);
    try {
      const r = await kirim('/wawancara', {
        product_a_name: namaA,
        product_b_name: namaB,
        ingredients: bahan.map((b) => ({
          name: b.name.trim(),
          unit: b.unit,
          per_a: Number(b.per_a),
          per_b: Number(b.per_b),
          total: Number(b.total),
        })),
        time_per_a: Number(waktuA),
        time_unit_a: satuanWaktuA,
        time_per_b: Number(waktuB),
        time_unit_b: satuanWaktuB,
        time_total: Number(waktuTotal),
        time_unit_total: satuanWaktuTotal,
        price_a: Number(hargaA),
        cost_a: Number(modalA),
        price_b: Number(hargaB),
        cost_b: Number(modalB),
      });
      setPesan(r.pesan);
      await segarkan();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setGalat(e.message || 'Gagal menyimpan data.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setMenyimpan(false);
    }
  };

  if (memuat) return <TataSiswa langkah={5} judul="Form Wawancara" emoji="🍳"><Muat /></TataSiswa>;

  return (
    <TataSiswa langkah={5} judul="Form Wawancara Terstruktur" emoji="🍳">
      <p className="mb-4 text-sm text-oranye-700">
        Wawancarai pengelola kantin/dapur, lalu isi data di bawah ini{' '}
        <strong>sesuai produk yang kelompokmu pilih sendiri</strong>. Data inilah yang akan kamu ubah menjadi model
        matematika di Fitur 6.
      </p>

      {galat && <div className="mb-4"><Pesan jenis="galat">{galat}</Pesan></div>}
      {pesan && <div className="mb-4"><Pesan jenis="sukses">{pesan}</Pesan></div>}

      {/* --------------------------- Nama produk ------------------------- */}
      <div className="kartu p-5">
        <h2 className="font-extrabold text-oranye-800">1️⃣ Produk yang Diteliti</h2>
        <p className="mb-3 text-xs text-oranye-600">Tulis nama produk sesuai hasil wawancara kelompokmu.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pa">
              Nama Produk A (x)
            </label>
            <input id="pa" className="isian" placeholder="Contoh: Kue Lapis" value={namaA} onChange={(e) => setNamaA(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pb">
              Nama Produk B (y)
            </label>
            <input id="pb" className="isian" placeholder="Contoh: Risoles" value={namaB} onChange={(e) => setNamaB(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ----------------------------- Bahan ----------------------------- */}
      <div className="kartu mt-4 p-5">
        <h2 className="font-extrabold text-oranye-800">2️⃣ Kebutuhan Bahan</h2>
        <p className="mb-3 text-xs text-oranye-600">
          Berapa banyak bahan untuk <strong>1 porsi</strong> tiap produk, dan berapa total persediaan per hari?
        </p>

        <div className="space-y-3">
          {bahan.map((b, i) => (
            <div key={b.id} className="rounded-xl border-2 border-oranye-100 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold text-oranye-400">BAHAN {i + 1}</span>
                <button
                  onClick={() => bahan.length > 2 && setBahan((s) => s.filter((x) => x.id !== b.id))}
                  disabled={bahan.length <= 2}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="label text-xs">Nama bahan</label>
                  <select
                    className="isian py-2"
                    value={b.lainnya ? '__lain' : b.name}
                    onChange={(e) =>
                      e.target.value === '__lain'
                        ? ubahBahan(b.id, { lainnya: true, name: '' })
                        : ubahBahan(b.id, { lainnya: false, name: e.target.value })
                    }
                  >
                    <option value="">— pilih —</option>
                    {PILIHAN_BAHAN.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                    <option value="__lain">Lainnya…</option>
                  </select>
                  {b.lainnya && (
                    <input
                      className="isian mt-2 py-2"
                      placeholder="Tulis nama bahan"
                      value={b.name}
                      onChange={(e) => ubahBahan(b.id, { name: e.target.value })}
                    />
                  )}
                </div>
                <div>
                  <label className="label text-xs">Satuan</label>
                  <select className="isian py-2" value={b.unit} onChange={(e) => ubahBahan(b.id, { unit: e.target.value })}>
                    {PILIHAN_SATUAN.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div>
                  <label className="label text-xs truncate">per {namaA || 'Produk A'}</label>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    className="isian py-2 text-center tabular-nums"
                    value={b.per_a}
                    onChange={(e) => ubahBahan(b.id, { per_a: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label text-xs truncate">per {namaB || 'Produk B'}</label>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    className="isian py-2 text-center tabular-nums"
                    value={b.per_b}
                    onChange={(e) => ubahBahan(b.id, { per_b: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label text-xs">Total/hari</label>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    className="isian py-2 text-center tabular-nums"
                    value={b.total}
                    onChange={(e) => ubahBahan(b.id, { total: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setBahan((s) => [...s, barisBaru()])} className="tombol-halus mt-3 w-full">
          <Plus className="h-5 w-5" /> Tambah Bahan
        </button>
      </div>

      {/* ----------------------------- Waktu ----------------------------- */}
      <div className="kartu mt-4 p-5">
        <h2 className="font-extrabold text-oranye-800">3️⃣ Waktu Produksi</h2>
        <p className="mb-3 text-xs text-oranye-600">
          Waktu akan otomatis diseragamkan ke <strong>menit</strong> saat disimpan.
        </p>
        <div className="space-y-3">
          {[
            { label: `Waktu membuat 1 ${namaA || 'Produk A'}`, nilai: waktuA, set: setWaktuA, satuan: satuanWaktuA, setSatuan: setSatuanWaktuA },
            { label: `Waktu membuat 1 ${namaB || 'Produk B'}`, nilai: waktuB, set: setWaktuB, satuan: satuanWaktuB, setSatuan: setSatuanWaktuB },
            { label: 'Total waktu kerja per hari', nilai: waktuTotal, set: setWaktuTotal, satuan: satuanWaktuTotal, setSatuan: setSatuanWaktuTotal },
          ].map((w) => (
            <div key={w.label}>
              <label className="label">{w.label}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  className="isian flex-1 tabular-nums"
                  value={w.nilai}
                  onChange={(e) => w.set(e.target.value)}
                  placeholder="0"
                />
                <select className="isian w-28" value={w.satuan} onChange={(e) => w.setSatuan(e.target.value)}>
                  <option value="menit">menit</option>
                  <option value="jam">jam</option>
                </select>
              </div>
              {w.satuan === 'jam' && Number(w.nilai) > 0 && (
                <p className="mt-1 text-xs font-semibold text-hijau-600">= {Number(w.nilai) * 60} menit</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --------------------------- Keuntungan -------------------------- */}
      <div className="kartu mt-4 p-5">
        <h2 className="font-extrabold text-oranye-800">4️⃣ Harga Jual & Modal</h2>
        <p className="mb-3 text-xs text-oranye-600">Keuntungan dihitung otomatis: harga jual − modal.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { nama: namaA || 'Produk A', harga: hargaA, setHarga: setHargaA, modal: modalA, setModal: setModalA, untung: untungA, emoji: '🍰' },
            { nama: namaB || 'Produk B', harga: hargaB, setHarga: setHargaB, modal: modalB, setModal: setModalB, untung: untungB, emoji: '🥟' },
          ].map((p) => (
            <div key={p.nama} className="rounded-xl bg-oranye-50 p-3">
              <p className="mb-2 font-bold text-oranye-800">
                {p.emoji} {p.nama}
              </p>
              <label className="label text-xs">Harga jual per porsi (Rp)</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="isian py-2 tabular-nums"
                value={p.harga}
                onChange={(e) => p.setHarga(e.target.value)}
              />
              <label className="label mt-2 text-xs">Modal per porsi (Rp)</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="isian py-2 tabular-nums"
                value={p.modal}
                onChange={(e) => p.setModal(e.target.value)}
              />
              <div
                className={`mt-2 rounded-lg px-3 py-2 text-center text-sm font-extrabold ${
                  p.untung > 0 ? 'bg-hijau-100 text-hijau-700' : 'bg-red-50 text-red-600'
                }`}
              >
                Keuntungan: {p.harga && p.modal ? rupiah(p.untung) : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button onClick={simpan} disabled={menyimpan} className="tombol-hijau flex-1 text-lg">
          {menyimpan ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Simpan Data Wawancara
        </button>
        <Link to="/fitur/6" className="tombol-utama flex-1">
          Lanjut: Susun Pertidaksamaan 🧮
        </Link>
      </div>

      <div className="kartu mt-4 border-kuning-200 bg-kuning-50 p-4 text-sm text-kuning-900">
        <p className="flex items-center gap-2 font-bold">
          <CheckCircle2 className="h-4 w-4" /> Tips wawancara
        </p>
        <ul className="mt-1.5 list-inside list-disc space-y-1">
          <li>Tanyakan kebutuhan bahan untuk 1 porsi, bukan untuk satu resep besar.</li>
          <li>Pastikan satuan konsisten (jangan campur gram dan kilogram dalam satu baris).</li>
          <li>Catat jam buka dapur untuk menghitung total waktu kerja per hari.</li>
        </ul>
      </div>
    </TataSiswa>
  );
}
