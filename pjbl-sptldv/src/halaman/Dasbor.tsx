import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, CheckCircle2, ChevronRight, Lock, Trophy, Users } from 'lucide-react';
import { ambil, kirim } from '../lib/api';
import { fiturTerbuka, useSesi } from '../lib/sesi';
import { FITUR_SISWA } from '../lib/fitur';
import { TataSiswa } from '../komponen/Tata';
import { BilahPersen, Galat, Lencana, Muat, Pesan } from '../komponen/UI';
import { waktuWIB } from '../lib/format';

export default function Dasbor() {
  const { sesi, segarkan } = useSesi();
  const [data, setData] = useState<any>(null);
  const [galat, setGalat] = useState('');

  const muat = async () => {
    try {
      setGalat('');
      setData(await ambil('/siswa/beranda'));
    } catch (e: any) {
      setGalat(e.message || 'Gagal memuat beranda.');
    }
  };

  useEffect(() => {
    muat();
  }, []);

  const bacaNotif = async () => {
    await kirim('/notifikasi/baca');
    await Promise.all([muat(), segarkan()]);
  };

  if (galat) return <TataSiswa judul="Beranda" emoji="🏠"><Galat pesan={galat} onCoba={muat} /></TataSiswa>;
  if (!data) return <TataSiswa judul="Beranda" emoji="🏠"><Muat /></TataSiswa>;

  const selesai = FITUR_SISWA.filter((f) => data.progres?.[f.no]).length;
  const persen = Math.round((selesai / FITUR_SISWA.length) * 100);
  const notifBaru = (data.notifikasi || []).filter((n: any) => !n.read_at);

  return (
    <TataSiswa judul={`Halo, ${data.siswa.nama.split(' ')[0]}! 👋`} lebar="lebar">
      {/* --------------------------- Ringkasan --------------------------- */}
      <div className="kartu overflow-hidden">
        <div className="bg-gradient-to-r from-oranye-500 to-kuning-500 p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wide opacity-90">Proyek Kelompok</p>
          <h2 className="mt-0.5 text-lg font-extrabold leading-snug">{data.namaProyek}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 font-semibold">
              <CalendarDays className="h-4 w-4" /> Hari ke-{data.hari.hariKe} dari {data.hari.totalHari}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 font-semibold">
              <Users className="h-4 w-4" /> {data.kelompok?.name ?? 'Belum ada kelompok'}
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-1.5 flex items-center justify-between text-sm font-bold text-oranye-800">
            <span>Kemajuan belajarmu</span>
            <span>
              {selesai}/{FITUR_SISWA.length} langkah · {persen}%
            </span>
          </div>
          <BilahPersen persen={persen} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RingkasKecil
              emoji="📝"
              label="Nilai kuis"
              nilai={data.kuis.terbaik !== null ? `${data.kuis.terbaik}` : '—'}
              warna={data.kuis.lulus ? 'hijau' : 'kuning'}
            />
            <RingkasKecil emoji="🍳" label="Wawancara" nilai={data.status.wawancara ? 'Selesai' : 'Belum'} warna={data.status.wawancara ? 'hijau' : 'kuning'} />
            <RingkasKecil
              emoji="🧮"
              label="Model SPtLDV"
              nilai={data.status.pertidaksamaan.selesai ? 'Tepat' : `${data.status.pertidaksamaan.percobaan}x coba`}
              warna={data.status.pertidaksamaan.selesai ? 'hijau' : 'kuning'}
            />
            <RingkasKecil
              emoji="🗓️"
              label="Jurnal"
              nilai={`${data.status.jurnal.terisi}/${data.status.jurnal.target}`}
              warna={data.status.jurnal.bolong > 0 ? 'merah' : 'hijau'}
            />
          </div>
        </div>
      </div>

      {/* ------------------------- Peringatan jurnal --------------------- */}
      {sesi?.level === 2 && !data.status.jurnal.hariIniTerisi && (
        <div className="mt-4">
          <Pesan jenis="peringatan">
            ⚠️ Kamu belum mengisi jurnal hari ini! Segera isi sebelum pukul {data.hari.batasJurnal}.{' '}
            <Link to="/fitur/7" className="font-bold underline">
              Isi sekarang
            </Link>
          </Pesan>
        </div>
      )}

      {sesi?.level !== 2 && (
        <div className="mt-4">
          <Pesan jenis="info">
            🔑 Fitur proyek (5–10) masih terkunci.{' '}
            <Link to="/pin" className="font-bold underline">
              Masukkan PIN kelompokmu
            </Link>{' '}
            untuk membukanya.
          </Pesan>
        </div>
      )}

      {/* --------------------------- Notifikasi -------------------------- */}
      {notifBaru.length > 0 && (
        <div className="kartu mt-4 border-kuning-300 bg-kuning-50 p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-bold text-kuning-800">
              <Bell className="h-4 w-4" /> Pesan dari Guru ({notifBaru.length})
            </p>
            <button onClick={bacaNotif} className="text-xs font-bold text-kuning-700 underline">
              Tandai sudah dibaca
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {notifBaru.map((n: any) => (
              <li key={n.id} className="rounded-xl bg-white p-3 text-sm text-oranye-800">
                {n.message}
                <span className="mt-0.5 block text-xs text-oranye-400">{waktuWIB(n.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------------------- Kelompok --------------------------- */}
      {data.kelompok && (
        <div className="kartu mt-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-bold text-oranye-800">
              <Users className="h-5 w-5 text-oranye-500" /> {data.kelompok.name}
            </h3>
            <Lencana warna="hijau">
              <Trophy className="h-3 w-3" /> {data.anggota.length} anggota
            </Lencana>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.anggota.map((a: any) => (
              <span
                key={a.id}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  a.id === data.siswa.id ? 'bg-oranye-500 text-white' : 'bg-oranye-50 text-oranye-700'
                }`}
              >
                {a.pin_entered ? '🟢' : '⚪'} {a.full_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------- Daftar fitur -------------------------- */}
      <h2 className="mb-3 mt-6 text-lg font-extrabold text-oranye-800">Langkah Pembelajaran</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {FITUR_SISWA.map((f) => {
          const { boleh, alasan } = fiturTerbuka(sesi, f.no);
          const sudah = !!data.progres?.[f.no];
          return (
            <Link
              key={f.no}
              to={boleh ? f.jalur : '/pin'}
              className={`kartu flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lembut ${
                !boleh ? 'opacity-70' : ''
              } ${sudah ? 'border-hijau-200 bg-hijau-50/40' : ''}`}
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-oranye-50 text-2xl">{f.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-oranye-400">LANGKAH {f.no}</span>
                  {sudah && <Lencana warna="hijau"><CheckCircle2 className="h-3 w-3" /> Selesai</Lencana>}
                  {!boleh && <Lencana warna="kuning"><Lock className="h-3 w-3" /> Terkunci</Lencana>}
                </div>
                <p className="truncate font-bold text-oranye-800">{f.nama}</p>
                <p className="truncate text-xs text-oranye-600">{boleh ? f.ringkas : alasan}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-oranye-300" />
            </Link>
          );
        })}
      </div>
    </TataSiswa>
  );
}

function RingkasKecil({
  emoji,
  label,
  nilai,
  warna,
}: {
  emoji: string;
  label: string;
  nilai: string;
  warna: 'hijau' | 'kuning' | 'merah';
}) {
  const kelas = { hijau: 'bg-hijau-50 text-hijau-700', kuning: 'bg-kuning-50 text-kuning-700', merah: 'bg-red-50 text-red-700' }[warna];
  return (
    <div className={`rounded-xl p-3 text-center ${kelas}`}>
      <div className="text-xl">{emoji}</div>
      <p className="mt-0.5 text-xs font-semibold opacity-80">{label}</p>
      <p className="text-sm font-extrabold">{nilai}</p>
    </div>
  );
}
