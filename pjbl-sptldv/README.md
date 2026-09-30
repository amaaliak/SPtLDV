# 🧁 PjBL SPtLDV — Tata Boga

Aplikasi web **Pembelajaran Berbasis Proyek (Project-Based Learning)** untuk materi
**Sistem Pertidaksamaan Linear Dua Variabel (SPtLDV)** pada siswa **SMK Tata Boga**.

Seluruh antarmuka berbahasa Indonesia, dirancang *mobile-first*, dan seluruh data
tersimpan di **Cloudflare D1 + R2** (tidak ada satu pun data di `localStorage`).

> Proyek nyata yang dipakai sebagai konteks: **“Kantin Tata Boga — kombinasi produksi paling untung.”**
> Siswa mewawancarai pengelola kantin, menyusun model matematika, menggambar daerah
> penyelesaian, lalu menentukan kombinasi produksi dengan keuntungan maksimum.

---

## 1. Tumpukan Teknologi

| Lapisan | Teknologi |
|---|---|
| Antarmuka | React 18 + TypeScript + Vite 5 |
| Gaya | Tailwind CSS (palet kuliner hangat) |
| Ikon | Lucide React |
| Grafik statistik | Recharts |
| Grafik matematika | **SVG buatan sendiri** (`src/komponen/BidangKoordinat.tsx`) — tanpa GeoGebra |
| Backend | Cloudflare Workers + Hono (TypeScript) |
| Basis data | Cloudflare D1 (SQLite) |
| Penyimpanan berkas | Cloudflare R2 |
| Hosting | Cloudflare Pages + Pages Functions |

Satu aplikasi Hono (`worker/src/app.ts`) dipakai oleh **tiga pintu masuk**:

```
functions/api/[[path]].ts   → Cloudflare Pages Functions (mode produksi)
worker/index.ts             → Worker mandiri (opsional, wrangler.worker.toml)
dev/server.mjs              → server lokal Node (tiruan D1 + R2) untuk pengembangan
```

---

## 2. Menjalankan Secara Lokal

```bash
bash mulai.sh       # cara tercepat: pasang dependensi bila perlu, isi data contoh, lalu jalankan
```

atau secara manual:

```bash
npm install
npm run db:seed     # isi data contoh (opsional, sangat disarankan untuk demo)
npm run dev         # API di :8787  +  web di :5173
```

Buka <http://localhost:5173>.

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Jalankan API lokal + Vite bersamaan |
| `npm run dev:web` | Hanya Vite (proxy `/api` ke `:8787`) |
| `npm run dev:api` | Hanya API lokal (tiruan D1 di `dev/.data/pjbl.sqlite`, R2 di `dev/.data/r2/`) |
| `npm run db:seed` | Isi ulang basis data lokal dengan data contoh |
| `npm run db:reset` | Kosongkan basis data → aplikasi kembali ke layar **setup guru** |
| `npm run build` | Pemeriksaan tipe + build produksi ke `dist/` |
| `npm run dev:cf` | Pratinjau dengan `wrangler pages dev` (memerlukan D1/R2 lokal wrangler) |

### Akun demo (setelah `npm run db:seed`)

| Peran | Cara masuk |
|---|---|
| **Guru** | `/guru/masuk` → kata sandi **`guru123`** |
| **Siswa** | `/masuk` → ketik nama saja, misalnya **`Andi Pratama Wijaya`** |
| **PIN kelompok** | Kelompok 1 = `2468` · Kelompok 2 = `1357` · Kelompok 3 = `9753` |

Dua siswa (*Galih Ramadhan*, *Zahra Aulia*) sengaja dibiarkan **tanpa kelompok** agar
alur “Kamu belum memiliki kelompok. Minta PIN ke gurumu.” dapat dicoba.

---

## 3. Alur Masuk & Hak Akses

```
Nama lengkap saja  →  Level 1  →  Fitur 1–4 terbuka
PIN kelompok (4 digit)  →  Level 2  →  Fitur 1–10 terbuka
```

* Tidak ada kata sandi untuk siswa — cukup nama lengkap.
* PIN salah **3×** → terkunci **5 menit** (hitung mundur ditampilkan).
* Siswa tanpa kelompok mendapat pesan: *“Kamu belum memiliki kelompok. Minta PIN ke gurumu.”*
* Sesi disimpan pada cookie `pjbl_sesi` (httpOnly) + tabel `sessions` di D1, berlaku 30 hari.
* Guru dapat mewajibkan **lulus kuis ≥ 70** sebelum Fitur 5–10 terbuka (dapat dimatikan di Pengaturan).

---

## 4. Sepuluh Fitur Pembelajaran

| # | Rute | Fitur | Inti |
|---|---|---|---|
| 1 | `/fitur/1` | **Video & Cerita Masalah** | Pemutar cerita 6 adegan beranimasi (buatan sendiri, 25 detik/adegan) + tabel data kantin. Guru boleh menempel tautan video sendiri. |
| 2 | `/fitur/2` | **Modul Materi** | 4 bab: pengertian, tanda & daerah, sistem pertidaksamaan, penerapan kuliner. Setiap bab dicatat tuntas terpisah. |
| 3 | `/fitur/3` | **Grafik Interaktif** | Bidang koordinat SVG buatan sendiri: geser koefisien, tambah/hapus/ganti nama kendala, daerah penyelesaian terarsir, titik pojok dapat diklik, fungsi tujuan & nilai optimum langsung terhitung. |
| 4 | `/fitur/4` | **Kuis** | 10 soal pilihan ganda, timer 15 menit (kirim otomatis), lulus ≥ 70, percobaan tak terbatas, nilai terbaik disimpan, **pembahasan hanya muncul setelah lulus**. |
| 5 | `/fitur/5` | **Form Wawancara** | Sepenuhnya fleksibel: nama produk dapat diubah, baris bahan dapat ditambah/dihapus, satuan bebas, bagian waktu & keuntungan, laba dihitung otomatis. |
| 6 | `/fitur/6` | **Feedback Bertahap** | Siswa menuliskan pertidaksamaannya; sistem **tidak pernah menampilkan jawaban benar**, hanya petunjuk kontekstual (koefisien, arah tanda, satuan, syarat non-negatif, laba vs harga jual). Grafik hadiah muncul hanya bila semua benar. |
| 7 | `/fitur/7` | **Jurnal Harian** | Wajib setiap hari, lampiran ≤ 10 MB ke R2, tampilan kalender 🟩 terisi / 🟥 “Tidak Ada Kemajuan” / 🟨 hari ini, riwayat lengkap. |
| 8 | `/guru/dashboard` | **Dashboard Guru** | Lihat bagian 5. |
| 9 | `/fitur/9` | **Upload Portofolio** | Pilih format (laporan, infografis, presentasi, video, booklet, lainnya), berkas ≤ 50 MB, satu portofolio per kelompok. |
| 10 | `/fitur/10` | **Refleksi** | 3 pertanyaan + penilaian bintang 1–5, diagram batang nilai kuis vs pemahaman, pesan penutup proyek. |

Fitur 8 tidak muncul di menu siswa; `/fitur/8` otomatis dialihkan ke dashboard guru.

### Contoh kasus yang dipakai sepanjang Fitur 1–3

| | Kue Lapis (x) | Risoles (y) | Persediaan |
|---|---|---|---|
| Tepung | 200 g | 150 g | 6.000 g |
| Telur | 1 butir | 2 butir | 40 butir |
| Waktu | 30 menit | 10 menit | 450 menit |
| Keuntungan | Rp6.000 | Rp3.000 | — |

Model: `200x + 150y ≤ 6000`, `x + 2y ≤ 40`, `30x + 10y ≤ 450`, `x ≥ 0`, `y ≥ 0`
dengan `Z = 6000x + 3000y`.
Titik pojok (0,0)=0 · (15,0)=90.000 · **(10,15)=105.000 ← maksimum** · (0,20)=60.000.
Kendala tepung sengaja dibuat longgar (tidak mengikat) sebagai bahan diskusi.

---

## 5. Panel Guru

| Rute | Isi |
|---|---|
| `/admin/setup` | Pendaftaran guru pertama kali (nama, kata sandi, nama kelas) |
| `/guru/masuk` | Masuk dengan kata sandi |
| `/guru/dashboard` (alias `/dashboard/guru`) | Ringkasan + tabel **per siswa**, bukan per kelompok |
| `/guru/siswa` (alias `/admin/siswa`) | Semua siswa, pencarian, pindah kelompok, hapus siswa |
| `/guru/kelompok` (alias `/admin/kelompok`) | Kelompok, PIN, “Acak Otomatis”, seret-dan-lepas |
| `/guru/pengaturan` | Nama proyek, tanggal mulai, jumlah hari, tautan video, wajib lulus kuis, batas jam jurnal |

Dashboard menampilkan:

* kartu ringkasan (kelompok, siswa, hari ke-*n* dari *N*, rata-rata kuis);
* status tiap siswa 🟢 aktif / 🟡 tertinggal 1–2 hari / 🔴 tertinggal ≥ 3 hari atau tidak aktif;
* panel **“Perlu Perhatian”** + tombol **Kirim Pengingat** (muncul sebagai notifikasi di dasbor siswa);
* matriks **kalender jurnal** seluruh siswa, klik sel untuk membaca isi jurnal & lampirannya;
* **riwayat percobaan pertidaksamaan** tiap kelompok beserta petunjuk yang pernah diberikan sistem;
* diagram distribusi status (Recharts).

Manajemen kelompok mendukung: pembuatan kelompok berisi 4 siswa, **Acak Otomatis**
(hanya siswa tanpa kelompok, atau acak ulang seluruhnya), **seret-dan-lepas** nama
siswa antar kelompok di desktop dengan **menu “Pindahkan ke…”** sebagai alternatif di
ponsel, PIN 4 digit otomatis & unik, salin PIN, reset PIN, ganti nama, hapus kelompok.

> Mereset PIN atau memindahkan siswa otomatis menurunkan sesi siswa tersebut ke Level 1,
> sehingga ia harus memasukkan PIN barunya.

---

## 6. Struktur Berkas

```
schema.sql                 skema D1 (14 tabel)
wrangler.toml              konfigurasi Cloudflare Pages (binding DB + R2)
wrangler.worker.toml       konfigurasi Worker mandiri (opsional)
shared/linear.ts           mesin program linear (titik pojok, daerah penyelesaian, nilai optimum)
worker/src/
  app.ts                   seluruh rute API (Hono)
  routes/auth.ts           sesi, masuk siswa, PIN, setup & masuk guru
  routes/siswa.ts          beranda, modul, kuis, wawancara, jurnal, portofolio, refleksi
  routes/guru.ts           dashboard, siswa, kelompok, pengingat, pengaturan
  quiz.ts  grader.ts       bank soal & penilai petunjuk Fitur 6
src/
  komponen/BidangKoordinat.tsx   bidang kartesius SVG interaktif
  komponen/PemutarCerita.tsx     pemutar cerita 6 adegan
  komponen/Tata.tsx              kerangka siswa (sidebar/bottom-nav) & guru
  halaman/Fitur1..Fitur10.tsx    sepuluh fitur
  halaman/guru/*.tsx             panel guru
dev/server.mjs             server API lokal (tiruan D1 & R2)
dev/seed.mjs               data contoh
public/gambar/adegan-*.png ilustrasi cerita
```

---

## 7. Penerapan ke Cloudflare

### 7.1 Siapkan D1 dan R2

```bash
npx wrangler login
npx wrangler d1 create pjbl-sptldv
npx wrangler r2 bucket create pjbl-sptldv-berkas
```

Salin `database_id` hasil perintah di atas ke **`wrangler.toml`**:

```toml
[[d1_databases]]
binding = "DB"
database_name = "pjbl-sptldv"
database_id = "ISI_DENGAN_ID_ANDA"   # ← ganti

[[r2_buckets]]
binding = "R2"
bucket_name = "pjbl-sptldv-berkas"
```

### 7.2 Jalankan skema

```bash
npm run db:local     # wrangler d1 execute pjbl-sptldv --local  --file=./schema.sql
npm run db:remote    # wrangler d1 execute pjbl-sptldv --remote --file=./schema.sql
```

### 7.3 Terbitkan

```bash
npm run build
npm run deploy       # wrangler pages deploy dist --project-name=pjbl-sptldv
```

Pastikan pada dasbor Cloudflare Pages → *Settings → Functions* binding **`DB`** (D1) dan
**`R2`** (R2) sudah terpasang untuk environment *production*. Setelah situs terbit, buka
`/admin/setup` sekali untuk membuat akun guru.

Alternatif tanpa Pages: `npm run deploy:worker` menerbitkan `worker/index.ts`
memakai `wrangler.worker.toml` (aset statis dilayani terpisah).

---

## 8. Ringkasan API

Semua di bawah prefiks `/api`.

| Metode & jalur | Keterangan |
|---|---|
| `GET /status` | Status aplikasi, guru terdaftar, pengaturan, hari ke-*n* |
| `POST /auth/siswa/masuk` `POST /auth/siswa/pin` `POST /auth/keluar` | Masuk nama, verifikasi PIN, keluar |
| `POST /auth/guru/setup` `POST /auth/guru/masuk` | Setup pertama kali & masuk guru |
| `GET /siswa/beranda` | Data dasbor siswa (kelompok, progres, kuis, notifikasi) |
| `POST /siswa/progres` | Tandai fitur/bab selesai |
| `GET|POST /kuis` | Ambil soal / kirim jawaban (nilai terbaik disimpan) |
| `GET|POST /wawancara` | Data wawancara kelompok |
| `GET /pertidaksamaan` · `POST /pertidaksamaan/cek` | Baris yang harus dimodelkan · pemeriksaan **berbasis petunjuk** |
| `GET|POST /jurnal` | Jurnal harian (+ unggah ≤ 10 MB) |
| `GET|POST /portofolio` | Portofolio kelompok (+ unggah ≤ 50 MB) |
| `GET|POST /refleksi` | Refleksi akhir + data grafik |
| `GET /berkas/*` | Unduh berkas dari R2 |
| `GET /guru/dashboard` `/guru/jurnal` `/guru/pertidaksamaan` `/guru/siswa` `/guru/kelompok` | Data panel guru |
| `POST /guru/kelompok` `/guru/kelompok/acak` `/guru/kelompok/:id/pin` `/guru/siswa/:id/kelompok` · `PATCH /guru/kelompok/:id` · `DELETE /guru/kelompok/:id` `/guru/siswa/:id` | Manajemen kelompok & siswa |
| `POST /guru/pengingat` `/guru/pengingat/massal` | Kirim pengingat |
| `GET|POST /guru/pengaturan` | Pengaturan proyek |

---

## 9. Catatan Desain

* **Tanpa `localStorage`.** Identitas hanya lewat cookie sesi httpOnly; seluruh keadaan
  dibaca ulang dari D1 setiap kali halaman dibuka, sehingga siswa dapat berpindah
  perangkat tanpa kehilangan progres.
* **Fitur 6 tidak pernah membocorkan jawaban.** `worker/src/grader.ts` hanya
  mengembalikan `correct: boolean` + kalimat petunjuk; kunci jawaban dihasilkan dari
  data wawancara kelompok itu sendiri, jadi setiap kelompok punya model yang berbeda.
* **Kata sandi guru** disimpan sebagai PBKDF2-SHA256 100.000 iterasi (Web Crypto).
* **Aksesibilitas:** kontras AA, target sentuh ≥ 44 px, navigasi bawah pada ponsel,
  label form eksplisit, status memakai warna **dan** ikon/teks.
* **Palet:** oranye `#F97316`, kuning `#EAB308`, hijau `#22C55E`, krem `#FFF7ED`.
