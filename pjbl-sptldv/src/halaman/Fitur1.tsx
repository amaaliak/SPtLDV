import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ambil, kirim } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { TataSiswa } from '../komponen/Tata';
import { Pesan } from '../komponen/UI';
import PemutarCerita from '../komponen/PemutarCerita';

const BARIS_DATA = [
  { nama: 'Tepung terigu', satuan: 'gram', a: '200', b: '150', tersedia: '6.000', emoji: '🌾' },
  { nama: 'Telur', satuan: 'butir', a: '1', b: '2', tersedia: '40', emoji: '🥚' },
  { nama: 'Waktu produksi', satuan: 'menit', a: '30', b: '10', tersedia: '450 (7,5 jam)', emoji: '⏰' },
];

const BARIS_UANG = [
  { nama: 'Harga jual', a: 'Rp15.000', b: 'Rp8.000', emoji: '🏷️' },
  { nama: 'Modal bahan', a: 'Rp9.000', b: 'Rp5.000', emoji: '💸' },
  { nama: 'Keuntungan', a: 'Rp6.000', b: 'Rp3.000', emoji: '💰' },
];

function embedYouTube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function Fitur1() {
  const { status, sesi, segarkan } = useSesi();
  const [selesai, setSelesai] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    ambil('/siswa/beranda')
      .then((d) => setSelesai(!!d.progres?.[1]))
      .catch(() => {});
  }, [sesi?.siswa?.id]);

  const tandaiSelesai = async () => {
    setMenyimpan(true);
    try {
      await kirim('/siswa/progres', { fitur: 1, selesai: true });
      setSelesai(true);
      setPesan('Bagus! Kamu sudah menonton cerita masalahnya. Lanjut ke Modul Materi ya 📚');
      await segarkan();
    } finally {
      setMenyimpan(false);
    }
  };

  const url = status?.pengaturan.video_url || '';
  const yt = url ? embedYouTube(url) : null;

  return (
    <TataSiswa langkah={1} judul="Video & Cerita Masalah" emoji="🎬">
      <p className="mb-4 text-sm text-oranye-700">
        Tonton cerita berikut sampai selesai. Perhatikan <strong>batasan bahan</strong> dan{' '}
        <strong>batasan waktu</strong> di dapur kantin — data inilah yang akan kamu ubah menjadi model matematika.
      </p>

      {/* ------------------------------ Video ---------------------------- */}
      {url ? (
        <div className="overflow-hidden rounded-2xl border-2 border-oranye-200 bg-black">
          {yt ? (
            <iframe
              src={yt}
              title="Video Cerita Masalah SPtLDV"
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={url} controls className="aspect-video w-full" />
          )}
        </div>
      ) : (
        <PemutarCerita />
      )}

      {/* --------------------------- Tabel data -------------------------- */}
      <div className="kartu mt-5 overflow-hidden">
        <div className="border-b border-oranye-100 bg-oranye-50 px-4 py-3">
          <h2 className="font-extrabold text-oranye-800">📋 Data Dapur Kantin Hari Ini</h2>
          <p className="text-xs text-oranye-600">
            x = banyaknya <strong>Kue Lapis</strong> · y = banyaknya <strong>Risoles</strong>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-white text-left text-xs uppercase tracking-wide text-oranye-500">
                <th className="px-4 py-3">Kebutuhan</th>
                <th className="px-4 py-3">🍰 Kue Lapis (x)</th>
                <th className="px-4 py-3">🥟 Risoles (y)</th>
                <th className="px-4 py-3">Tersedia / hari</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oranye-50">
              {BARIS_DATA.map((r) => (
                <tr key={r.nama} className="hover:bg-oranye-50/50">
                  <td className="px-4 py-3 font-semibold text-oranye-800">
                    {r.emoji} {r.nama} <span className="text-xs font-normal text-oranye-500">({r.satuan})</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-oranye-700">{r.a}</td>
                  <td className="px-4 py-3 tabular-nums text-oranye-700">{r.b}</td>
                  <td className="px-4 py-3 font-bold tabular-nums text-hijau-600">{r.tersedia}</td>
                </tr>
              ))}
              {BARIS_UANG.map((r) => (
                <tr key={r.nama} className="bg-kuning-50/40">
                  <td className="px-4 py-3 font-semibold text-oranye-800">
                    {r.emoji} {r.nama}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-oranye-700">{r.a}</td>
                  <td className="px-4 py-3 tabular-nums text-oranye-700">{r.b}</td>
                  <td className="px-4 py-3 text-xs text-oranye-400">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------------- Pertanyaan pemantik --------------------- */}
      <div className="kartu mt-4 border-kuning-200 bg-kuning-50 p-5">
        <h3 className="font-extrabold text-kuning-800">🤔 Pertanyaan Pemantik</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm text-kuning-900">
          <li>Kalau kantin hanya membuat Kue Lapis, paling banyak berapa porsi yang bisa dibuat?</li>
          <li>Bahan atau waktu — mana yang lebih dulu habis?</li>
          <li>Apakah membuat produk yang untungnya paling besar selalu paling menguntungkan?</li>
        </ol>
        <p className="mt-3 text-xs text-kuning-700">
          Diskusikan dengan kelompokmu. Jawabannya akan kamu temukan sendiri di Fitur 3 dan Fitur 6.
        </p>
      </div>

      {pesan && (
        <div className="mt-4">
          <Pesan jenis="sukses">{pesan}</Pesan>
        </div>
      )}

      {/* ---------------------------- Tindakan --------------------------- */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button onClick={tandaiSelesai} disabled={menyimpan || selesai} className="tombol-hijau flex-1">
          {menyimpan ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          {selesai ? 'Sudah Ditonton ✓' : 'Saya Sudah Menonton'}
        </button>
        <Link to="/fitur/2" className="tombol-utama flex-1">
          Lanjut: Modul Materi 📚
        </Link>
      </div>
    </TataSiswa>
  );
}
