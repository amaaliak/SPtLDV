import {
  PlayCircle,
  BookOpen,
  LineChart,
  ClipboardCheck,
  ClipboardList,
  MessageCircleQuestion,
  NotebookPen,
  LayoutDashboard,
  UploadCloud,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface Fitur {
  no: number;
  nama: string;
  emoji: string;
  ikon: LucideIcon;
  jalur: string;
  ringkas: string;
  tahap: 'Belajar' | 'Proyek';
  siswa: boolean;
}

export const FITUR: Fitur[] = [
  {
    no: 1,
    nama: 'Video & Cerita Masalah',
    emoji: '🎬',
    ikon: PlayCircle,
    jalur: '/fitur/1',
    ringkas: 'Tonton masalah nyata dapur kantin Tata Boga.',
    tahap: 'Belajar',
    siswa: true,
  },
  {
    no: 2,
    nama: 'Modul Materi SPtLDV',
    emoji: '📚',
    ikon: BookOpen,
    jalur: '/fitur/2',
    ringkas: '4 bab materi dengan contoh makanan.',
    tahap: 'Belajar',
    siswa: true,
  },
  {
    no: 3,
    nama: 'Grafik Interaktif',
    emoji: '📈',
    ikon: LineChart,
    jalur: '/fitur/3',
    ringkas: 'Geser slider, lihat daerah penyelesaian bergerak.',
    tahap: 'Belajar',
    siswa: true,
  },
  {
    no: 4,
    nama: 'Kuis Otomatis',
    emoji: '📝',
    ikon: ClipboardCheck,
    jalur: '/fitur/4',
    ringkas: '10 soal, 15 menit, nilai minimal 70.',
    tahap: 'Belajar',
    siswa: true,
  },
  {
    no: 5,
    nama: 'Form Wawancara',
    emoji: '🍳',
    ikon: ClipboardList,
    jalur: '/fitur/5',
    ringkas: 'Catat data produksi hasil wawancara kantin.',
    tahap: 'Proyek',
    siswa: true,
  },
  {
    no: 6,
    nama: 'Feedback Pertidaksamaan',
    emoji: '🧮',
    ikon: MessageCircleQuestion,
    jalur: '/fitur/6',
    ringkas: 'Susun modelmu sendiri, dapatkan petunjuk bertahap.',
    tahap: 'Proyek',
    siswa: true,
  },
  {
    no: 7,
    nama: 'Jurnal Harian',
    emoji: '🗓️',
    ikon: NotebookPen,
    jalur: '/fitur/7',
    ringkas: 'Wajib diisi setiap hari sebelum pukul 23.59.',
    tahap: 'Proyek',
    siswa: true,
  },
  {
    no: 8,
    nama: 'Dashboard Guru',
    emoji: '📊',
    ikon: LayoutDashboard,
    jalur: '/guru/dashboard',
    ringkas: 'Pemantauan progres tiap siswa (khusus guru).',
    tahap: 'Proyek',
    siswa: false,
  },
  {
    no: 9,
    nama: 'Upload Portofolio',
    emoji: '📤',
    ikon: UploadCloud,
    jalur: '/fitur/9',
    ringkas: 'Kirim hasil karya kelompok (1 berkas per kelompok).',
    tahap: 'Proyek',
    siswa: true,
  },
  {
    no: 10,
    nama: 'Refleksi',
    emoji: '🌟',
    ikon: Sparkles,
    jalur: '/fitur/10',
    ringkas: 'Ceritakan pengalaman belajarmu & nilai pemahamanmu.',
    tahap: 'Proyek',
    siswa: true,
  },
];

export const FITUR_SISWA = FITUR.filter((f) => f.siswa);
