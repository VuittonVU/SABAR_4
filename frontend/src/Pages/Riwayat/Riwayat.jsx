
import { useRef, useState } from "react";
import { SidebarDosen } from "../../Components/SidebarDosen.jsx";
import "./style.css";

export const Riwayat = ({ onNavigate }) => {

  // =====================================
  // DATA DUMMY RIWAYAT BIMBINGAN
  // =====================================

  const [daftarRiwayat, setDaftarRiwayat] = useState([
    {
      id: 1,
      tanggal: "2026-10-30",
      kode: "A-03",
      nama: "Vuitton Valtuon",
      status: "Selesai",
      waktu: "09.12 Menunggu → 10.03 Dipanggil → 10.20 Selesai",
      catatan: "Perjelas metode dan diagram penelitian.",
      bab: "Bab 3",
      versi: [
        {
          id: 1,
          versi: "v2",
          namaFile: "Bab_3_Revisi_v2.pdf",
          tanggal: "2026-10-30",
          ringkasan: "Metode diperjelas, diagram perlu revisi",
          ukuran: "2.4 MB",
        },
        {
          id: 2,
          versi: "v1",
          namaFile: "Bab_3_Awal.docx",
          tanggal: "2026-10-23",
          ringkasan: "Draft awal Bab 3",
          ukuran: "1.8 MB",
        },
      ],
    },
    {
      id: 2,
      tanggal: "2026-10-23",
      kode: "A-03",
      nama: "Vuitton Valtuon",
      status: "Selesai",
      waktu: "09.00 Menunggu → 09.30 Dipanggil → 10.00 Selesai",
      catatan: "Perbaiki susunan metodologi penelitian.",
      bab: "Bab 3",
      versi: [
        {
          id: 1,
          versi: "v1",
          namaFile: "Bab_3_Awal.docx",
          tanggal: "2026-10-23",
          ringkasan: "Draft awal Bab 3",
          ukuran: "1.8 MB",
        },
      ],
    },
    {
      id: 3,
      tanggal: "2026-10-15",
      kode: "A-03",
      nama: "Vuitton Valtuon",
      status: "Selesai",
      waktu: "10.00 Menunggu → 10.15 Dipanggil → 10.45 Selesai",
      catatan: "Lengkapi latar belakang dan rumusan masalah.",
      bab: "Bab 1",
      versi: [
        {
          id: 1,
          versi: "v1",
          namaFile: "Bab_1_Revisi.docx",
          tanggal: "2026-10-15",
          ringkasan: "Draft Bab 1",
          ukuran: "1.2 MB",
        },
      ],
    },
    {
      id: 4,
      tanggal: "2026-10-28",
      kode: "A-05",
      nama: "Rafi Fauzan",
      status: "Selesai",
      waktu: "13.00 Menunggu → 13.20 Dipanggil → 14.00 Selesai",
      catatan: "Tambahkan referensi penelitian terdahulu.",
      bab: "Bab 2",
      versi: [
        {
          id: 1,
          versi: "v1",
          namaFile: "Bab_2_Revisi.pdf",
          tanggal: "2026-10-28",
          ringkasan: "Penambahan referensi",
          ukuran: "2.1 MB",
        },
      ],
    },
  ]);

  // =====================================
  // STATE HALAMAN
  // =====================================

  // list   = daftar riwayat
  // detail = detail revisi dan catatan

  const [tampilan, setTampilan] = useState("list");

  // ID riwayat yang sedang dipilih
  const [riwayatTerpilih, setRiwayatTerpilih] = useState(null);

  // Referensi input file
  const inputFileRef = useRef(null);

  // =====================================
  // FORMAT TANGGAL
  // =====================================

  const formatTanggal = (tanggal) => {
    const [tahun, bulan, hari] = tanggal.split("-");

    const tanggalObj = new Date(
      Number(tahun),
      Number(bulan) - 1,
      Number(hari)
    );

    return tanggalObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Format tanggal singkat untuk tabel
  const formatTanggalSingkat = (tanggal) => {
    const tanggalObj = new Date(tanggal + "T00:00:00");

    return tanggalObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
    });
  };

  // =====================================
  // FORMAT UKURAN FILE
  // =====================================

  const formatUkuranFile = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // =====================================
  // MEMBUKA DETAIL RIWAYAT
  // =====================================

  const handleBukaDetail = (riwayat) => {
    setRiwayatTerpilih(riwayat.id);
    setTampilan("detail");
  };

  // Mendapatkan data riwayat yang dipilih
  const riwayatDetail = daftarRiwayat.find(
    (riwayat) => riwayat.id === riwayatTerpilih
  );

  // =====================================
  // KEMBALI KE DAFTAR RIWAYAT
  // =====================================

  const handleKembali = () => {
    setTampilan("list");
    setRiwayatTerpilih(null);
  };

  // =====================================
  // MEMBUKA PEMILIH FILE
  // =====================================

  const handlePilihFile = () => {
    inputFileRef.current?.click();
  };

  // =====================================
  // MENGUNGGAH REVISI BERIKUTNYA
  // =====================================

  const handleUploadRevisi = (e) => {
    const file = e.target.files?.[0];

    if (!file || !riwayatDetail) return;

    // Memeriksa jenis file
    const ekstensiDiizinkan = [
      "pdf",
      "doc",
      "docx",
    ];

    const ekstensiFile = file.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!ekstensiDiizinkan.includes(ekstensiFile)) {
      alert("Format file harus PDF, DOC, atau DOCX.");
      e.target.value = "";
      return;
    }

    // Menentukan nomor versi berikutnya
    const nomorVersiTerbesar = Math.max(
      0,
      ...riwayatDetail.versi.map((item) =>
        Number(item.versi.replace("v", ""))
      )
    );

    const versiBaru = {
      id: Date.now(),
      versi: `v${nomorVersiTerbesar + 1}`,
      namaFile: file.name,
      tanggal: (() => {
        const sekarang = new Date();
        const tahun = sekarang.getFullYear();
        const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
        const hari = String(sekarang.getDate()).padStart(2, "0");

        return `${tahun}-${bulan}-${hari}`;
      })(),
      ringkasan: "Revisi berikutnya telah diunggah.",
      ukuran: formatUkuranFile(file.size),
      file: file,
    };

    // Menambahkan versi baru ke riwayat
    setDaftarRiwayat((riwayatSebelumnya) =>
      riwayatSebelumnya.map((riwayat) =>
        riwayat.id === riwayatTerpilih
          ? {
              ...riwayat,
              versi: [
                versiBaru,
                ...riwayat.versi,
              ],
            }
          : riwayat
      )
    );

    alert("Revisi berhasil ditambahkan.");

    // Mengosongkan input agar file yang sama
    // dapat dipilih kembali jika diperlukan
    e.target.value = "";
  };

  // =====================================
  // TAMPILAN HALAMAN
  // =====================================

  return (
    <div className="halaman-riwayat">

      {/* SIDEBAR */}

      <SidebarDosen
        activePage="riwayat"
        onNavigate={onNavigate}
      />

      {/* KONTEN UTAMA */}

      <main className="konten-riwayat">

        {/* =====================================
            TAMPILAN DAFTAR RIWAYAT
        ===================================== */}

        {tampilan === "list" && (
          <>

            <div className="judul-riwayat">
              Riwayat Bimbingan Dosen
            </div>

            <p className="deskripsi-riwayat">
              Telusuri sesi, perubahan status, dan catatan.
            </p>

            <div className="daftar-riwayat">

              {daftarRiwayat.length > 0 ? (

                daftarRiwayat.map((riwayat) => {

                  const berkasTerbaru = riwayat.versi[0];

                  return (
                    <section
                      className="kartu-riwayat"
                      key={riwayat.id}
                    >

                      {/* INFORMASI UTAMA */}

                      <div className="info-riwayat-utama">

                        <h3>
                          {formatTanggal(riwayat.tanggal)}
                          {" • "}
                          {riwayat.kode}
                          {" • "}
                          {riwayat.status}
                        </h3>

                        <p>
                          {riwayat.nama}
                        </p>

                        <p>
                          {riwayat.waktu}
                        </p>

                        <p>
                          Catatan: {riwayat.catatan}
                        </p>

                        <p>
                          Berkas: {berkasTerbaru?.namaFile}
                          {" • "}
                          {berkasTerbaru?.ukuran}
                        </p>

                      </div>

                      {/* TOMBOL DETAIL */}

                      <div className="aksi-riwayat">

                        <button
                          type="button"
                          className="tombol-detail-riwayat"
                          onClick={() => handleBukaDetail(riwayat)}
                        >
                          Buka detail revisi
                        </button>

                      </div>

                    </section>
                  );
                })

              ) : (

                <p className="riwayat-kosong">
                  Belum ada riwayat bimbingan.
                </p>

              )}

            </div>

          </>
        )}

        {/* =====================================
            TAMPILAN DETAIL REVISI
        ===================================== */}

        {tampilan === "detail" && riwayatDetail && (
          <>

            <div className="judul-riwayat">
              Detail revisi dan catatan
            </div>

            <p className="deskripsi-riwayat">
              {riwayatDetail.bab}
              {" • "}
              Sesi {formatTanggal(riwayatDetail.tanggal)}
            </p>

            {/* INFORMASI BERKAS TERBARU */}

            <section className="kartu-detail-riwayat">

              <h3>
                {riwayatDetail.versi[0]?.namaFile || "Belum ada berkas"}
              </h3>

              <p>
                Versi {riwayatDetail.versi[0]?.versi || "-"}
                {" • "}
                {riwayatDetail.versi[0]?.ukuran || "-"}
                {" • "}
                Diunggah {formatTanggal(riwayatDetail.versi[0]?.tanggal || riwayatDetail.tanggal)}
              </p>

              <p>
                Terkait antrean {riwayatDetail.kode}
                {" • "}
                Bimbingan selesai
              </p>

            </section>

            {/* CATATAN DOSEN */}

            <section className="kartu-catatan-riwayat">

              <h3>
                Arahan Dr. Jhon Doe
              </h3>

              <ol>
                <li>
                  {riwayatDetail.catatan}
                </li>
                <li>
                  Perhatikan kembali format penulisan laporan.
                </li>
                <li>
                  Periksa konsistensi isi dan referensi penelitian.
                </li>
              </ol>

              <p className="waktu-catatan">
                Ditulis {formatTanggal(riwayatDetail.tanggal)}
                {" • "}
                Mahasiswa hanya dapat membaca.
              </p>

            </section>

            {/* TABEL RIWAYAT VERSI */}

            <section className="kartu-versi-riwayat">

              <h3 className="judul-tabel-versi">
                Riwayat versi berkas
              </h3>

              <div className="tabel-versi-wrapper">

                <table className="tabel-versi">

                  <thead>
                    <tr>
                      <th>Versi</th>
                      <th>Tanggal</th>
                      <th>Ringkasan</th>
                    </tr>
                  </thead>

                  <tbody>

                    {riwayatDetail.versi.map((versi) => (

                      <tr key={versi.id}>

                        <td>
                          {versi.versi}
                          {" • "}
                          {versi.namaFile.split(".").pop().toUpperCase()}
                        </td>

                        <td>
                          {formatTanggalSingkat(versi.tanggal)}
                        </td>

                        <td>
                          {versi.ringkasan}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </section>

            {/* INPUT FILE TERSEMBUNYI */}

            <input
              ref={inputFileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="input-file-riwayat"
              onChange={handleUploadRevisi}
            />

            {/* TOMBOL AKSI */}

            <div className="aksi-detail-riwayat">

              <button
                type="button"
                className="tombol-upload-riwayat"
                onClick={handlePilihFile}
              >
                Unggah revisi berikutnya
              </button>

              <button
                type="button"
                className="tombol-kembali-riwayat"
                onClick={handleKembali}
              >
                Kembali ke arsip
              </button>

            </div>

          </>
        )}

      </main>
    </div>
  );
};
