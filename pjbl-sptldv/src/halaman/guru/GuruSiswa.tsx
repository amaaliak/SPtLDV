import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search, Trash2, UserRoundX, Users } from 'lucide-react';
import { ambil, hapus, kirim } from '../../lib/api';
import { TataGuru } from '../../komponen/Tata';
import { Dialog, Galat, Lencana, Muat, Pesan } from '../../komponen/UI';
import { waktuWIB } from '../../lib/format';

export default function GuruSiswa() {
  const [data, setData] = useState<any>(null);
  const [galat, setGalat] = useState('');
  const [pesan, setPesan] = useState('');
  const [cari, setCari] = useState('');
  const [proses, setProses] = useState<number | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<any>(null);

  const muat = async () => {
    try {
      setGalat('');
      setData(await ambil('/guru/siswa'));
    } catch (e: any) {
      setGalat(e.message || 'Gagal memuat data siswa.');
    }
  };

  useEffect(() => {
    muat();
  }, []);

  const pindah = async (id: number, groupId: string) => {
    setProses(id);
    try {
      await kirim(`/guru/siswa/${id}/kelompok`, { group_id: groupId === '' ? null : Number(groupId) });
      setPesan('Penempatan kelompok diperbarui. Siswa perlu memasukkan PIN kelompok barunya.');
      await muat();
      setTimeout(() => setPesan(''), 4000);
    } catch (e: any) {
      setGalat(e.message);
    } finally {
      setProses(null);
    }
  };

  const hapusSiswa = async (id: number) => {
    setProses(id);
    try {
      await hapus(`/guru/siswa/${id}`);
      setKonfirmasi(null);
      setPesan('Data siswa dihapus.');
      await muat();
      setTimeout(() => setPesan(''), 4000);
    } catch (e: any) {
      setGalat(e.message);
    } finally {
      setProses(null);
    }
  };

  if (galat && !data) return <TataGuru judul="Data Siswa" emoji="🧑‍🎓"><Galat pesan={galat} onCoba={muat} /></TataGuru>;
  if (!data) return <TataGuru judul="Data Siswa" emoji="🧑‍🎓"><Muat /></TataGuru>;

  const tersaring = data.siswa.filter((s: any) => s.full_name.toLowerCase().includes(cari.toLowerCase()));

  return (
    <TataGuru judul="Data Siswa" emoji="🧑‍🎓">
      {pesan && (
        <div className="mb-4">
          <Pesan jenis="sukses">{pesan}</Pesan>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="kartu bg-oranye-50 p-4 text-oranye-700">
          <p className="text-xs font-bold uppercase">Total masuk</p>
          <p className="text-2xl font-extrabold">{data.ringkasan.total}</p>
        </div>
        <div className="kartu bg-hijau-50 p-4 text-hijau-700">
          <p className="text-xs font-bold uppercase">Sudah berkelompok</p>
          <p className="text-2xl font-extrabold">{data.ringkasan.sudahKelompok}</p>
        </div>
        <div className="kartu bg-kuning-50 p-4 text-kuning-700">
          <p className="text-xs font-bold uppercase">Belum berkelompok</p>
          <p className="text-2xl font-extrabold">{data.ringkasan.belumKelompok}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-oranye-400" />
          <input
            className="isian py-2 pl-10"
            placeholder="Cari nama siswa…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
        <Link to="/guru/kelompok" className="tombol-utama py-2 text-sm">
          <Users className="h-4 w-4" /> Atur Kelompok & PIN
        </Link>
      </div>

      <div className="kartu mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-oranye-50 text-xs uppercase text-oranye-600">
              <tr>
                <th className="px-4 py-2.5">Nama Lengkap</th>
                <th className="px-4 py-2.5">Kelompok</th>
                <th className="px-4 py-2.5">PIN Masuk</th>
                <th className="px-4 py-2.5">Nilai Kuis</th>
                <th className="px-4 py-2.5">Terakhir Aktif</th>
                <th className="px-4 py-2.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oranye-50">
              {tersaring.map((s: any) => (
                <tr key={s.id} className="hover:bg-oranye-50/40">
                  <td className="whitespace-nowrap px-4 py-2.5 font-bold text-oranye-800">{s.full_name}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={s.group_id ?? ''}
                      onChange={(e) => pindah(s.id, e.target.value)}
                      disabled={proses === s.id}
                      className="rounded-lg border-2 border-oranye-200 px-2 py-1 text-sm"
                    >
                      <option value="">— belum ada —</option>
                      {data.kelompok.map((k: any) => (
                        <option key={k.id} value={k.id}>
                          {k.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    {s.pin_entered ? <Lencana warna="hijau">✅ Sudah</Lencana> : <Lencana warna="abu">⬜ Belum</Lencana>}
                  </td>
                  <td className="px-4 py-2.5 font-bold tabular-nums">
                    {s.nilai_kuis === null ? <span className="text-oranye-300">—</span> : s.nilai_kuis}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-oranye-500">
                    {s.terakhir_aktif ? waktuWIB(s.terakhir_aktif) : 'belum pernah'}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => setKonfirmasi(s)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      title="Hapus siswa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {tersaring.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-oranye-500">
                    <UserRoundX className="mx-auto mb-2 h-8 w-8 text-oranye-300" />
                    Belum ada siswa yang masuk. Minta siswa membuka halaman utama lalu menuliskan namanya.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog buka={!!konfirmasi} judul="Hapus data siswa?" onTutup={() => setKonfirmasi(null)}>
        <p className="text-sm text-oranye-700">
          Seluruh progres, nilai kuis, jurnal, dan refleksi milik <strong>{konfirmasi?.full_name}</strong> akan ikut
          terhapus dan tidak bisa dikembalikan.
        </p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setKonfirmasi(null)} className="tombol-kedua flex-1">
            Batal
          </button>
          <button
            onClick={() => hapusSiswa(konfirmasi.id)}
            disabled={proses === konfirmasi?.id}
            className="tombol flex-1 bg-red-500 text-white hover:bg-red-600"
          >
            {proses === konfirmasi?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Hapus
          </button>
        </div>
      </Dialog>
    </TataGuru>
  );
}
