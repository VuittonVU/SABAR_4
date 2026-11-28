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

Migrasi dijalankan sebelum endpoint dipakai dan aman diulang. Migrasi menambah durasi_menit serta indeks, versi antrean, dan kolom snapshot jadwal pada riwayat status. Jadwal lama tetap disimpan dengan durasi NULL. Saat mengubah jadwal lama tersebut, sertakan durasi_menit yang benar. Skrip mengandalkan tabel dasar dari skema tim yang sudah terpasang.

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

## Status antrean dosen

| Metode | Path | Respons |
| --- | --- | --- |
| GET | /api/antrean/:idAntrian | 200, detail antrean milik dosen login |
| PATCH | /api/antrean/:idAntrian/status | 200, status dan versi terbaru |

Perubahan status hanya dapat dilakukan oleh Dosen pemilik jadwal antrean. Body harus berisi `status_antrian` dan `versi` dari data terakhir yang dibaca. Catatan dan ID jadwal baru bersifat opsional sesuai transisi:

```json
{
  "status_antrian": "Menunggu",
  "versi": 2,
  "id_jadwal_baru": "15",
  "catatan_perubahan": "Dipindahkan ke jadwal berikutnya"
}
```

Transisi yang diizinkan adalah `Menunggu` ke `Dipanggil` atau `Ditunda`, `Dipanggil` ke `Selesai` atau `Ditunda`, lalu `Ditunda` ke `Dijadwalkan Ulang` atau `Menunggu`. Dua transisi terakhir memerlukan ID jadwal baru yang aktif, milik dosen yang sama, berbeda dari jadwal lama, dan masih memiliki kuota. Antrean dipindahkan ke jadwal itu serta mendapat nomor antrean berikutnya. Transisi ilegal, konflik versi lama, atau jadwal penuh menghasilkan 409; request tidak meninggalkan riwayat maupun notifikasi parsial.

Setiap mutasi menaikkan `versi` antrean. Baris `riwayat_status` mencatat status lama/baru, ID pelaku, waktu perubahan, catatan bebas, dan snapshot JSON jadwal lama/baru. Pembaruan antrean, riwayat, dan notifikasi mahasiswa dilakukan dalam transaksi yang sama. Gunakan ulang versi terbaru dari respons untuk perubahan berikutnya.

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

Tes integrasi mencakup CRUD jadwal, transisi status antrean dan versi konflik, penolakan transisi ilegal tanpa riwayat/notifikasi parsial, perpindahan jadwal, migrasi berulang, kepemilikan data, notifikasi, regresi catatan, dan rollback saat pencatatan notifikasi gagal. Jalankan pada PostgreSQL uji dengan perintah berikut:

Untuk menjalankan tes pada PostgreSQL uji milik sendiri:

```powershell
$env:TEST_DATABASE_URL = "postgresql://USER:PASSWORD@HOST:PORT/DATABASE_UJI"
node --test backend/tests/jadwal-notifikasi.test.cjs
Remove-Item Env:TEST_DATABASE_URL
```

Tes membuat schema sementara, memasang fixture, lalu menghapus schema itu setelah selesai. Akun database uji memerlukan izin membuat schema dan fungsi. Tes menggunakan rahasia JWT uji selama prosesnya sendiri. Keluaran error forced-test-failure di tengah pengujian adalah bagian dari simulasi rollback. Hasil akhir harus pass.

## Batas penyerahan

Paket ini berisi backend untuk poin terpilih. UI Kelola Jadwal, daftar jadwal mahasiswa, agregasi riwayat kronologis, dan integrasi halaman notifikasi masih menjadi pekerjaan checklist lain. Database tim yang aktif belum diubah oleh paket ini. Verifikasi migrasi serta perilaku dengan akun dan data uji tim sebelum merge.
