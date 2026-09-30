import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ambil, kirim } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { TataSiswa } from '../komponen/Tata';
import { Bintang, Galat, Muat, Pesan } from '../komponen/UI';

const WARNA = ['#FB923C', '#EAB308', '#22C55E'];

export default function Fitur10() {
  const { segarkan } = useSesi();
  const [data, setData] = useState<any>(null);
  const [galat, setGalat] = useState('');
  const [selesai, setSelesai] = useState(false);
  const [belajar, setBelajar] = useState('');
  const [sulit, setSulit] = useState('');
  const [rating, setRating] = useState(0);
  const [mengirim, setMengirim] = useState(false);

  const muat = async () => {
    try {
      setGalat('');
      const d = await ambil('/refleksi');
      setData(d);
      if (d.data) {
        setBelajar(d.data.what_learned || '');
        setSulit(d.data.what_was_hard || '');
        setRating(d.data.improvement_rating || 0);
        setSelesai(true);
      }
    } catch (e: any) {
      setGalat(e.message || 'Gagal memuat refleksi.');
    }
  };

  useEffect(() => {
    muat();
  }, []);

  const simpan = async () => {
    setGalat('');
    if (belajar.trim().length < 10) return setGalat('Ceritakan minimal 10 karakter tentang hal baru yang kamu pelajari.');
    if (sulit.trim().length < 10) return setGalat('Ceritakan minimal 10 karakter tentang bagian yang paling sulit.');
    if (rating < 1) return setGalat('Pilih dulu rating pemahamanmu (1–5 bintang).');
    setMengirim(true);
    try {
      await kirim('/refleksi', {
        what_learned: belajar,
        what_was_hard: sulit,
        improvement_rating: rating,
      });
      setSelesai(true);
      await Promise.all([muat(), segarkan()]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setGalat(e.message || 'Gagal menyimpan refleksi.');
    } finally {
      setMengirim(false);
    }
  };

  if (galat && !data) return <TataSiswa langkah={10} judul="Refleksi" emoji="🌟"><Galat pesan={galat} onCoba={muat} /></TataSiswa>;
  if (!data) return <TataSiswa langkah={10} judul="Refleksi" emoji="🌟"><Muat /></TataSiswa>;

  const grafik =
    data.grafik ??
    [
      { nama: 'Nilai Kuis Awal', nilai: data.kuisAwal ?? 0 },
      { nama: 'Nilai Kuis Terbaik', nilai: data.kuisTerbaik ?? 0 },
      { nama: 'Pemahaman Akhir', nilai: rating * 20 },
    ];

  return (
    <TataSiswa langkah={10} judul="Form Refleksi" emoji="🌟">
      {selesai && (
        <div className="kartu mb-4 overflow-hidden border-hijau-300 animate-pop">
          <div className="bg-gradient-to-r from-hijau-500 to-kuning-500 p-6 text-center text-white">
            <p className="text-5xl">🎉</p>
            <h2 className="mt-2 text-xl font-extrabold">Selamat!</h2>
            <p className="mt-1 text-sm">Kamu telah menyelesaikan seluruh proyek PjBL SPtLDV!</p>
          </div>
        </div>
      )}

      {/* --------------------------- Grafik banding ---------------------- */}
      <div className="kartu p-5">
        <h2 className="font-extrabold text-oranye-800">📊 Perbandingan Capaianmu</h2>
        <p className="mb-3 text-xs text-oranye-600">
          Rating pemahaman (1–5 bintang) dikonversi ke skala 100 agar bisa dibandingkan dengan nilai kuis.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grafik} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFEDD5" />
              <XAxis dataKey="nama" tick={{ fontSize: 11, fill: '#9A3412' }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9A3412' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '2px solid #FED7AA' }}
                formatter={(v: any) => [`${v}`, 'Nilai']}
              />
              <Bar dataKey="nilai" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="nilai" position="top" fontSize={12} fill="#9A3412" />
                {grafik.map((_: any, i: number) => (
                  <Cell key={i} fill={WARNA[i % WARNA.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ------------------------------ Form ----------------------------- */}
      <div className="kartu mt-4 p-5">
        <h2 className="font-extrabold text-oranye-800">✍️ Ceritakan Pengalamanmu</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="q1">
              1. Apa hal baru yang kamu pelajari dari proyek ini?
            </label>
            <textarea
              id="q1"
              className="isian min-h-[110px]"
              placeholder="Contoh: Aku baru tahu kalau menghitung keuntungan kantin bisa pakai grafik pertidaksamaan…"
              value={belajar}
              onChange={(e) => setBelajar(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="q2">
              2. Apa yang paling sulit dan bagaimana kamu mengatasinya?
            </label>
            <textarea
              id="q2"
              className="isian min-h-[110px]"
              placeholder="Contoh: Paling sulit menentukan ruas kanan. Aku mengatasinya dengan membaca ulang data wawancara dan bertanya ke teman sekelompok…"
              value={sulit}
              onChange={(e) => setSulit(e.target.value)}
            />
          </div>
          <div>
            <label className="label">3. Seberapa baik pemahamanmu tentang SPtLDV sekarang?</label>
            <Bintang nilai={rating} onPilih={setRating} />
          </div>

          {galat && <Pesan jenis="galat">{galat}</Pesan>}

          <button onClick={simpan} disabled={mengirim} className="tombol-hijau w-full text-lg">
            {mengirim ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {selesai ? 'Perbarui Refleksi' : 'Kirim Refleksi'}
          </button>
        </div>
      </div>

      {selesai && (
        <div className="kartu mt-4 p-5 text-center">
          <p className="text-sm text-oranye-700">
            Terima kasih sudah menyelesaikan seluruh rangkaian proyek. Tunjukkan hasil ini kepada gurumu ya! 👩‍🍳
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/beranda" className="tombol-utama">
              🏠 Kembali ke Beranda
            </Link>
            <Link to="/fitur/6" className="tombol-kedua">
              🧮 Lihat Grafik Solusiku
            </Link>
          </div>
        </div>
      )}
    </TataSiswa>
  );
}
