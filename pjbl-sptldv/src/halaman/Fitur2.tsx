import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { ambil, kirim } from '../lib/api';
import { useSesi } from '../lib/sesi';
import { TataSiswa } from '../komponen/Tata';
import { BilahPersen, Lencana, Pesan } from '../komponen/UI';
import BidangKoordinat from '../komponen/BidangKoordinat';
import type { Kendala } from '../../shared/linear';
import { rupiah } from '../lib/format';

/* Contoh kanonik yang dipakai di seluruh modul (data dapur kantin) */
const CONTOH: Kendala[] = [
  { a: 200, b: 150, op: '<=', c: 6000, label: 'Tepung' },
  { a: 1, b: 2, op: '<=', c: 40, label: 'Telur' },
  { a: 30, b: 10, op: '<=', c: 450, label: 'Waktu' },
];
const TUJUAN = { a: 6000, b: 3000 };

/* --------------------------- Komponen bantu ---------------------------- */

function Rumus({ children }: { children: ReactNode }) {
  return (
    <div className="my-3 rounded-xl border-2 border-dashed border-oranye-200 bg-oranye-50 px-4 py-3 text-center font-mono text-base font-bold text-oranye-800">
      {children}
    </div>
  );
}

function Sorot({ judul, emoji, children }: { judul: string; emoji: string; children: ReactNode }) {
  return (
    <div className="my-3 rounded-xl bg-kuning-50 p-4">
      <p className="font-bold text-kuning-800">
        {emoji} {judul}
      </p>
      <div className="mt-1 text-sm text-kuning-900">{children}</div>
    </div>
  );
}

/* ------------------------------- Bab-bab ------------------------------- */

const BAB = [
  {
    no: 1,
    kode: 21,
    judul: 'Apa itu Pertidaksamaan Linear?',
    emoji: '📖',
    isi: (
      <div className="space-y-3 text-sm leading-relaxed text-oranye-800">
        <p>
          Di dapur, kita jarang bicara “tepat sama dengan”. Yang sering terdengar justru kalimat{' '}
          <em>“tepungnya jangan lebih dari 6 kilo”</em> atau <em>“minimal buat 10 kotak”</em>. Kalimat-kalimat seperti
          itulah yang dalam matematika disebut <strong>pertidaksamaan</strong>.
        </p>

        <div className="overflow-hidden rounded-xl border border-oranye-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-oranye-50 text-xs uppercase text-oranye-600">
              <tr>
                <th className="px-3 py-2">Kalimat di dapur</th>
                <th className="px-3 py-2">Tanda</th>
                <th className="px-3 py-2">Dibaca</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oranye-50">
              <tr>
                <td className="px-3 py-2">“paling banyak”, “tidak boleh lebih dari”, “tersedia hanya”</td>
                <td className="px-3 py-2 text-center text-lg font-bold">≤</td>
                <td className="px-3 py-2">kurang dari atau sama dengan</td>
              </tr>
              <tr>
                <td className="px-3 py-2">“paling sedikit”, “minimal”, “sekurang-kurangnya”</td>
                <td className="px-3 py-2 text-center text-lg font-bold">≥</td>
                <td className="px-3 py-2">lebih dari atau sama dengan</td>
              </tr>
              <tr>
                <td className="px-3 py-2">“harus kurang dari” (batasnya tidak boleh dicapai)</td>
                <td className="px-3 py-2 text-center text-lg font-bold">&lt;</td>
                <td className="px-3 py-2">kurang dari</td>
              </tr>
              <tr>
                <td className="px-3 py-2">“harus lebih dari”</td>
                <td className="px-3 py-2 text-center text-lg font-bold">&gt;</td>
                <td className="px-3 py-2">lebih dari</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>Pertidaksamaan linear dua variabel</strong> memuat dua besaran yang belum diketahui (x dan y),
          masing-masing berpangkat satu, dan dihubungkan dengan salah satu tanda di atas.
        </p>
        <Rumus>ax + by ≤ c</Rumus>

        <Sorot judul="Contoh dari dapur kita" emoji="🌾">
          Satu <strong>Kue Lapis</strong> menghabiskan 200 gram tepung, satu <strong>Risoles</strong> 150 gram.
          Persediaan tepung hanya 6.000 gram per hari. Jika x = banyaknya Kue Lapis dan y = banyaknya Risoles, maka:
          <Rumus>200x + 150y ≤ 6.000</Rumus>
          Artinya: total tepung yang terpakai tidak boleh melebihi persediaan.
        </Sorot>

        <p>
          Kalau batasannya lebih dari satu (tepung, telur, dan waktu), semua pertidaksamaan itu dikumpulkan menjadi{' '}
          <strong>sistem pertidaksamaan linear dua variabel (SPtLDV)</strong>:
        </p>
        <Rumus>
          200x + 150y ≤ 6.000 <br /> x + 2y ≤ 40 <br /> 30x + 10y ≤ 450 <br /> x ≥ 0 , y ≥ 0
        </Rumus>

        <Sorot judul="Jangan lupa syarat non-negatif!" emoji="🚫">
          x ≥ 0 dan y ≥ 0 wajib ditulis karena kantin tidak mungkin memproduksi kue dalam jumlah negatif.
        </Sorot>
      </div>
    ),
  },
  {
    no: 2,
    kode: 22,
    judul: 'Cara Menggambar Daerah Penyelesaian',
    emoji: '✏️',
    isi: (
      <div className="space-y-3 text-sm leading-relaxed text-oranye-800">
        <p>Ikuti 5 langkah ini untuk setiap pertidaksamaan. Kita pakai contoh telur: x + 2y ≤ 40.</p>
        <ol className="space-y-3">
          {[
            {
              j: 'Ubah tanda menjadi "="',
              d: 'x + 2y ≤ 40 menjadi garis pembatas x + 2y = 40.',
            },
            {
              j: 'Cari dua titik potong sumbu',
              d: 'Saat x = 0 → 2y = 40 → y = 20, dapat titik (0, 20). Saat y = 0 → x = 40, dapat titik (40, 0).',
            },
            {
              j: 'Gambar garisnya',
              d: 'Tanda ≤ atau ≥ digambar garis PENUH (batas ikut termasuk). Tanda < atau > digambar garis PUTUS-PUTUS.',
            },
            {
              j: 'Uji titik (0, 0)',
              d: 'Masukkan ke pertidaksamaan: 0 + 0 = 0 ≤ 40 → BENAR. Berarti daerah yang memuat titik (0,0) adalah daerah penyelesaian.',
            },
            {
              j: 'Arsir daerahnya',
              d: 'Arsir sisi garis yang memuat (0,0). Ulangi untuk semua pertidaksamaan — irisan seluruh arsiran itulah daerah penyelesaian sistem.',
            },
          ].map((l, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-white p-3 shadow-kartu">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-oranye-500 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-oranye-800">{l.j}</p>
                <p className="text-oranye-700">{l.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <Sorot judul="Hasil akhir untuk dapur kantin" emoji="📈">
          Inilah irisan dari ketiga batasan (tepung, telur, waktu) beserta syarat x ≥ 0 dan y ≥ 0. Daerah hijau adalah
          semua kombinasi produksi yang MUNGKIN dilakukan kantin.
        </Sorot>
        <BidangKoordinat
          kendala={CONTOH}
          labelX="x = banyaknya Kue Lapis (porsi)"
          labelY="y = banyaknya Risoles (porsi)"
          tinggi={400}
        />
      </div>
    ),
  },
  {
    no: 3,
    kode: 23,
    judul: 'Cara Mencari Titik Pojok',
    emoji: '📍',
    isi: (
      <div className="space-y-3 text-sm leading-relaxed text-oranye-800">
        <p>
          <strong>Titik pojok</strong> adalah titik sudut daerah penyelesaian. Nilai maksimum atau minimum selalu
          berada di salah satu titik pojok — jadi kita cukup memeriksa titik-titik ini saja.
        </p>
        <p>Titik pojok didapat dari:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>titik (0, 0),</li>
          <li>perpotongan garis pembatas dengan sumbu X dan sumbu Y,</li>
          <li>perpotongan dua garis pembatas.</li>
        </ul>

        <Sorot judul="Contoh: perpotongan batas telur dan batas waktu" emoji="🥚">
          <p className="font-semibold">Garis 1 (telur): x + 2y = 40</p>
          <p className="font-semibold">Garis 2 (waktu): 30x + 10y = 450, disederhanakan menjadi 3x + y = 45</p>
          <p className="mt-2">Dari Garis 2: y = 45 − 3x. Substitusikan ke Garis 1:</p>
          <Rumus>
            x + 2(45 − 3x) = 40 <br /> x + 90 − 6x = 40 <br /> −5x = −50 → x = 10
          </Rumus>
          <p>Substitusi balik: y = 45 − 3(10) = 15. Jadi titik pojoknya (10, 15).</p>
        </Sorot>

        <p>Dengan cara yang sama, seluruh titik pojok daerah penyelesaian kantin adalah:</p>
        <div className="overflow-hidden rounded-xl border border-oranye-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-oranye-50 text-xs uppercase text-oranye-600">
              <tr>
                <th className="px-3 py-2">Titik pojok</th>
                <th className="px-3 py-2">Asalnya</th>
                <th className="px-3 py-2">Arti di dapur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oranye-50">
              <tr>
                <td className="px-3 py-2 font-bold">(0, 0)</td>
                <td className="px-3 py-2">titik awal</td>
                <td className="px-3 py-2">tidak memproduksi apa pun</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-bold">(15, 0)</td>
                <td className="px-3 py-2">batas waktu ∩ sumbu X</td>
                <td className="px-3 py-2">hanya membuat Kue Lapis</td>
              </tr>
              <tr className="bg-kuning-50">
                <td className="px-3 py-2 font-bold">(10, 15)</td>
                <td className="px-3 py-2">batas telur ∩ batas waktu</td>
                <td className="px-3 py-2">campuran kedua produk</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-bold">(0, 20)</td>
                <td className="px-3 py-2">batas telur ∩ sumbu Y</td>
                <td className="px-3 py-2">hanya membuat Risoles</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-oranye-600">
          💡 Ketuk lingkaran hijau pada grafik di Bab 2 atau Fitur 3 untuk melihat koordinat titik pojok secara
          langsung.
        </p>
      </div>
    ),
  },
  {
    no: 4,
    kode: 24,
    judul: 'Cara Menghitung Nilai Optimum (Maksimum/Minimum)',
    emoji: '🏆',
    isi: (
      <div className="space-y-3 text-sm leading-relaxed text-oranye-800">
        <p>
          Langkah terakhir: menghitung <strong>fungsi tujuan</strong>. Karena kantin ingin untung sebesar-besarnya,
          fungsi tujuannya adalah total keuntungan.
        </p>
        <Sorot judul="Hitung keuntungan per porsi dulu!" emoji="💰">
          Keuntungan = harga jual − modal.
          <br />
          Kue Lapis: {rupiah(15000)} − {rupiah(9000)} = <strong>{rupiah(6000)}</strong>
          <br />
          Risoles: {rupiah(8000)} − {rupiah(5000)} = <strong>{rupiah(3000)}</strong>
        </Sorot>
        <Rumus>Z = 6.000x + 3.000y</Rumus>
        <p>Uji setiap titik pojok ke dalam fungsi tujuan:</p>
        <div className="overflow-hidden rounded-xl border border-oranye-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-oranye-50 text-xs uppercase text-oranye-600">
              <tr>
                <th className="px-3 py-2">Titik (x, y)</th>
                <th className="px-3 py-2">Z = 6.000x + 3.000y</th>
                <th className="px-3 py-2">Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oranye-50">
              <tr>
                <td className="px-3 py-2 font-bold">(0, 0)</td>
                <td className="px-3 py-2">6.000(0) + 3.000(0)</td>
                <td className="px-3 py-2">{rupiah(0)}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-bold">(15, 0)</td>
                <td className="px-3 py-2">6.000(15) + 3.000(0)</td>
                <td className="px-3 py-2">{rupiah(90000)}</td>
              </tr>
              <tr className="bg-hijau-50 font-bold text-hijau-700">
                <td className="px-3 py-2">(10, 15)</td>
                <td className="px-3 py-2">6.000(10) + 3.000(15)</td>
                <td className="px-3 py-2">{rupiah(105000)} ⬅ MAKSIMUM</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-bold">(0, 20)</td>
                <td className="px-3 py-2">6.000(0) + 3.000(20)</td>
                <td className="px-3 py-2">{rupiah(60000)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Sorot judul="Kesimpulan" emoji="🎯">
          Kantin sebaiknya membuat <strong>10 Kue Lapis</strong> dan <strong>15 Risoles</strong> per hari agar
          keuntungan maksimum, yaitu <strong>{rupiah(105000)}</strong>. Perhatikan: membuat Kue Lapis saja (untung per
          porsi paling besar) justru TIDAK paling menguntungkan, karena memakan waktu produksi paling lama!
        </Sorot>

        <BidangKoordinat
          kendala={CONTOH}
          tujuan={TUJUAN}
          tampilkanOptimum
          labelX="x = banyaknya Kue Lapis (porsi)"
          labelY="y = banyaknya Risoles (porsi)"
          satuanZ={(n) => rupiah(n)}
          tinggi={400}
        />
      </div>
    ),
  },
];

/* ------------------------------- Halaman ------------------------------- */

export default function Fitur2() {
  const { segarkan } = useSesi();
  const [buka, setBuka] = useState<number | null>(1);
  const [progres, setProgres] = useState<Record<string, boolean>>({});
  const [menyimpan, setMenyimpan] = useState<number | null>(null);

  const muat = async () => {
    try {
      const d = await ambil('/siswa/beranda');
      setProgres(d.progres || {});
    } catch {
      /* diabaikan */
    }
  };

  useEffect(() => {
    muat();
  }, []);

  const tandai = async (kode: number) => {
    setMenyimpan(kode);
    try {
      await kirim('/siswa/progres', { fitur: kode, selesai: true });
      const baru: Record<string, boolean> = { ...progres, [kode]: true };
      setProgres(baru);
      const semua = BAB.every((b) => baru[b.kode]);
      if (semua) {
        await kirim('/siswa/progres', { fitur: 2, selesai: true });
        setProgres({ ...baru, 2: true });
      }
      await segarkan();
    } finally {
      setMenyimpan(null);
    }
  };

  const jumlahSelesai = BAB.filter((b) => progres[b.kode]).length;

  return (
    <TataSiswa langkah={2} judul="Modul Materi SPtLDV" emoji="📚">
      <div className="kartu mb-4 p-4">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-oranye-800">
          <span>Kemajuan membaca</span>
          <span>{jumlahSelesai}/4 bab</span>
        </div>
        <BilahPersen persen={(jumlahSelesai / 4) * 100} />
        <p className="mt-2 text-xs text-oranye-600">
          Semua contoh memakai bahan dan produk kuliner supaya mudah dibayangkan 🍰
        </p>
      </div>

      <div className="space-y-3">
        {BAB.map((b) => {
          const terbuka = buka === b.no;
          const sudah = !!progres[b.kode];
          return (
            <div key={b.no} className={`kartu overflow-hidden ${sudah ? 'border-hijau-200' : ''}`}>
              <button
                onClick={() => setBuka(terbuka ? null : b.no)}
                className="flex w-full items-center gap-3 p-4 text-left"
                aria-expanded={terbuka}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-oranye-50 text-xl">
                  {b.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-oranye-400">BAB {b.no}</span>
                  <span className="block font-bold text-oranye-800">{b.judul}</span>
                </span>
                {sudah && (
                  <Lencana warna="hijau">
                    <CheckCircle2 className="h-3 w-3" /> Selesai
                  </Lencana>
                )}
                <ChevronDown className={`h-5 w-5 shrink-0 text-oranye-400 transition ${terbuka ? 'rotate-180' : ''}`} />
              </button>

              {terbuka && (
                <div className="border-t border-oranye-100 p-4 animate-fade-up">
                  {b.isi}
                  <button
                    onClick={() => tandai(b.kode)}
                    disabled={sudah || menyimpan === b.kode}
                    className={`mt-4 w-full ${sudah ? 'tombol-halus' : 'tombol-hijau'}`}
                  >
                    {menyimpan === b.kode ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    {sudah ? `Bab ${b.no} sudah selesai ✓` : 'Tandai Selesai'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {jumlahSelesai === 4 && (
        <div className="mt-4">
          <Pesan jenis="sukses">
            🎉 Semua bab selesai! Sekarang cobalah sendiri di Grafik Interaktif, lalu ikuti kuis.
          </Pesan>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link to="/fitur/3" className="tombol-utama flex-1">
          Lanjut: Grafik Interaktif 📈
        </Link>
        <Link to="/fitur/4" className="tombol-kedua flex-1">
          Langsung ke Kuis 📝
        </Link>
      </div>
    </TataSiswa>
  );
}
