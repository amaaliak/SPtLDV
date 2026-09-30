import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FileUp, Loader2, Paperclip, Save } from 'lucide-react';
import { ambil, kirimBerkas } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { TataSiswa } from '../komponen/Tata';
import { Galat, Muat, Pesan } from '../komponen/UI';
import { tanggalPendek, waktuWIB } from '../lib/format';

const WARNA_STATUS: Record<string, string> = {
  terisi: 'bg-hijau-500 text-white',
  kosong: 'bg-red-500 text-white',
  hari_ini: 'bg-kuning-400 text-kuning-900 ring-2 ring-kuning-600',
  belum_mulai: 'bg-oranye-50 text-oranye-300',
};

const LABEL_STATUS: Record<string, string> = {
  terisi: 'Sudah diisi',
  kosong: 'Tidak Ada Kemajuan',
  hari_ini: 'Hari ini — belum diisi',
  belum_mulai: 'Belum tiba',
};

export default function Fitur7() {
  const { segarkan } = useSesi();
  const [data, setData] = useState<any>(null);
  const [galat, setGalat] = useState('');
  const [pesan, setPesan] = useState('');
  const [hariDipilih, setHariDipilih] = useState<number | null>(null);
  const [kegiatan, setKegiatan] = useState('');
  const [kendala, setKendala] = useState('');
  const [berkas, setBerkas] = useState<File | null>(null);
  const [mengirim, setMengirim] = useState(false);

  const muat = async () => {
    try {
      setGalat('');
      const d = await ambil('/jurnal');
      setData(d);
      const hari = hariDipilih ?? d.hari.hariKe;
      setHariDipilih(hari);
      const entri = (d.jurnal || []).find((j: any) => j.day_number === hari);
      setKegiatan(entri?.activity || '');
      setKendala(entri?.obstacle || '');
    } catch (e: any) {
      setGalat(e.message || 'Gagal memuat jurnal.');
    }
  };

  useEffect(() => {
    muat();
  }, []);

  const pilihHari = (h: number) => {
    setHariDipilih(h);
    const entri = (data.jurnal || []).find((j: any) => j.day_number === h);
    setKegiatan(entri?.activity || '');
    setKendala(entri?.obstacle || '');
    setBerkas(null);
    setPesan('');
  };

  const simpan = async () => {
    setGalat('');
    setPesan('');
    if (kegiatan.trim().length < 5) {
      setGalat('Ceritakan dulu apa yang kamu kerjakan hari ini (minimal 5 karakter).');
      return;
    }
    if (berkas && berkas.size > (data?.maksUkuran ?? 10485760)) {
      setGalat('Ukuran berkas melebihi 10 MB.');
      return;
    }
    setMengirim(true);
    try {
      const form = new FormData();
      form.append('activity', kegiatan);
      form.append('obstacle', kendala);
      form.append('day_number', String(hariDipilih ?? data.hari.hariKe));
      if (berkas) form.append('berkas', berkas);
      const r = await kirimBerkas('/jurnal', form);
      setPesan(r.pesan);
      setBerkas(null);
      await Promise.all([muat(), segarkan()]);
    } catch (e: any) {
      setGalat(e.message || 'Gagal menyimpan jurnal.');
    } finally {
      setMengirim(false);
    }
  };

  if (galat && !data) return <TataSiswa langkah={7} judul="Jurnal Harian" emoji="🗓️"><Galat pesan={galat} onCoba={muat} /></TataSiswa>;
  if (!data) return <TataSiswa langkah={7} judul="Jurnal Harian" emoji="🗓️"><Muat /></TataSiswa>;

  const entriTerpilih = (data.jurnal || []).find((j: any) => j.day_number === hariDipilih);
  const bolong = (data.kalender || []).filter((k: any) => k.status === 'kosong');

  return (
    <TataSiswa langkah={7} judul="Jurnal Harian Digital" emoji="🗓️" lebar="lebar">
      {data.perluIsi && (
        <div className="mb-4">
          <Pesan jenis="peringatan">{data.peringatan}</Pesan>
        </div>
      )}
      {bolong.length > 0 && (
        <div className="mb-4">
          <Pesan jenis="galat">
            🔴 Ada {bolong.length} hari bertanda <strong>“Tidak Ada Kemajuan”</strong> (hari ke-
            {bolong.map((b: any) => b.hari).join(', ')}). Kamu masih bisa melengkapinya dengan memilih hari tersebut di
            kalender.
          </Pesan>
        </div>
      )}
      {pesan && (
        <div className="mb-4">
          <Pesan jenis="sukses">{pesan}</Pesan>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* --------------------------- Kalender -------------------------- */}
        <div className="lg:col-span-2">
          <div className="kartu p-4">
            <h2 className="flex items-center gap-2 font-extrabold text-oranye-800">
              <CalendarDays className="h-5 w-5 text-oranye-500" /> Kalender Proyek
            </h2>
            <p className="mb-3 text-xs text-oranye-600">{data.hari.tanggalTeks} · Hari ke-{data.hari.hariKe}</p>
            <div className="grid grid-cols-5 gap-2">
              {data.kalender.map((k: any) => (
                <button
                  key={k.hari}
                  onClick={() => k.status !== 'belum_mulai' && pilihHari(k.hari)}
                  disabled={k.status === 'belum_mulai'}
                  title={`Hari ke-${k.hari} · ${LABEL_STATUS[k.status]}`}
                  className={`aspect-square rounded-xl text-sm font-bold transition ${WARNA_STATUS[k.status]} ${
                    hariDipilih === k.hari ? 'scale-105 ring-2 ring-oranye-600 ring-offset-2' : ''
                  } disabled:cursor-not-allowed`}
                >
                  {k.hari}
                  <span className="block text-[10px] font-normal opacity-80">{tanggalPendek(k.tanggal)}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-xs text-oranye-600">
              <p>🟩 Sudah diisi · 🟥 Tidak Ada Kemajuan</p>
              <p>🟨 Hari ini (wajib diisi sebelum {data.hari.batasJurnal}) · ⬜ Belum tiba</p>
            </div>
          </div>

          {/* Riwayat */}
          {data.jurnal?.length > 0 && (
            <div className="kartu mt-4 overflow-hidden">
              <div className="border-b border-oranye-100 bg-oranye-50 px-4 py-2.5">
                <h3 className="font-bold text-oranye-800">📚 Riwayat Jurnal</h3>
              </div>
              <ul className="divide-y divide-oranye-50">
                {data.jurnal.map((j: any) => (
                  <li key={j.id} className="px-4 py-3">
                    <button onClick={() => pilihHari(j.day_number)} className="w-full text-left">
                      <p className="text-sm font-bold text-oranye-800">Hari ke-{j.day_number}</p>
                      <p className="line-clamp-2 text-xs text-oranye-600">{j.activity}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-oranye-400">
                        <span>{waktuWIB(j.created_at)}</span>
                        {j.file_url && (
                          <span className="inline-flex items-center gap-0.5 text-hijau-600">
                            <Paperclip className="h-3 w-3" /> {j.file_name}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ----------------------------- Form ---------------------------- */}
        <div className="lg:col-span-3">
          <div className="kartu p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold text-oranye-800">
                ✍️ Jurnal Hari ke-{hariDipilih}
                {hariDipilih === data.hari.hariKe ? ' (hari ini)' : ''}
              </h2>
              {entriTerpilih && <span className="lencana bg-hijau-100 text-hijau-700">Sudah ada isian</span>}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="kegiatan">
                  Apa yang kamu kerjakan hari ini?
                </label>
                <textarea
                  id="kegiatan"
                  className="isian min-h-[110px]"
                  placeholder="Contoh: Kelompok kami mewawancarai Bu Sari pengelola kantin dan mencatat kebutuhan tepung untuk kue lapis…"
                  value={kegiatan}
                  onChange={(e) => setKegiatan(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="kendala">
                  Kendala apa yang kamu hadapi?
                </label>
                <textarea
                  id="kendala"
                  className="isian min-h-[90px]"
                  placeholder="Contoh: Kami masih bingung menentukan koefisien untuk batasan telur…"
                  value={kendala}
                  onChange={(e) => setKendala(e.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="berkas">
                  Lampiran (opsional) — foto, dokumen, atau video
                </label>
                <label
                  htmlFor="berkas"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-oranye-200 bg-oranye-50/50 p-4 hover:bg-oranye-50"
                >
                  <FileUp className="h-6 w-6 shrink-0 text-oranye-500" />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-bold text-oranye-800">
                      {berkas ? berkas.name : 'Pilih berkas…'}
                    </span>
                    <span className="block text-xs text-oranye-500">
                      Maks 10 MB · {(data.ekstensiDiizinkan || []).join(', ')}
                    </span>
                  </span>
                </label>
                <input
                  id="berkas"
                  type="file"
                  className="sr-only"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4"
                  onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
                />
                {entriTerpilih?.file_url && !berkas && (
                  <p className="mt-2 text-xs text-oranye-600">
                    Lampiran tersimpan:{' '}
                    <a href={entriTerpilih.file_url} target="_blank" rel="noreferrer" className="font-bold underline">
                      {entriTerpilih.file_name}
                    </a>
                  </p>
                )}
              </div>

              {galat && <Pesan jenis="galat">{galat}</Pesan>}

              <button onClick={simpan} disabled={mengirim} className="tombol-hijau w-full text-lg">
                {mengirim ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {entriTerpilih ? 'Perbarui Jurnal' : 'Simpan Jurnal'}
              </button>
            </div>
          </div>

          <div className="kartu mt-4 border-kuning-200 bg-kuning-50 p-4 text-sm text-kuning-900">
            <p className="font-bold">⏰ Aturan jurnal harian</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1">
              <li>Setiap siswa <strong>wajib</strong> mengisi jurnal setiap hari proyek.</li>
              <li>Jurnal yang tidak diisi sampai pukul {data.hari.batasJurnal} otomatis ditandai merah “Tidak Ada Kemajuan” di dashboard guru.</li>
              <li>Lampirkan foto kegiatan atau dokumen agar bukti kerjamu lebih kuat.</li>
            </ul>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link to="/fitur/9" className="tombol-utama flex-1">
              Lanjut: Upload Portofolio 📤
            </Link>
            <Link to="/beranda" className="tombol-kedua flex-1">
              Kembali ke Beranda 🏠
            </Link>
          </div>
        </div>
      </div>
    </TataSiswa>
  );
}
