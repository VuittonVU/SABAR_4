# API Jadwal dan Notifikasi

Basis perubahan adalah SABAR_4-main(2).zip tanggal 19 November 2026. Implementasi mengikuti dua poin backend Card 2.1 dan dua poin awal Card 3.3. Nama kolom mengikuti Query Database.txt milik tim. Gunakan JWT login asli pada header Authorization dengan format Bearer.

## Pasang dari ZIP

1. Dari folder repo, pastikan branch yang dipilih adalah branchVuitton. Gabungkan folder backend dan docs pada ZIP ke root repo. Tinjau diff pada file yang sudah diubah rekan tim.
2. Pastikan backend/.env masih berisi konfigurasi milik tim. Jalankan tunnel database jika koneksi tim memerlukannya.
3. Jalankan perintah dari root repo:

```powershell
npm ci --prefix backend
node backend/scripts/migrate-jadwal-notifikasi.cjs
npm run dev --prefix backend
```

Migrasi dijalankan satu kali sebelum endpoint jadwal dipakai, dan aman diulang. Migrasi menambah durasi_menit serta indeks. Jadwal lama tetap disimpan dengan durasi NULL. Saat mengubah jadwal lama tersebut, sertakan durasi_menit yang benar. Skrip mengandalkan tabel dasar dari skema tim yang sudah terpasang.

## Jadwal dosen

| Metode | Path | Respons |
| --- | --- | --- |
| GET | /api/jadwal | 200, daftar milik dosen login |
| GET | /api/jadwal/:idJadwal | 200, detail milik dosen login |
| POST | /api/jadwal | 201, jadwal baru |
| PATCH | /api/jadwal/:idJadwal | 200, jadwal diperbarui |
| DELETE | /api/jadwal/:idJadwal | 200 dengan data null |

POST dan PATCH menerima JSON. Identitas dosen berasal dari JWT dan kolom id_dosen pada request ditolak.

```json
{
  "tanggal": "2026-12-02",
  "jam_mulai": "09:00",
  "jam_selesai": "10:00",
  "ruang": "Ruang Bimbingan",
  "kuota_mhs": 3,
  "durasi_menit": 15,
  "status_jadwal": "Aktif"
}
```

PATCH dapat mengirim sebagian kolom, misalnya {"status_jadwal":"Nonaktif"}. POST memakai status Aktif dan ruang null jika keduanya tidak dikirim. Kuota dan durasi wajib bilangan bulat positif. Format waktu HH:mm atau HH:mm:ss, pada tanggal yang sama, dengan jam selesai setelah jam mulai. Ruang boleh null atau teks maksimal 100 karakter.

Dua jadwal aktif dosen yang sama pada tanggal yang sama tidak boleh beririsan. Sesi yang berakhir tepat saat sesi lain dimulai diperbolehkan. Jadwal nonaktif boleh beririsan, lalu divalidasi lagi saat diaktifkan. Benturan menghasilkan 409. Pilihan status Aktif/Nonaktif adalah kontrak modul ini, cocokkan dengan frontend kelola jadwal tim.

Dosen lain mendapat 404 untuk detail, edit, atau hapus. Mahasiswa dan Admin mendapat 403 pada API jadwal ini. Kuota tidak dapat diturunkan di bawah jumlah peserta terdaftar. Jadwal yang sudah memiliki antrean tidak dapat dihapus agar data sesi tetap terjaga, gunakan status Nonaktif. Perubahan jadwal diteruskan sebagai notifikasi kepada mahasiswa yang sudah punya antrean di jadwal itu.

Mutasi satu dosen diserialisasi dengan kunci baris pengguna. Pemeriksaan jumlah peserta mengunci jadwal. Pengembang pengambilan antrean Card 2.2 perlu mengunci baris jadwal yang sama sebelum memeriksa kuota dan memasukkan antrean agar perubahan kuota dan pendaftaran serentak tetap konsisten.

## Notifikasi

| Metode | Path | Respons |
| --- | --- | --- |
| GET | /api/notifikasi | 200, notifikasi penerima login |
| PATCH | /api/notifikasi/:idNotifikasi/dibaca | 200, notifikasi beserta waktu baca |
| PATCH | /api/notifikasi/dibaca-semua | 200, jumlah_diperbarui |

Daftar memakai limit 50 secara default, maksimum 100. Gunakan ?limit=20&sebelum=ID_TERAKHIR untuk halaman berikutnya. ID dari pg dikirim sebagai string.

PATCH penanda tidak membutuhkan body. Kolom status_dibaca dan waktu_dibaca disimpan di PostgreSQL. Menandai ulang notifikasi yang telah dibaca mempertahankan waktu baca pertama. Menandai semua dibaca hanya memperbarui baris belum dibaca milik penerima tersebut. Notifikasi milik orang lain menghasilkan 404.

Pencatatan pesan dilakukan lewat fungsi internal catatNotifikasi({idPengguna,idAntrian,pesan}, client) di services/notifikasi.service.js. Tidak tersedia endpoint publik untuk mengirim pesan ke pengguna sembarang. Contoh integrasi modul lain:

```js
const transaction = require('../utils/transaction');
const { catatNotifikasi } = require('./notifikasi.service');

await transaction(async (client) => {
    // Jalankan SQL perubahan bisnis yang sudah memeriksa hak akses di sini.
    await catatNotifikasi({
        idPengguna: idPenerimaDariDataSesi,
        idAntrian: idAntreanDariDataSesi,
        pesan: 'Status bimbingan diperbarui.',
    }, client);
});
```

Pemicu yang sudah dipasang adalah perubahan jadwal serta tambah/edit catatan yang berhasil. Pesan catatan dikirim ke mahasiswa pemilik antrean. Kegagalan pencatatan pesan membatalkan perubahan bisnis dalam transaksi yang sama. Modul status antrean yang dibuat rekan tim dapat memakai fungsi internal tersebut setelah transisi status lolos validasi. Pada jadwal baru yang belum memiliki peserta, belum ada notifikasi untuk mahasiswa.

## Pengujian

Telah dijalankan menggunakan PostgreSQL 18.7 lokal terisolasi, fixture dari Query Database.txt tim, migrasi, Express, dan JWT uji. Pemeriksaan mencakup CRUD, pemilik jadwal, input salah, benturan pada request bersamaan, migrasi berulang, jadwal lama, kuota peserta, notifikasi milik sendiri, penanda berulang dan semua dibaca, persistensi lewat koneksi baru, regresi catatan, serta rollback ketika INSERT notifikasi sengaja dibuat gagal.

Untuk menjalankan tes pada PostgreSQL uji milik sendiri:

```powershell
$env:TEST_DATABASE_URL = "postgresql://USER:PASSWORD@HOST:PORT/DATABASE_UJI"
node --test backend/tests/jadwal-notifikasi.test.cjs
Remove-Item Env:TEST_DATABASE_URL
```

Tes membuat schema sementara, memasang fixture, lalu menghapus schema itu setelah selesai. Akun database uji memerlukan izin membuat schema dan fungsi. Tes menggunakan rahasia JWT uji selama prosesnya sendiri. Keluaran error forced-test-failure di tengah pengujian adalah bagian dari simulasi rollback. Hasil akhir harus pass.

## Batas penyerahan

Paket ini berisi backend untuk poin terpilih. UI Kelola Jadwal, daftar jadwal mahasiswa, agregasi riwayat kronologis, dan integrasi halaman notifikasi masih menjadi pekerjaan checklist lain. Database tim yang aktif belum diubah oleh paket ini. Verifikasi migrasi serta perilaku dengan akun dan data uji tim sebelum merge.
