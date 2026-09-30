/**
 * FITUR 4 — Bank soal Kuis Otomatis SPtLDV (bertema kuliner / Tata Boga).
 * Kunci jawaban HANYA ada di server. Endpoint soal tidak pernah
 * mengirim `kunci` maupun `pembahasan` sebelum siswa lulus (>= 70).
 */

export interface Soal {
  id: number;
  pertanyaan: string;
  pilihan: string[];
  kunci: number;
  pembahasan: string;
}

export const BANK_SOAL: Soal[] = [
  {
    id: 1,
    pertanyaan:
      'Manakah bentuk berikut yang merupakan pertidaksamaan linear dua variabel?',
    pilihan: ['2x² + 3y ≤ 12', '200x + 150y ≤ 10.000', 'xy ≤ 500', '3x > 9'],
    kunci: 1,
    pembahasan:
      'Pertidaksamaan linear dua variabel memuat dua variabel (x dan y) yang masing-masing berpangkat satu dan tidak saling dikalikan. 200x + 150y ≤ 10.000 memenuhi syarat itu.',
  },
  {
    id: 2,
    pertanyaan:
      'Kantin Tata Boga membuat kue lapis (x) dan risoles (y). Satu kue lapis butuh 200 gram tepung, satu risoles butuh 150 gram tepung. Persediaan tepung 10.000 gram per hari. Model matematikanya adalah…',
    pilihan: [
      '200x + 150y ≥ 10.000',
      '200x + 150y ≤ 10.000',
      '150x + 200y ≤ 10.000',
      '200x − 150y ≤ 10.000',
    ],
    kunci: 1,
    pembahasan:
      'Pemakaian tepung = 200x + 150y dan tidak boleh melebihi persediaan 10.000 gram, sehingga tandanya ≤. Koefisien x memakai kebutuhan produk A (200 gram).',
  },
  {
    id: 3,
    pertanyaan:
      'Waktu membuat 1 loyang brownies 25 menit dan 1 loyang bolu 20 menit. Dapur hanya beroperasi 480 menit per hari. Pertidaksamaan waktunya adalah…',
    pilihan: ['25x + 20y ≤ 480', '25x + 20y ≥ 480', '20x + 25y ≤ 480', '45xy ≤ 480'],
    kunci: 0,
    pembahasan:
      'Total waktu produksi 25x + 20y menit tidak boleh melebihi jam operasional dapur 480 menit, jadi 25x + 20y ≤ 480.',
  },
  {
    id: 4,
    pertanyaan:
      'Mengapa dalam model SPtLDV produksi kue selalu ditambahkan syarat x ≥ 0 dan y ≥ 0?',
    pilihan: [
      'Supaya grafiknya terlihat rapi',
      'Karena banyaknya kue tidak mungkin bernilai negatif',
      'Karena bahan baku selalu habis',
      'Agar titik pojok selalu berjumlah empat',
    ],
    kunci: 1,
    pembahasan:
      'x dan y menyatakan banyaknya produk. Jumlah produk tidak mungkin negatif, sehingga syarat non-negatif x ≥ 0 dan y ≥ 0 wajib ditulis.',
  },
  {
    id: 5,
    pertanyaan:
      'Untuk menentukan daerah penyelesaian 2x + y ≤ 8, kita uji titik (0, 0). Hasil ujinya 0 ≤ 8 (benar). Artinya…',
    pilihan: [
      'Daerah penyelesaian adalah daerah yang TIDAK memuat titik (0, 0)',
      'Daerah penyelesaian adalah daerah yang memuat titik (0, 0)',
      'Titik (0, 0) selalu bukan penyelesaian',
      'Garis 2x + y = 8 digambar putus-putus',
    ],
    kunci: 1,
    pembahasan:
      'Jika titik uji memenuhi pertidaksamaan, maka daerah yang memuat titik uji tersebut merupakan daerah penyelesaian.',
  },
  {
    id: 6,
    pertanyaan:
      'Garis 200x + 150y = 3.000 memotong sumbu Y di titik…',
    pilihan: ['(0, 15)', '(15, 0)', '(0, 20)', '(20, 0)'],
    kunci: 2,
    pembahasan:
      'Titik potong sumbu Y diperoleh saat x = 0, sehingga 150y = 3.000 → y = 20. Jadi titiknya (0, 20).',
  },
  {
    id: 7,
    pertanyaan:
      'Titik pojok dari perpotongan garis x + y = 40 (bahan) dan 2x + y = 60 (waktu) adalah…',
    pilihan: ['(20, 20)', '(10, 30)', '(30, 10)', '(20, 10)'],
    kunci: 0,
    pembahasan:
      'Eliminasi: (2x + y) − (x + y) = 60 − 40 → x = 20. Substitusi ke x + y = 40 → y = 20. Titik pojoknya (20, 20).',
  },
  {
    id: 8,
    pertanyaan:
      'Keuntungan Z = 5.000x + 4.000y diuji pada titik pojok (0,0), (0,30), (20,10), dan (30,0). Keuntungan maksimumnya adalah…',
    pilihan: ['Rp120.000 di (0, 30)', 'Rp140.000 di (20, 10)', 'Rp150.000 di (30, 0)', 'Rp0 di (0, 0)'],
    kunci: 2,
    pembahasan:
      'Z(0,0)=0; Z(0,30)=120.000; Z(20,10)=100.000+40.000=140.000; Z(30,0)=150.000. Nilai terbesar Rp150.000 di titik (30, 0).',
  },
  {
    id: 9,
    pertanyaan:
      'Harga jual satu kotak puding Rp8.000 dengan modal Rp5.000, sedangkan satu kotak klepon dijual Rp6.000 dengan modal Rp3.500. Fungsi tujuan untuk keuntungan maksimum adalah…',
    pilihan: [
      'Z = 8.000x + 6.000y',
      'Z = 5.000x + 3.500y',
      'Z = 3.000x + 2.500y',
      'Z = 13.000x + 9.500y',
    ],
    kunci: 2,
    pembahasan:
      'Keuntungan = harga jual − modal. Puding: 8.000 − 5.000 = 3.000. Klepon: 6.000 − 3.500 = 2.500. Jadi Z = 3.000x + 2.500y.',
  },
  {
    id: 10,
    pertanyaan:
      'Pada grafik SPtLDV, garis pembatas digambar PUTUS-PUTUS apabila…',
    pilihan: [
      'Tanda pertidaksamaan < atau > (tanpa sama dengan)',
      'Tanda pertidaksamaan ≤ atau ≥',
      'Daerah penyelesaian berada di bawah garis',
      'Garis melalui titik (0, 0)',
    ],
    kunci: 0,
    pembahasan:
      'Tanda < atau > berarti titik pada garis TIDAK termasuk penyelesaian, sehingga garis digambar putus-putus. Tanda ≤ atau ≥ digambar garis penuh.',
  },
];

export const TOTAL_SOAL = BANK_SOAL.length;
export const NILAI_LULUS = 70;

/** Soal untuk siswa — tanpa kunci & pembahasan. */
export function soalUntukSiswa() {
  return BANK_SOAL.map(({ id, pertanyaan, pilihan }) => ({ id, pertanyaan, pilihan }));
}

/** Penilaian di server. Skala 0–100. */
export function nilaiKuis(jawaban: Record<string, number>) {
  let benar = 0;
  const rincian = BANK_SOAL.map((s) => {
    const dipilih = jawaban[String(s.id)];
    const tepat = dipilih === s.kunci;
    if (tepat) benar++;
    return { id: s.id, dipilih: dipilih ?? null, benar: tepat };
  });
  const skor = Math.round((benar / TOTAL_SOAL) * 100);
  return { benar, skor, lulus: skor >= NILAI_LULUS, rincian };
}
