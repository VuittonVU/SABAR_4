
import { useState } from "react";
import { SidebarDosen } from "../../Components/SidebarDosen.jsx";
import "./Style.css";

export const KelolaAntrean = ({ onNavigate }) => {

  // =====================================
  // DATA AWAL ANTREAN
  // =====================================

  const [daftarAntrean, setDaftarAntrean] = useState([
    {
      id: 1,
      nomor: "A-04",
      nama: "Bintang Khalid",
      status: "Selesai",
      berkas: 1,
      tanggal: "2026-11-05",
      jamMulai: "09:00",
      jamSelesai: "09:30",
      catatan: "",
    },
    {
      id: 2,
      nomor: "A-05",
      nama: "Rafi Fauzan",
      status: "Dipanggil",
      berkas: 2,
      tanggal: "2026-11-05",
      jamMulai: "09:30",
      jamSelesai: "10:00",
      catatan: "",
    },
    {
      id: 3,
      nomor: "A-06",
      nama: "Jorio Ebenezer",
      status: "Menunggu",
      berkas: 1,
      tanggal: "2026-11-05",
      jamMulai: "10:00",
      jamSelesai: "10:30",
      catatan: "",
    },
    {
      id: 4,
      nomor: "A-07",
      nama: "Vuitton Varian Utomo",
      status: "Menunggu",
      berkas: 2,
      tanggal: "2026-11-05",
      jamMulai: "10:30",
      jamSelesai: "11:00",
      catatan: "",
    },
    {
      id: 5,
      nomor: "A-08",
      nama: "Anantha Aulia",
      status: "Ditunda",
      berkas: 1,
      tanggal: "2026-11-05",
      jamMulai: "11:00",
      jamSelesai: "11:30",
      catatan: "",
    },
  ]);

  // =====================================
  // STATE TAMPILAN
  // =====================================

  const [tampilan, setTampilan] = useState("list");

  // Antrean yang sedang dipilih
  const [antreanTerpilih, setAntreanTerpilih] = useState(null);

  // Data hasil penyimpanan
  const [dataSukses, setDataSukses] = useState(null);

  // Form catatan
  const [catatanEdit, setCatatanEdit] = useState("");

  // Form jadwal ulang
  const [formJadwal, setFormJadwal] = useState({
    tanggal: "",
    jamMulai: "",
    jamSelesai: "",
  });

  // =====================================
  // FORMAT TANGGAL DAN WAKTU
  // =====================================

  const formatTanggal = (tanggal) => {
    const [tahun, bulan, hari] = tanggal.split("-");

    return new Date(
      Number(tahun),
      Number(bulan) - 1,
      Number(hari)
    ).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatWaktu = (mulai, selesai) => {
    return `${mulai.replace(":", ".")}–${selesai.replace(":", ".")} WIB`;
  };

  // =====================================
  // MEMILIH ANTREAN
  // =====================================

  const handlePilihAntrean = (antrean) => {
    setAntreanTerpilih(
      antreanTerpilih?.id === antrean.id
        ? null
        : antrean
    );

    setCatatanEdit(antrean.catatan);
  };

  // =====================================
  // MEMPERBARUI DATA ANTREAN
  // =====================================

  const perbaruiAntrean = (id, perubahan) => {

    setDaftarAntrean((dataSebelumnya) =>
      dataSebelumnya.map((antrean) =>
        antrean.id === id
          ? { ...antrean, ...perubahan }
          : antrean
      )
    );

    setAntreanTerpilih((antreanSebelumnya) =>
      antreanSebelumnya?.id === id
        ? { ...antreanSebelumnya, ...perubahan }
        : antreanSebelumnya
    );
  };

  // =====================================
  // PERUBAHAN STATUS ANTREAN
  // =====================================

  // Memanggil mahasiswa
  const handlePanggil = () => {
    if (!antreanTerpilih) return;

    perbaruiAntrean(antreanTerpilih.id, {
      status: "Dipanggil",
    });
  };

  // Menyelesaikan sesi bimbingan
  const handleSelesai = () => {
    if (!antreanTerpilih) return;

    perbaruiAntrean(antreanTerpilih.id, {
      status: "Selesai",
    });
  };

  // Menunda antrean
  const handleTunda = () => {
    if (!antreanTerpilih) return;

    perbaruiAntrean(antreanTerpilih.id, {
      status: "Ditunda",
    });
  };

  // =====================================
  // MENYIMPAN CATATAN
  // =====================================

  const handleSimpanCatatan = () => {
    if (!antreanTerpilih) return;

    if (!catatanEdit.trim()) {
      alert("Catatan bimbingan tidak boleh kosong.");
      return;
    }

    const antreanBaru = {
      ...antreanTerpilih,
      catatan: catatanEdit.trim(),
    };

    perbaruiAntrean(antreanTerpilih.id, {
      catatan: catatanEdit.trim(),
    });

    setDataSukses({
      jenis: "catatan",
      antrean: antreanBaru,
    });

    setTampilan("note-success");
  };

  // =====================================
  // MEMBUKA FORM JADWAL ULANG
  // =====================================

  const handleBukaJadwalUlang = () => {
    if (!antreanTerpilih) return;

    setFormJadwal({
      tanggal: "",
      jamMulai: "",
      jamSelesai: "",
    });

    setTampilan("reschedule");
  };

  // Mengubah input jadwal ulang
  const handleChangeJadwal = (e) => {
    const { name, value } = e.target;

    setFormJadwal((formSebelumnya) => ({
      ...formSebelumnya,
      [name]: value,
    }));
  };

  // =====================================
  // MENYIMPAN JADWAL ULANG
  // =====================================

  const handleSimpanJadwalUlang = (e) => {
    e.preventDefault();

    if (
      !formJadwal.tanggal ||
      !formJadwal.jamMulai ||
      !formJadwal.jamSelesai
    ) {
      alert("Semua kolom harus diisi.");
      return;
    }

    if (formJadwal.jamMulai >= formJadwal.jamSelesai) {
      alert("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }

    const antreanBaru = {
      ...antreanTerpilih,
      tanggal: formJadwal.tanggal,
      jamMulai: formJadwal.jamMulai,
      jamSelesai: formJadwal.jamSelesai,
      status: "Menunggu",
    };

    perbaruiAntrean(antreanTerpilih.id, {
      tanggal: formJadwal.tanggal,
      jamMulai: formJadwal.jamMulai,
      jamSelesai: formJadwal.jamSelesai,
      status: "Menunggu",
    });

    setDataSukses({
      jenis: "jadwal",
      antrean: antreanBaru,
    });

    setTampilan("reschedule-success");
  };

  // =====================================
  // KEMBALI KE ANTREAN
  // =====================================

  const handleKembaliAntrean = () => {
    setTampilan("list");
    setAntreanTerpilih(null);
    setDataSukses(null);
    setCatatanEdit("");
  };

  // =====================================
  // RENDER HALAMAN
  // =====================================

  return (
    <div className="halaman-kelola-antrean">

      <SidebarDosen
        activePage="antrean"
        onNavigate={onNavigate}
      />

      <main className="konten-kelola-antrean">

        {/* =================================
            TAMPILAN 1: DAFTAR ANTREAN
        ================================= */}

        {tampilan === "list" && (
          <>
            <div className="header-kelola-antrean">
              <h1>Kelola Antrean dan Catatan</h1>

              <p>
                {formatTanggal("2026-11-05")}
                {" • "}
                Tampilkan {daftarAntrean.length} antrean dari total{" "}
                {daftarAntrean.length} peserta.
              </p>
            </div>

            {/* Ringkasan status */}
            <div className="ringkasan-antrean">
              Menunggu → Dipanggil → Selesai.
              Tunda hanya untuk antrean Menunggu/Dipanggil.
              Jadwalkan ulang hanya dari antrean Ditunda.
            </div>

            {/* Tabel antrean */}
            <section className="tabel-antrean">

              <div className="baris-antrean header-tabel-antrean">
                <span>Nomor / Mahasiswa</span>
                <span>Status</span>
                <span>Berkas</span>
              </div>

              {daftarAntrean.map((antrean) => (
                <div
                  key={antrean.id}
                  className={`baris-antrean ${
                    antreanTerpilih?.id === antrean.id
                      ? "antrean-terpilih"
                      : ""
                  }`}
                  onClick={() => handlePilihAntrean(antrean)}
                >
                  <span className="nama-antrean">
                    {antrean.nomor} • {antrean.nama}
                  </span>

                  <span
                    className={`status-antrean status-${antrean.status.toLowerCase()}`}
                  >
                    {antrean.status}
                  </span>

                  <span>
                    {antrean.berkas} berkas
                  </span>
                </div>
              ))}

            </section>

            {/* Panel detail mahasiswa */}
            {antreanTerpilih && (
              <section className="panel-detail-antrean">

                <h2>
                  Antrean terpilih • {antreanTerpilih.nomor} •{" "}
                  {antreanTerpilih.nama}
                </h2>

                <p className="informasi-detail-antrean">
                  Berkas: {antreanTerpilih.berkas} berkas
                  {" • "}
                  {formatTanggal(antreanTerpilih.tanggal)}
                  {" • "}
                  {formatWaktu(
                    antreanTerpilih.jamMulai,
                    antreanTerpilih.jamSelesai
                  )}
                </p>

                {/* Tombol tindakan sesuai status */}
                <div className="aksi-status-antrean">

                  {antreanTerpilih.status === "Menunggu" && (
                    <>
                      <button
                        type="button"
                        className="tombol-aksi-utama"
                        onClick={handlePanggil}
                      >
                        Panggil Mahasiswa
                      </button>

                      <button
                        type="button"
                        className="tombol-aksi-sekunder"
                        onClick={handleTunda}
                      >
                        Tunda Antrean
                      </button>
                    </>
                  )}

                  {antreanTerpilih.status === "Dipanggil" && (
                    <>
                      <button
                        type="button"
                        className="tombol-aksi-utama"
                        onClick={handleSelesai}
                      >
                        Selesaikan Sesi
                      </button>

                      <button
                        type="button"
                        className="tombol-aksi-sekunder"
                        onClick={handleTunda}
                      >
                        Tunda Antrean
                      </button>
                    </>
                  )}

                  {antreanTerpilih.status === "Ditunda" && (
                    <button
                      type="button"
                      className="tombol-aksi-utama"
                      onClick={handleBukaJadwalUlang}
                    >
                      Jadwalkan Ulang
                    </button>
                  )}

                  {antreanTerpilih.status === "Selesai" && (
                    <span className="keterangan-status-selesai">
                      Sesi bimbingan telah selesai.
                    </span>
                  )}

                </div>

                {/* Input catatan */}
                <div className="form-catatan-antrean">

                  <label htmlFor="catatan-bimbingan">
                    Catatan Bimbingan
                  </label>

                  <textarea
                    id="catatan-bimbingan"
                    value={catatanEdit}
                    onChange={(e) => setCatatanEdit(e.target.value)}
                    placeholder="Tuliskan catatan hasil bimbingan..."
                    rows={3}
                  />

                </div>

                <button
                  type="button"
                  className="tombol-simpan-catatan"
                  onClick={handleSimpanCatatan}
                >
                  Simpan Catatan
                </button>

              </section>
            )}
          </>
        )}

        {/* =================================
            TAMPILAN 2: JADWALKAN ULANG
        ================================= */}

        {tampilan === "reschedule" && antreanTerpilih && (
          <>
            <div className="header-kelola-antrean">
              <h1>Jadwalkan Ulang Antrean</h1>

              <p>
                Pindahkan antrean Ditunda ke jadwal yang tersedia.
              </p>
            </div>

            <form
              className="form-jadwal-ulang"
              onSubmit={handleSimpanJadwalUlang}
            >

              <h2>
                {antreanTerpilih.nomor} • {antreanTerpilih.nama}
              </h2>

              <p className="keterangan-jadwal-ulang">
                Status: Ditunda
                <br />
                Jadwal lama: {formatTanggal(antreanTerpilih.tanggal)}
                {" • "}
                {formatWaktu(
                  antreanTerpilih.jamMulai,
                  antreanTerpilih.jamSelesai
                )}
              </p>

              {/* Tanggal baru */}
              <div className="form-antrean-grup">
                <label htmlFor="tanggal-baru">
                  Jadwal Baru
                </label>

                <input
                  id="tanggal-baru"
                  type="date"
                  name="tanggal"
                  value={formJadwal.tanggal}
                  onChange={handleChangeJadwal}
                  min="2026-11-05"
                />
              </div>

              {/* Jam mulai dan selesai */}
              <div className="form-antrean-baris">

                <div className="form-antrean-grup">
                  <label htmlFor="jam-mulai-baru">
                    Jam Mulai
                  </label>

                  <input
                    id="jam-mulai-baru"
                    type="time"
                    name="jamMulai"
                    value={formJadwal.jamMulai}
                    onChange={handleChangeJadwal}
                  />
                </div>

                <div className="form-antrean-grup">
                  <label htmlFor="jam-selesai-baru">
                    Jam Selesai
                  </label>

                  <input
                    id="jam-selesai-baru"
                    type="time"
                    name="jamSelesai"
                    value={formJadwal.jamSelesai}
                    onChange={handleChangeJadwal}
                  />
                </div>

              </div>

              <div className="aksi-form-antrean">

                <button
                  type="submit"
                  className="tombol-aksi-utama"
                >
                  Konfirmasi Jadwal Ulang
                </button>

                <button
                  type="button"
                  className="tombol-aksi-sekunder"
                  onClick={handleKembaliAntrean}
                >
                  Batal
                </button>

              </div>

            </form>
          </>
        )}

        {/* =================================
            TAMPILAN 3: JADWAL ULANG BERHASIL
        ================================= */}

        {tampilan === "reschedule-success" && dataSukses && (
          <>
            <div className="header-kelola-antrean">
              <h1>Antrean berhasil dijadwalkan ulang</h1>

              <p>Status terkini</p>
            </div>

            <div className="informasi-antrean-tersimpan">

              <h2>
                {dataSukses.antrean.nomor} •{" "}
                {dataSukses.antrean.nama}
              </h2>

              <p>
                Jadwal baru:{" "}
                {formatTanggal(dataSukses.antrean.tanggal)}
              </p>

              <p>
                Waktu:{" "}
                {formatWaktu(
                  dataSukses.antrean.jamMulai,
                  dataSukses.antrean.jamSelesai
                )}
              </p>

              <p>
                Status: {dataSukses.antrean.status}
              </p>

              <p>
                Diperbarui: {formatTanggal("2026-11-05")}
              </p>

            </div>

            <button
              type="button"
              className="tombol-kembali-antrean"
              onClick={handleKembaliAntrean}
            >
              Kembali ke Antrean
            </button>
          </>
        )}

        {/* =================================
            TAMPILAN 4: CATATAN BERHASIL
        ================================= */}

        {tampilan === "note-success" && dataSukses && (
          <>
            <div className="header-kelola-antrean">
              <h1>Catatan berhasil disimpan</h1>

              <p>Status terkini</p>
            </div>

            <div className="informasi-antrean-tersimpan">

              <p>
                {dataSukses.antrean.nomor} •{" "}
                {dataSukses.antrean.nama}
              </p>

              <p>
                {dataSukses.antrean.catatan}
              </p>

            </div>

            <button
              type="button"
              className="tombol-kembali-antrean"
              onClick={handleKembaliAntrean}
            >
              Kembali ke Antrean
            </button>
          </>
        )}

      </main>
    </div>
  );
};
