import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { ambil, kirim } from '../../lib/api';
import { useSesi } from '../../lib/sesi';
import { TataGuru } from '../../komponen/Tata';
import { Muat, Pesan } from '../../komponen/UI';

export default function GuruPengaturan() {
  const { segarkan } = useSesi();
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [pesan, setPesan] = useState('');
  const [galat, setGalat] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);

  const muat = async () => {
    const d = await ambil('/guru/pengaturan');
    setData(d);
    setForm({
      nama_proyek: d.pengaturan.nama_proyek || '',
      total_hari: String(d.pengaturan.total_hari || 10),
      tanggal_mulai: d.pengaturan.tanggal_mulai || '',
      video_url: d.pengaturan.video_url || '',
      wajib_lulus_kuis: d.pengaturan.wajib_lulus_kuis || '1',
      batas_jurnal: d.pengaturan.batas_jurnal || '23:59',
    });
  };

  useEffect(() => {
    muat().catch((e) => setGalat(e.message));
  }, []);

  const simpan = async () => {
    setMenyimpan(true);
    setPesan('');
    setGalat('');
    try {
      const r = await kirim('/guru/pengaturan', form);
      setPesan(r.pesan);
      await Promise.all([muat(), segarkan()]);
    } catch (e: any) {
      setGalat(e.message);
    } finally {
      setMenyimpan(false);
    }
  };

  if (!data) return <TataGuru judul="Pengaturan Proyek" emoji="⚙️"><Muat /></TataGuru>;

  const ubah = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <TataGuru judul="Pengaturan Proyek" emoji="⚙️">
      <div className="max-w-2xl space-y-4">
        {pesan && <Pesan jenis="sukses">{pesan}</Pesan>}
        {galat && <Pesan jenis="galat">{galat}</Pesan>}

        <div className="kartu p-5">
          <h2 className="font-extrabold text-oranye-800">📌 Identitas Proyek</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="label">Nama proyek</label>
              <input className="isian" value={form.nama_proyek} onChange={(e) => ubah('nama_proyek', e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Tanggal mulai (WIB)</label>
                <input type="date" className="isian" value={form.tanggal_mulai} onChange={(e) => ubah('tanggal_mulai', e.target.value)} />
              </div>
              <div>
                <label className="label">Jumlah hari proyek</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  className="isian"
                  value={form.total_hari}
                  onChange={(e) => ubah('total_hari', e.target.value)}
                />
              </div>
            </div>
            <p className="rounded-xl bg-oranye-50 p-3 text-xs text-oranye-700">
              Saat ini proyek berjalan pada <strong>hari ke-{data.hari.hariKe}</strong> dari {data.hari.totalHari} ·{' '}
              {data.hari.tanggalTeks}
            </p>
          </div>
        </div>

        <div className="kartu p-5">
          <h2 className="font-extrabold text-oranye-800">🎬 Video Cerita Masalah (Fitur 1)</h2>
          <p className="mb-2 text-xs text-oranye-600">
            Kosongkan untuk memakai cerita bergambar bawaan aplikasi. Isi dengan tautan YouTube atau berkas MP4 bila
            Ibu/Bapak sudah punya video sendiri.
          </p>
          <input
            className="isian"
            placeholder="https://www.youtube.com/watch?v=…"
            value={form.video_url}
            onChange={(e) => ubah('video_url', e.target.value)}
          />
        </div>

        <div className="kartu p-5">
          <h2 className="font-extrabold text-oranye-800">🔐 Aturan Akses & Jurnal</h2>
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-3 rounded-xl bg-oranye-50 p-3">
              <input
                type="checkbox"
                className="h-5 w-5 accent-oranye-500"
                checked={form.wajib_lulus_kuis === '1'}
                onChange={(e) => ubah('wajib_lulus_kuis', e.target.checked ? '1' : '0')}
              />
              <span className="text-sm text-oranye-800">
                <strong>Wajib lulus kuis</strong> (nilai ≥ 70) sebelum fitur proyek 5–10 terbuka
              </span>
            </label>
            <div>
              <label className="label">Batas waktu pengisian jurnal harian</label>
              <input type="time" className="isian w-40" value={form.batas_jurnal} onChange={(e) => ubah('batas_jurnal', e.target.value)} />
            </div>
          </div>
        </div>

        <button onClick={simpan} disabled={menyimpan} className="tombol-utama w-full">
          {menyimpan ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Simpan Pengaturan
        </button>
      </div>
    </TataGuru>
  );
}
