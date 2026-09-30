import { useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, Plus, RefreshCw, Shuffle, Trash2, UserPlus } from 'lucide-react';
import { ambil, hapus, kirim } from '../../lib/api';
import { TataGuru } from '../../komponen/Tata';
import { Dialog, Galat, Muat, Pesan } from '../../komponen/UI';

export default function GuruKelompok() {
  const [data, setData] = useState<any>(null);
  const [galat, setGalat] = useState('');
  const [pesan, setPesan] = useState('');
  const [perKelompok, setPerKelompok] = useState(4);
  const [proses, setProses] = useState('');
  const [disalin, setDisalin] = useState<number | null>(null);
  const [seret, setSeret] = useState<number | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<any>(null);

  const muat = async () => {
    try {
      setGalat('');
      setData(await ambil('/guru/kelompok'));
    } catch (e: any) {
      setGalat(e.message || 'Gagal memuat kelompok.');
    }
  };

  useEffect(() => {
    muat();
  }, []);

  const info = (t: string) => {
    setPesan(t);
    setTimeout(() => setPesan(''), 4000);
  };

  const acak = async (semua: boolean) => {
    setProses('acak');
    try {
      const r = await kirim('/guru/kelompok/acak', { perKelompok, acakUlangSemua: semua });
      info(r.pesan);
      await muat();
    } catch (e: any) {
      setGalat(e.message);
    } finally {
      setProses('');
      setKonfirmasi(null);
    }
  };

  const tambah = async () => {
    setProses('tambah');
    try {
      const r = await kirim('/guru/kelompok', { jumlah: 1 });
      info(r.pesan);
      await muat();
    } catch (e: any) {
      setGalat(e.message);
    } finally {
      setProses('');
    }
  };

  const resetPin = async (id: number) => {
    setProses(`pin-${id}`);
    try {
      const r = await kirim(`/guru/kelompok/${id}/pin`);
      info(`${r.pesan} PIN baru: ${r.pin}`);
      await muat();
    } catch (e: any) {
      setGalat(e.message);
    } finally {
      setProses('');
    }
  };

  const hapusKelompok = async (id: number) => {
    setProses(`hapus-${id}`);
    try {
      await hapus(`/guru/kelompok/${id}`);
      info('Kelompok dihapus. Anggotanya kembali menjadi siswa tanpa kelompok.');
      setKonfirmasi(null);
      await muat();
    } catch (e: any) {
      setGalat(e.message);
    } finally {
      setProses('');
    }
  };

  const gantiNama = async (id: number, nama: string) => {
    try {
      await kirim(`/guru/kelompok/${id}`, { nama }, 'PATCH');
      await muat();
    } catch (e: any) {
      setGalat(e.message);
    }
  };

  const pindahkan = async (siswaId: number, groupId: number | null) => {
    setProses(`siswa-${siswaId}`);
    try {
      await kirim(`/guru/siswa/${siswaId}/kelompok`, { group_id: groupId });
      await muat();
    } catch (e: any) {
      setGalat(e.message);
    } finally {
      setProses('');
      setSeret(null);
    }
  };

  const salin = async (id: number, teks: string) => {
    try {
      await navigator.clipboard.writeText(teks);
      setDisalin(id);
      setTimeout(() => setDisalin(null), 1800);
    } catch {
      info('Salin manual: ' + teks);
    }
  };

  if (galat && !data) return <TataGuru judul="Kelompok & PIN" emoji="👥"><Galat pesan={galat} onCoba={muat} /></TataGuru>;
  if (!data) return <TataGuru judul="Kelompok & PIN" emoji="👥"><Muat /></TataGuru>;

  const daftarPin = data.kelompok.map((k: any) => `${k.name}: ${k.pin}`).join('\n');

  return (
    <TataGuru judul="Manajemen Kelompok & PIN" emoji="👥">
      {pesan && (
        <div className="mb-4">
          <Pesan jenis="sukses">{pesan}</Pesan>
        </div>
      )}
      {galat && (
        <div className="mb-4">
          <Pesan jenis="galat">{galat}</Pesan>
        </div>
      )}

      {/* ---------------------------- Aksi cepat ------------------------ */}
      <div className="kartu p-4">
        <h2 className="font-extrabold text-oranye-800">⚡ Pembagian Kelompok</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="label text-xs">Anggota per kelompok</label>
            <input
              type="number"
              min={2}
              max={8}
              className="isian w-28 py-2 text-center"
              value={perKelompok}
              onChange={(e) => setPerKelompok(Number(e.target.value))}
            />
          </div>
          <button onClick={() => acak(false)} disabled={!!proses} className="tombol-utama py-2.5">
            {proses === 'acak' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
            Acak Otomatis (siswa tanpa kelompok)
          </button>
          <button
            onClick={() => setKonfirmasi({ jenis: 'acak-semua' })}
            disabled={!!proses}
            className="tombol-kedua py-2.5"
          >
            <RefreshCw className="h-4 w-4" /> Acak Ulang Semua
          </button>
          <button onClick={tambah} disabled={!!proses} className="tombol-halus py-2.5">
            <Plus className="h-4 w-4" /> Tambah Kelompok Kosong
          </button>
          {data.kelompok.length > 0 && (
            <button onClick={() => salin(-1, daftarPin)} className="tombol-halus py-2.5">
              {disalin === -1 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Salin Semua PIN
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-oranye-600">
          💡 Di komputer: seret nama siswa untuk memindahkannya antar kelompok. Di ponsel: gunakan menu “Pindahkan ke…”.
        </p>
      </div>

      {/* ------------------------- Tanpa kelompok ----------------------- */}
      <div
        className="kartu mt-4 border-2 border-dashed border-kuning-300 bg-kuning-50/60 p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => seret && pindahkan(seret, null)}
      >
        <h2 className="font-extrabold text-kuning-800">
          🧍 Siswa Tanpa Kelompok ({data.tanpaKelompok.length})
        </h2>
        <p className="text-xs text-kuning-700">Siswa di sini hanya bisa mengakses Fitur 1–4.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.tanpaKelompok.map((s: any) => (
            <ChipSiswa
              key={s.id}
              siswa={s}
              kelompok={data.kelompok}
              onSeret={() => setSeret(s.id)}
              onPindah={(gid) => pindahkan(s.id, gid)}
              sibuk={proses === `siswa-${s.id}`}
            />
          ))}
          {data.tanpaKelompok.length === 0 && (
            <p className="text-sm text-kuning-700">🎉 Semua siswa sudah masuk kelompok.</p>
          )}
        </div>
      </div>

      {/* --------------------------- Kartu kelompok --------------------- */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.kelompok.map((k: any) => (
          <div
            key={k.id}
            className="kartu p-4 transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => seret && pindahkan(seret, k.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <input
                defaultValue={k.name}
                onBlur={(e) => e.target.value !== k.name && gantiNama(k.id, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border-2 border-transparent px-1 py-0.5 font-extrabold text-oranye-800 hover:border-oranye-200 focus:border-oranye-400"
                aria-label="Nama kelompok"
              />
              <button
                onClick={() => setKonfirmasi({ jenis: 'hapus', kelompok: k })}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                title="Hapus kelompok"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-xl bg-oranye-50 p-3">
              <KeyRound className="h-5 w-5 shrink-0 text-oranye-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase text-oranye-500">PIN Kelompok</p>
                <p className="font-mono text-2xl font-extrabold tracking-[0.3em] text-oranye-800">{k.pin}</p>
              </div>
              <button
                onClick={() => salin(k.id, k.pin)}
                className="rounded-lg bg-white p-2 text-oranye-600 shadow-kartu"
                title="Salin PIN"
              >
                {disalin === k.id ? <Check className="h-4 w-4 text-hijau-600" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={() => resetPin(k.id)}
                disabled={proses === `pin-${k.id}`}
                className="rounded-lg bg-white p-2 text-oranye-600 shadow-kartu"
                title="Reset PIN"
              >
                {proses === `pin-${k.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </button>
            </div>

            <p className="mt-3 text-xs font-bold text-oranye-500">ANGGOTA ({k.anggota.length})</p>
            <div className="mt-1.5 flex min-h-[48px] flex-wrap gap-2">
              {k.anggota.map((s: any) => (
                <ChipSiswa
                  key={s.id}
                  siswa={s}
                  kelompok={data.kelompok}
                  aktif={k.id}
                  onSeret={() => setSeret(s.id)}
                  onPindah={(gid) => pindahkan(s.id, gid)}
                  sibuk={proses === `siswa-${s.id}`}
                />
              ))}
              {k.anggota.length === 0 && (
                <p className="flex items-center gap-1 text-xs text-oranye-400">
                  <UserPlus className="h-3.5 w-3.5" /> Seret nama siswa ke sini
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.kelompok.length === 0 && (
        <div className="kartu mt-4 p-8 text-center">
          <p className="text-4xl">👥</p>
          <h3 className="mt-2 font-bold text-oranye-800">Belum ada kelompok</h3>
          <p className="mt-1 text-sm text-oranye-600">
            Tekan <strong>Acak Otomatis</strong> untuk membagi siswa yang sudah masuk, atau buat kelompok kosong lalu
            seret nama siswa ke dalamnya.
          </p>
        </div>
      )}

      {/* ----------------------------- Dialog --------------------------- */}
      <Dialog
        buka={!!konfirmasi}
        judul={konfirmasi?.jenis === 'hapus' ? 'Hapus kelompok?' : 'Acak ulang semua kelompok?'}
        onTutup={() => setKonfirmasi(null)}
      >
        {konfirmasi?.jenis === 'hapus' ? (
          <>
            <p className="text-sm text-oranye-700">
              Kelompok <strong>{konfirmasi.kelompok.name}</strong> akan dihapus. Data wawancara, percobaan
              pertidaksamaan, dan portofolio kelompok ini ikut terhapus. Anggotanya kembali menjadi siswa tanpa
              kelompok.
            </p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setKonfirmasi(null)} className="tombol-kedua flex-1">
                Batal
              </button>
              <button
                onClick={() => hapusKelompok(konfirmasi.kelompok.id)}
                className="tombol flex-1 bg-red-500 text-white hover:bg-red-600"
              >
                Hapus
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-oranye-700">
              Semua kelompok yang ada akan dibubarkan dan dibentuk ulang secara acak dengan{' '}
              <strong>{perKelompok} anggota</strong> per kelompok. Data wawancara, percobaan pertidaksamaan, dan
              portofolio milik kelompok lama akan terhapus.
            </p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setKonfirmasi(null)} className="tombol-kedua flex-1">
                Batal
              </button>
              <button onClick={() => acak(true)} className="tombol-utama flex-1">
                <Shuffle className="h-4 w-4" /> Ya, acak ulang
              </button>
            </div>
          </>
        )}
      </Dialog>
    </TataGuru>
  );
}

/* ----------------------------- Chip siswa ------------------------------ */

function ChipSiswa({
  siswa,
  kelompok,
  aktif,
  onSeret,
  onPindah,
  sibuk,
}: {
  siswa: any;
  kelompok: any[];
  aktif?: number;
  onSeret: () => void;
  onPindah: (gid: number | null) => void;
  sibuk: boolean;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="relative">
      <button
        draggable
        onDragStart={onSeret}
        onClick={() => setMenu((m) => !m)}
        className={`inline-flex cursor-grab items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition active:cursor-grabbing ${
          aktif ? 'bg-oranye-100 text-oranye-800 hover:bg-oranye-200' : 'bg-white text-oranye-700 shadow-kartu'
        }`}
      >
        {sibuk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>{siswa.pin_entered ? '🟢' : '⚪'}</span>}
        {siswa.nama}
      </button>
      {menu && (
        <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-xl border border-oranye-100 bg-white p-2 shadow-lg">
          <p className="px-2 py-1 text-[11px] font-bold uppercase text-oranye-400">Pindahkan ke…</p>
          {kelompok
            .filter((k) => k.id !== aktif)
            .map((k) => (
              <button
                key={k.id}
                onClick={() => {
                  setMenu(false);
                  onPindah(k.id);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-oranye-50"
              >
                {k.name}
              </button>
            ))}
          {aktif && (
            <button
              onClick={() => {
                setMenu(false);
                onPindah(null);
              }}
              className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Keluarkan dari kelompok
            </button>
          )}
        </div>
      )}
    </div>
  );
}
