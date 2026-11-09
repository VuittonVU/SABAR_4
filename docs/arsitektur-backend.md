# Struktur Backend SABAR

Frontend SABAR menggunakan React.js dan backend menggunakan Express.js. Kode backend dibagi menjadi empat bagian supaya tiap anggota tim tahu di mana menaruh kode yang mereka kerjakan.

1. Router dan Controller  
   Lokasi folder: backend/src/routes/ dan backend/src/controllers/  
   Router menentukan controller yang menangani permintaan dari frontend. Controller memanggil service, lalu mengirim hasilnya kembali ke frontend.

2. Autentikasi dan Otorisasi  
   Lokasi folder: backend/src/middlewares/  
   Bagian ini mengecek siapa pengguna yang sedang login dan apakah dia punya izin untuk mengakses data atau melakukan tindakan tertentu.

3. Service  
   Lokasi folder: backend/src/services/  
   Bagian ini menangani aturan sistem, seperti mengecek sisa kuota dan memastikan mahasiswa belum punya antrean aktif pada jadwal yang sama.

4. Data Access  
   Lokasi folder: backend/src/db/  
   Bagian ini membaca dan menyimpan data ke database, misalnya membaca jadwal bimbingan dan menyimpan data antrean.

Contohnya, saat mahasiswa menekan tombol Ambil Antrean, frontend mengirim ID jadwal ke backend. Backend mengecek login dan izin mahasiswa, lalu service memeriksa kuota dan antrean aktif. Kalau syaratnya terpenuhi, data antrean disimpan dan nomornya ditampilkan ke mahasiswa.
