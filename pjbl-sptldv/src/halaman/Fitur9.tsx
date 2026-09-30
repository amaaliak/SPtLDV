import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileUp, Loader2, UploadCloud } from 'lucide-react';
import { ambil, kirimBerkas } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { TataSiswa } from '../komponen/Tata';
import { Galat, Muat, Pesan } from '../komponen/UI';
import { waktuWIB } from '../lib/format';

const FORMAT = [
  { nilai: 'Laporan Tertulis', emoji: '📄', ket: 'PDF / DOC / DOCX' },
  { nilai: 'Infografis', emoji: '📊', ket: 'PNG / PDF' },
  { nilai: 'Presentasi', emoji: '📑', ket: 'PPT / PPTX / PDF' },
  { nilai: 'Video', emoji: '🎥', ket: 'MP4, maksimal 5 menit' },
  { nilai: 'Booklet', emoji: '📖', ket: 'PDF' },
  { nilai: 'Lainnya', emoji: '🎨', ket: 'Tulis sendiri formatnya' },
];

export default function Fitur9() {
  const { segarkan } = useSesi();
  const [data, setData] = useState<any>(null);
  const [galat, setGalat] = useState('');
  const [pesan, setPesan] = useState('');
  const [format, setFormat] = useState('');
  const [formatLain, setFormatLain] = useState('');
  const [catatan, setCatatan] = useState('');
  const [berkas, setBerkas] = useState<File | null>(null);
  const [mengirim, setMengirim] = useState(false);

  const muat = async () => {
    try {
      setGalat('');
      const d = await ambil('/portofolio');
      setData(d);
      if (d.data) {
        const bawaan = FORMAT.find((f) => f.nilai === d.data.format_type);
        setFormat(bawaan ? d.data.format_type : 'Lainnya');
        if (!bawaan) setFormatLain(d.data.format_type);
        setCatatan(d.data.notes || '');
      }
    } catch (e: any) {
      setGalat(e.message || 'Gagal memuat portofolio.');
    }
  };

  useEffect(() => {
    muat();
  }, []);

  const unggah = async () => {
    setGalat('');
    setPesan('');
    const formatAkhir = format === 'Lainnya' ? formatLain.trim() : format;
    if (!formatAkhir) {
      setGalat('Pilih dulu format portofolio kelompokmu.');
      return;
    }
    if (!berkas) {
      setGalat('Pilih berkas yang akan diunggah.');
      return;
    }
    if (berkas.size > (data?.maksUkuran ?? 52428800)) {
      setGalat('Ukuran berkas melebihi 50 MB.');
      return;
    }
    setMengirim(true);
    try {
      const form = new FormData();
      form.append('format_type', formatAkhir);
      form.append('notes', catatan);
      form.append('berkas', berkas);
      const r = await kirimBerkas('/portofolio', form);
      setPesan(r.pesan);
      setBerkas(null);
      await Promise.all([muat(), segarkan()]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setGalat(e.message || 'Gagal mengunggah portofolio.');
    } finally {
      setMengirim(false);
    }
  };

  if (galat && !data) return <TataSiswa langkah={9} judul="Upload Portofolio" emoji="📤"><Galat pesan={galat} onCoba={muat} /></TataSiswa>;
  if (!data) return <TataSiswa langkah={9} judul="Upload Portofolio" emoji="📤"><Muat /></TataSiswa>;

  return (
    <TataSiswa langkah={9} judul="Upload Portofolio Kelompok" emoji="📤">
      <p className="mb-4 text-sm text-oranye-700">
        Kumpulkan hasil karya kelompokmu dalam format yang kalian pilih sendiri. <strong>Satu berkas per kelompok</strong> —
        unggahan baru akan menggantikan yang lama.
      </p>

      {pesan && (
        <div className="mb-4">
          <Pesan jenis="sukses">{pesan}</Pesan>
        </div>
      )}

      {data.data && (
        <div className="kartu mb-4 border-hijau-300 bg-hijau-50/50 p-4">
          <p className="flex items-center gap-2 font-bold text-hijau-700">
            <CheckCircle2 className="h-5 w-5" /> Portofolio kelompok sudah terkirim
          </p>
          <div className="mt-2 text-sm text-oranye-800">
            <p>
              <strong>Format:</strong> {data.data.format_type}
            </p>
            <p className="truncate">
              <strong>Berkas:</strong>{' '}
              <a href={data.data.file_url} target="_blank" rel="noreferrer" className="font-bold underline">
                {data.data.file_name}
              </a>
            </p>
            {data.data.notes && (
              <p>
                <strong>Catatan:</strong> {data.data.notes}
              </p>
            )}
            <p className="text-xs text-oranye-500">Dikirim {waktuWIB(data.data.created_at)}</p>
          </div>
        </div>
      )}

      {/* --------------------------- Pilih format ------------------------ */}
      <div className="kartu p-5">
        <h2 className="font-extrabold text-oranye-800">1️⃣ Pilih Format Portofolio</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {FORMAT.map((f) => (
            <button
              key={f.nilai}
              onClick={() => setFormat(f.nilai)}
              className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                format === f.nilai ? 'border-oranye-500 bg-oranye-50 shadow-lembut' : 'border-oranye-100 hover:border-oranye-300'
              }`}
            >
              <span className="text-2xl">{f.emoji}</span>
              <span className="min-w-0">
                <span className="block font-bold text-oranye-800">{f.nilai}</span>
                <span className="block text-xs text-oranye-500">{f.ket}</span>
              </span>
            </button>
          ))}
        </div>
        {format === 'Lainnya' && (
          <input
            className="isian mt-3"
            placeholder="Tulis format karyamu, misalnya: Poster, Vlog, Podcast…"
            value={formatLain}
            onChange={(e) => setFormatLain(e.target.value)}
          />
        )}
      </div>

      {/* ------------------------------ Berkas --------------------------- */}
      <div className="kartu mt-4 p-5">
        <h2 className="font-extrabold text-oranye-800">2️⃣ Unggah Berkas</h2>
        <label
          htmlFor="berkas-porto"
          className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-oranye-300 bg-oranye-50/50 p-6 text-center hover:bg-oranye-50"
        >
          <FileUp className="h-8 w-8 text-oranye-500" />
          <span className="font-bold text-oranye-800">{berkas ? berkas.name : 'Ketuk untuk memilih berkas'}</span>
          <span className="text-xs text-oranye-500">
            Maksimal 50 MB · {(data.ekstensiDiizinkan || []).join(', ')}
          </span>
          {berkas && <span className="text-xs text-hijau-600">{(berkas.size / 1024 / 1024).toFixed(2)} MB</span>}
        </label>
        <input
          id="berkas-porto"
          type="file"
          className="sr-only"
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4"
          onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
        />

        <label className="label mt-4" htmlFor="catatan">
          Catatan untuk guru (opsional)
        </label>
        <textarea
          id="catatan"
          className="isian min-h-[90px]"
          placeholder="Contoh: Laporan ini berisi hasil wawancara, model SPtLDV, grafik, dan rekomendasi produksi untuk kantin."
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />

        {galat && (
          <div className="mt-3">
            <Pesan jenis="galat">{galat}</Pesan>
          </div>
        )}

        <button onClick={unggah} disabled={mengirim} className="tombol-hijau mt-4 w-full text-lg">
          {mengirim ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          {data.data ? 'Ganti Portofolio' : 'Kirim Portofolio'}
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link to="/fitur/10" className="tombol-utama flex-1">
          Lanjut: Refleksi Akhir 🌟
        </Link>
        <Link to="/fitur/7" className="tombol-kedua flex-1">
          Isi Jurnal Hari Ini 🗓️
        </Link>
      </div>
    </TataSiswa>
  );
}
