import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  ChevronDown,
  Loader2,
  RefreshCw,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ambil, kirim } from '../../lib/api';
import { TataGuru } from '../../komponen/Tata';
import { Dialog, Galat, Lencana, Muat, Pesan } from '../../komponen/UI';
import { waktuWIB } from '../../lib/format';

const WARNA_STATUS: Record<string, string> = {
  hijau: 'bg-hijau-100 text-hijau-700',
  kuning: 'bg-kuning-100 text-kuning-700',
  merah: 'bg-red-100 text-red-700',
};
const TITIK: Record<string, string> = { hijau: '🟢', kuning: '🟡', merah: '🔴' };

export default function GuruDasbor() {
  const [tab, setTab] = useState<'ringkas' | 'jurnal' | 'model'>('ringkas');
  const [data, setData] = useState<any>(null);
  const [jurnal, setJurnal] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [galat, setGalat] = useState('');
  const [buka, setBuka] = useState<number[]>([]);
  const [pesan, setPesan] = useState('');
  const [mengirim, setMengirim] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);

  const muat = async () => {
    try {
      setGalat('');
      const d = await ambil('/guru/dashboard');
      setData(d);
      setBuka(d.kelompok.map((k: any) => k.id));
    } catch (e: any) {
      setGalat(e.message || 'Gagal memuat dashboard.');
    }
  };

  useEffect(() => {
    muat();
  }, []);

  useEffect(() => {
    if (tab === 'jurnal' && !jurnal) ambil('/guru/jurnal').then(setJurnal).catch(() => {});
    if (tab === 'model' && !model) ambil('/guru/pertidaksamaan').then(setModel).catch(() => {});
  }, [tab, jurnal, model]);

  const kirimPengingat = async (id: number, nama: string) => {
    setMengirim(id);
    try {
      const r = await kirim('/guru/pengingat', {
        student_id: id,
        pesan: `⏰ Halo ${nama.split(' ')[0]}, gurumu mengingatkan: segera lanjutkan tugas proyek dan isi jurnal harianmu ya!`,
      });
      setPesan(r.pesan);
      setTimeout(() => setPesan(''), 4000);
    } catch (e: any) {
      setGalat(e.message);
    } finally {
      setMengirim(null);
    }
  };

  if (galat && !data) return <TataGuru judul="Dashboard Monitoring" emoji="📊"><Galat pesan={galat} onCoba={muat} /></TataGuru>;
  if (!data) return <TataGuru judul="Dashboard Monitoring" emoji="📊"><Muat /></TataGuru>;

  const semuaSiswa = data.kelompok.flatMap((k: any) => k.anggota).concat(data.tanpaKelompok);
  const hitungStatus = [
    { nama: '🟢 Lancar', jumlah: semuaSiswa.filter((s: any) => s.status.warna === 'hijau').length, warna: '#22C55E' },
    { nama: '🟡 Lambat', jumlah: semuaSiswa.filter((s: any) => s.status.warna === 'kuning').length, warna: '#EAB308' },
    { nama: '🔴 Macet', jumlah: semuaSiswa.filter((s: any) => s.status.warna === 'merah').length, warna: '#EF4444' },
  ];

  return (
    <TataGuru judul="Dashboard Monitoring Guru" emoji="📊">
      {pesan && (
        <div className="mb-4">
          <Pesan jenis="sukses">{pesan}</Pesan>
        </div>
      )}

      {/* ------------------------- Kartu ringkasan ---------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KartuAngka emoji="👥" label="Total Kelompok" nilai={data.ringkasan.totalKelompok} warna="bg-oranye-50 text-oranye-700" />
        <KartuAngka emoji="🧑‍🎓" label="Total Siswa" nilai={data.ringkasan.totalSiswa} warna="bg-kuning-50 text-kuning-700" />
        <KartuAngka
          emoji="📅"
          label="Hari Proyek"
          nilai={`${data.ringkasan.hariKe} / ${data.ringkasan.totalHari}`}
          warna="bg-hijau-50 text-hijau-700"
        />
        <KartuAngka
          emoji="📝"
          label="Rata-rata Kuis"
          nilai={data.ringkasan.rataKuis}
          sub={`${data.ringkasan.lulusKuis} siswa lulus (≥${data.ringkasan.ambangLulus})`}
          warna="bg-oranye-50 text-oranye-700"
        />
      </div>

      {/* ------------------------------ Tab ----------------------------- */}
      <div className="mt-5 flex gap-2 overflow-x-auto">
        {[
          { id: 'ringkas', label: '📋 Progres Siswa' },
          { id: 'jurnal', label: '🗓️ Detail Jurnal' },
          { id: 'model', label: '🧮 Percobaan Model' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === t.id ? 'bg-oranye-500 text-white shadow-lembut' : 'bg-white text-oranye-700 hover:bg-oranye-50'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button onClick={muat} className="ml-auto rounded-xl bg-white px-3 py-2 text-sm font-bold text-oranye-700 hover:bg-oranye-50">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* ---------------------------- RINGKAS --------------------------- */}
      {tab === 'ringkas' && (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="kartu p-4 lg:col-span-1">
              <h3 className="flex items-center gap-2 font-bold text-oranye-800">
                <TrendingUp className="h-4 w-4" /> Sebaran Status Siswa
              </h3>
              <div className="mt-2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hitungStatus} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFEDD5" />
                    <XAxis dataKey="nama" tick={{ fontSize: 11, fill: '#9A3412' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9A3412' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #FED7AA' }} />
                    <Bar dataKey="jumlah" radius={[8, 8, 0, 0]}>
                      <LabelList dataKey="jumlah" position="top" fontSize={12} fill="#9A3412" />
                      {hitungStatus.map((s, i) => (
                        <Cell key={i} fill={s.warna} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Panel peringatan */}
            <div className="kartu border-red-200 bg-red-50/50 p-4 lg:col-span-2">
              <h3 className="flex items-center gap-2 font-bold text-red-700">
                <AlertTriangle className="h-4 w-4" /> Siswa yang perlu perhatian
              </h3>
              {data.perluPerhatian.length === 0 ? (
                <p className="mt-2 text-sm text-hijau-700">🎉 Semua siswa berjalan lancar. Tidak ada yang tertinggal.</p>
              ) : (
                <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                  {data.perluPerhatian.map((s: any) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-oranye-800">🔴 {s.nama}</p>
                        <p className="truncate text-xs text-oranye-600">{s.alasan || 'belum ada aktivitas'}</p>
                      </div>
                      <button
                        onClick={() => kirimPengingat(s.id, s.nama)}
                        disabled={mengirim === s.id}
                        className="tombol-halus px-3 py-1.5 text-xs"
                      >
                        {mengirim === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
                        Kirim Pengingat
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Tabel per kelompok */}
          <div className="mt-4 space-y-3">
            {data.kelompok.map((k: any) => {
              const terbuka = buka.includes(k.id);
              return (
                <div key={k.id} className="kartu overflow-hidden">
                  <button
                    onClick={() => setBuka((b) => (terbuka ? b.filter((x) => x !== k.id) : [...b, k.id]))}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <UsersRound className="h-5 w-5 shrink-0 text-oranye-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-oranye-800">{k.nama}</p>
                      <p className="text-xs text-oranye-500">
                        {k.jumlahAnggota} anggota · PIN {k.pin} · Wawancara {k.wawancara ? '✅' : '❌'} · Model{' '}
                        {k.pertidaksamaan.selesai ? '✅' : `${k.pertidaksamaan.percobaan}x coba`} · Portofolio{' '}
                        {k.portofolio ? '✅' : '❌'}
                      </p>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-oranye-400 transition ${terbuka ? 'rotate-180' : ''}`} />
                  </button>

                  {terbuka && (
                    <div className="overflow-x-auto border-t border-oranye-100">
                      <TabelSiswa anggota={k.anggota} onPengingat={kirimPengingat} mengirim={mengirim} />
                    </div>
                  )}
                </div>
              );
            })}

            {data.tanpaKelompok.length > 0 && (
              <div className="kartu overflow-hidden border-kuning-300">
                <div className="bg-kuning-50 p-4">
                  <p className="font-extrabold text-kuning-800">⚠️ Siswa belum punya kelompok ({data.tanpaKelompok.length})</p>
                  <p className="text-xs text-kuning-700">
                    Siswa ini baru bisa mengakses Fitur 1–4. Bagikan mereka ke kelompok di menu “Kelompok & PIN”.
                  </p>
                </div>
                <div className="overflow-x-auto border-t border-oranye-100">
                  <TabelSiswa anggota={data.tanpaKelompok} onPengingat={kirimPengingat} mengirim={mengirim} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ----------------------------- JURNAL --------------------------- */}
      {tab === 'jurnal' && (
        <div className="mt-4">
          {!jurnal ? (
            <Muat teks="Memuat data jurnal…" />
          ) : (
            <div className="space-y-4">
              <div className="kartu p-3 text-xs text-oranye-600">
                ✅ jurnal terisi · ❌ Tidak Ada Kemajuan · 🟡 hari ini belum diisi · ⬜ belum tiba · Ketuk kotak untuk
                melihat isi jurnal.
              </div>
              {jurnal.kelompok.map((k: any) => (
                <div key={k.id} className="kartu overflow-hidden">
                  <div className="border-b border-oranye-100 bg-oranye-50 px-4 py-2.5">
                    <p className="font-extrabold text-oranye-800">
                      <CalendarDays className="mr-1 inline h-4 w-4" /> {k.nama}
                    </p>
                  </div>
                  <div className="overflow-x-auto p-3">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="text-xs text-oranye-500">
                          <th className="px-2 py-1 text-left">Nama Siswa</th>
                          {(jurnal.kelompok[0]?.anggota[0]?.kalender || []).map((h: any) => (
                            <th key={h.hari} className="px-1 py-1 text-center">
                              H{h.hari}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {k.anggota.map((a: any) => (
                          <tr key={a.id} className="border-t border-oranye-50">
                            <td className="whitespace-nowrap px-2 py-2 font-semibold text-oranye-800">{a.nama}</td>
                            {a.kalender.map((h: any) => {
                              const entri = a.entri.find((e: any) => e.hari === h.hari);
                              return (
                                <td key={h.hari} className="px-1 py-2 text-center">
                                  <button
                                    onClick={() => entri && setDetail({ ...entri, nama: a.nama })}
                                    className="text-base"
                                    title={`Hari ke-${h.hari}`}
                                  >
                                    {h.status === 'terisi' ? '✅' : h.status === 'kosong' ? '❌' : h.status === 'hari_ini' ? '🟡' : '⬜'}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {k.anggota.length === 0 && (
                          <tr>
                            <td className="px-2 py-3 text-sm text-oranye-500">Belum ada anggota.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------ MODEL --------------------------- */}
      {tab === 'model' && (
        <div className="mt-4">
          {!model ? (
            <Muat teks="Memuat riwayat percobaan…" />
          ) : (
            <div className="space-y-3">
              {model.kelompok.map((k: any) => (
                <div key={k.id} className="kartu p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-oranye-800">{k.nama}</p>
                    <Lencana warna={k.selesai ? 'hijau' : k.jumlahPercobaan > 0 ? 'kuning' : 'abu'}>{k.ringkas}</Lencana>
                  </div>
                  {k.riwayat.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {k.riwayat.map((r: any, i: number) => (
                        <details key={i} className="rounded-xl bg-oranye-50 p-3">
                          <summary className="cursor-pointer text-sm font-bold text-oranye-800">
                            Percobaan ke-{r.percobaan} {r.semuaBenar ? '✅' : '❌'} · oleh {r.oleh ?? 'siswa'} ·{' '}
                            {waktuWIB(r.waktu)}
                          </summary>
                          <ul className="mt-2 space-y-1.5 text-sm">
                            {r.baris.map((b: any, j: number) => (
                              <li key={j} className="rounded-lg bg-white p-2">
                                <span className="font-semibold text-oranye-700">{b.label}: </span>
                                <code className="text-oranye-900">{b.input || '(kosong)'}</code>{' '}
                                {b.correct ? '✅' : <span className="text-red-600">❌ {b.hint}</span>}
                              </li>
                            ))}
                            <li className="rounded-lg bg-white p-2">
                              <span className="font-semibold text-oranye-700">Fungsi tujuan: </span>
                              <code className="text-oranye-900">{r.tujuan || '(kosong)'}</code> {r.tujuanBenar ? '✅' : '❌'}
                            </li>
                          </ul>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --------------------------- Dialog jurnal ---------------------- */}
      <Dialog buka={!!detail} judul={detail ? `Jurnal Hari ke-${detail.hari} — ${detail.nama}` : ''} onTutup={() => setDetail(null)}>
        {detail && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold text-oranye-700">Kegiatan</p>
              <p className="text-oranye-800">{detail.kegiatan || '-'}</p>
            </div>
            <div>
              <p className="font-bold text-oranye-700">Kendala</p>
              <p className="text-oranye-800">{detail.kendala || '-'}</p>
            </div>
            {detail.file_url && (
              <div>
                <p className="font-bold text-oranye-700">Lampiran</p>
                <a href={detail.file_url} target="_blank" rel="noreferrer" className="font-bold text-oranye-600 underline">
                  📎 {detail.file_name}
                </a>
              </div>
            )}
            <p className="text-xs text-oranye-400">Dikirim {waktuWIB(detail.waktu)}</p>
          </div>
        )}
      </Dialog>
    </TataGuru>
  );
}

/* ---------------------------- Komponen bantu --------------------------- */

function KartuAngka({
  emoji,
  label,
  nilai,
  sub,
  warna,
}: {
  emoji: string;
  label: string;
  nilai: string | number;
  sub?: string;
  warna: string;
}) {
  return (
    <div className={`kartu p-4 ${warna}`}>
      <p className="text-2xl">{emoji}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-extrabold">{nilai}</p>
      {sub && <p className="text-[11px] opacity-80">{sub}</p>}
    </div>
  );
}

function TabelSiswa({
  anggota,
  onPengingat,
  mengirim,
}: {
  anggota: any[];
  onPengingat: (id: number, nama: string) => void;
  mengirim: number | null;
}) {
  return (
    <table className="w-full min-w-[900px] text-left text-sm">
      <thead className="bg-white text-xs uppercase text-oranye-500">
        <tr>
          <th className="px-3 py-2">Nama</th>
          <th className="px-3 py-2">Login</th>
          <th className="px-3 py-2">PIN</th>
          <th className="px-3 py-2">Kuis</th>
          <th className="px-3 py-2">Wawancara</th>
          <th className="px-3 py-2">Pertidaksamaan</th>
          <th className="px-3 py-2">Jurnal</th>
          <th className="px-3 py-2">Portofolio</th>
          <th className="px-3 py-2">Refleksi</th>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-oranye-50">
        {anggota.map((s: any) => (
          <tr key={s.id} className="hover:bg-oranye-50/40">
            <td className="whitespace-nowrap px-3 py-2.5 font-bold text-oranye-800">{s.nama}</td>
            <td className="px-3 py-2.5 text-xs text-oranye-600">{s.statusLogin}</td>
            <td className="px-3 py-2.5">{s.pinMasuk ? '✅' : '⬜'}</td>
            <td className="px-3 py-2.5">
              {s.kuis.terbaik === null ? (
                <span className="text-oranye-300">—</span>
              ) : (
                <span className={s.kuis.lulus ? 'font-bold text-hijau-600' : 'font-bold text-red-500'}>
                  {s.kuis.terbaik}
                </span>
              )}
              <span className="ml-1 text-[11px] text-oranye-400">({s.kuis.percobaan}x)</span>
            </td>
            <td className="px-3 py-2.5">{s.wawancara ? '✅' : '❌'}</td>
            <td className="px-3 py-2.5">
              {s.pertidaksamaan.selesai ? '✅' : '❌'}{' '}
              <span className="text-[11px] text-oranye-400">({s.pertidaksamaan.percobaan}x coba)</span>
            </td>
            <td className="px-3 py-2.5">
              <span className={s.jurnal.bolong > 0 ? 'font-bold text-red-500' : 'font-bold text-hijau-600'}>
                {s.jurnal.terisi}/{s.jurnal.target}
              </span>
            </td>
            <td className="px-3 py-2.5">{s.portofolio ? '✅' : '❌'}</td>
            <td className="px-3 py-2.5">{s.refleksi ? `⭐ ${s.refleksi.rating}` : '❌'}</td>
            <td className="px-3 py-2.5">
              <span className={`lencana ${WARNA_STATUS[s.status.warna]}`}>
                {TITIK[s.status.warna]} {s.status.teks}
              </span>
            </td>
            <td className="px-3 py-2.5">
              <button
                onClick={() => onPengingat(s.id, s.nama)}
                disabled={mengirim === s.id}
                className="rounded-lg bg-oranye-100 px-2 py-1 text-xs font-bold text-oranye-700 hover:bg-oranye-200"
                title="Kirim pengingat"
              >
                {mengirim === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
              </button>
            </td>
          </tr>
        ))}
        {anggota.length === 0 && (
          <tr>
            <td colSpan={11} className="px-3 py-4 text-center text-sm text-oranye-500">
              Belum ada siswa di kelompok ini.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
