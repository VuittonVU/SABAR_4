
import { useState } from "react";
import { SidebarDosen } from "../../Components/SidebarDosen.jsx";
import "./style.css";

export const KelolaJadwal = ({ onNavigate }) => {

  // =====================================
  // DATA AWAL JADWAL
  // =====================================

  const [daftarJadwal, setDaftarJadwal] = useState([
    {
      id: 1,
      tanggal: "2026-11-05",
      jamMulai: "10:00",
      jamSelesai: "12:30",
      peserta: 10,
      kuota: 12,
      durasiRataRata: 15,
      status: "Aktif",
    },
    {
      id: 2,
      tanggal: "2026-11-06",
      jamMulai: "13:00",
      jamSelesai: "15:00",
      peserta: 4,
      kuota: 12,
      durasiRataRata: 15,
      status: "Aktif",
    },
    {
      id: 3,
      tanggal: "2026-11-10",
      jamMulai: "09:00",
      jamSelesai: "11:00",
      peserta: 2,
      kuota: 8,
      durasiRataRata: 15,
      status: "Aktif",
    },
  ]);

  // =====================================
  // STATE HALAMAN
  // =====================================

  // list    = daftar jadwal
  // edit    = form buat/edit jadwal
  // success = konfirmasi berhasil

  const [tampilan, setTampilan] = useState("list");

  // Jadwal yang sedang dipilih
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // Jadwal yang berhasil disimpan
  const [jadwalTersimpan, setJadwalTersimpan] = useState(null);

  // Menentukan proses buat atau edit
  const [modeForm, setModeForm] = useState("edit");

  // =====================================
  // STATE FORM
  // =====================================

  const [formEdit, setFormEdit] = useState({
    tanggal: "",
    jamMulai: "",
    jamSelesai: "",
    kuota: "",
    durasiRataRata: "",
    status: "Aktif",
  });

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

  // =====================================
  // MEMILIH JADWAL
  // =====================================

  const handlePilihJadwal = (jadwal) => {
    setJadwalTerpilih(jadwal);
  };

  // =====================================
  // MEMBUKA FORM EDIT
  // =====================================

  const handleEdit = () => {
    if (!jadwalTerpilih) return;

    setModeForm("edit");

    setFormEdit({
      tanggal: jadwalTerpilih.tanggal,
      jamMulai: jadwalTerpilih.jamMulai,
      jamSelesai: jadwalTerpilih.jamSelesai,
      kuota: String(jadwalTerpilih.kuota),
      durasiRataRata: String(jadwalTerpilih.durasiRataRata),
      status: jadwalTerpilih.status,
    });

    setTampilan("edit");
  };

  // =====================================
  // MEMBUKA FORM BUAT JADWAL
  // =====================================

  const handleBuatJadwal = () => {
    setJadwalTerpilih(null);

    setModeForm("create");

    setFormEdit({
      tanggal: "",
      jamMulai: "",
      jamSelesai: "",
      kuota: "",
      durasiRataRata: "15",
      status: "Aktif",
    });

    setTampilan("edit");
  };

  // =====================================
  // MENGUBAH INPUT FORM
  // =====================================

  const handleChangeEdit = (e) => {
    const { name, value } = e.target;

    setFormEdit((formSebelumnya) => ({
      ...formSebelumnya,
      [name]: value,
    }));
  };

  // =====================================
  // MENYIMPAN JADWAL
  // =====================================

  const handleSimpanEdit = (e) => {
    e.preventDefault();

    const kuotaBaru = Number(formEdit.kuota);
    const durasiBaru = Number(formEdit.durasiRataRata);

    // Validasi input kosong
    if (
      !formEdit.tanggal ||
      !formEdit.jamMulai ||
      !formEdit.jamSelesai ||
      !formEdit.kuota ||
      !formEdit.durasiRataRata ||
      !formEdit.status
    ) {
      alert("Semua kolom harus diisi.");
      return;
    }

    // Validasi waktu
    if (formEdit.jamMulai >= formEdit.jamSelesai) {
      alert("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }

    // Validasi kuota
    if (!Number.isInteger(kuotaBaru) || kuotaBaru <= 0) {
      alert("Kuota harus berupa bilangan bulat lebih dari 0.");
      return;
    }

    // Validasi durasi
    if (!Number.isInteger(durasiBaru) || durasiBaru <= 0) {
      alert("Durasi rata-rata harus berupa bilangan bulat lebih dari 0.");
      return;
    }

    // Validasi kuota saat edit
    if (
      modeForm === "edit" &&
      kuotaBaru < jadwalTerpilih.peserta
    ) {
      alert(
        `Kuota tidak boleh lebih kecil dari jumlah peserta yang sudah terdaftar (${jadwalTerpilih.peserta}).`
      );
      return;
    }

    // =====================================
    // MEMBUAT JADWAL BARU
    // =====================================

    if (modeForm === "create") {

      const idBaru =
        daftarJadwal.length > 0
          ? Math.max(...daftarJadwal.map((jadwal) => jadwal.id)) + 1
          : 1;

      const jadwalBaru = {
        id: idBaru,
        tanggal: formEdit.tanggal,
        jamMulai: formEdit.jamMulai,
        jamSelesai: formEdit.jamSelesai,
        peserta: 0,
        kuota: kuotaBaru,
        durasiRataRata: durasiBaru,
        status: formEdit.status,
      };

      setDaftarJadwal((jadwalSebelumnya) => [
        ...jadwalSebelumnya,
        jadwalBaru,
      ]);

      setJadwalTersimpan(jadwalBaru);
    }

    // =====================================
    // MEMPERBARUI JADWAL
    // =====================================

    else {

      const jadwalBaru = {
        ...jadwalTerpilih,
        tanggal: formEdit.tanggal,
        jamMulai: formEdit.jamMulai,
        jamSelesai: formEdit.jamSelesai,
        kuota: kuotaBaru,
        durasiRataRata: durasiBaru,
        status: formEdit.status,
      };

      setDaftarJadwal((jadwalSebelumnya) =>
        jadwalSebelumnya.map((jadwal) =>
          jadwal.id === jadwalTerpilih.id
            ? jadwalBaru
            : jadwal
        )
      );

      setJadwalTersimpan(jadwalBaru);
    }

    // Menampilkan halaman berhasil
    setTampilan("success");
  };

  // =====================================
  // MEMBATALKAN FORM
  // =====================================

  const handleBatal = () => {
    setTampilan("list");
    setJadwalTerpilih(null);
  };

  // =====================================
  // KEMBALI KE DAFTAR JADWAL
  // =====================================

  const handleKembaliJadwal = () => {
    setTampilan("list");
    setJadwalTerpilih(null);
    setJadwalTersimpan(null);
  };

  // =====================================
  // MENGHAPUS JADWAL
  // =====================================

  const handleHapusJadwal = (id) => {
    const konfirmasi = window.confirm(
      "Apakah Anda yakin ingin menghapus jadwal ini?"
    );

    if (konfirmasi) {
      setDaftarJadwal((jadwalSebelumnya) =>
        jadwalSebelumnya.filter(
          (jadwal) => jadwal.id !== id
        )
      );

      setJadwalTerpilih(null);
    }
  };

  // =====================================
  // TAMPILAN HALAMAN
  // =====================================

  return (
    <div className="halaman-kelola-jadwal">

      {/* SIDEBAR */}

      <SidebarDosen
        activePage="jadwal"
        onNavigate={onNavigate}
      />

      {/* KONTEN UTAMA */}

      <main className="konten-SABAR">

        {/* =====================================
            HEADER
        ===================================== */}

        {tampilan !== "success" && (
          <>
            <div className="text-wrapper-3">
              {tampilan === "edit"
                ? modeForm === "create"
                  ? "Buat Jadwal dan Kuota"
                  : "Ubah Jadwal dan Kuota"
                : "Kelola Jadwal dan Kuota"}
            </div>

            <p className="p">
              {tampilan === "edit"
                ? "Atur tanggal, waktu, kapasitas, dan durasi rata-rata."
                : "Atur jadwal aktif, kapasitas, dan durasi rata-rata."}
            </p>
          </>
        )}

        {/* =====================================
            TAMPILAN DAFTAR JADWAL
        ===================================== */}

        {tampilan === "list" && (
          <>

            {daftarJadwal.length > 0 ? (
              <div className="daftar-jadwal">

                {daftarJadwal.map((jadwal) => (

                  <div
                    className={`element-november ${
                      jadwalTerpilih?.id === jadwal.id
                        ? "jadwal-terpilih"
                        : ""
                    }`}
                    key={jadwal.id}
                    onClick={() => handlePilihJadwal(jadwal)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePilihJadwal(jadwal);
                      }
                    }}
                  >

                    <div className="text-wrapper-4">
                      {formatTanggal(jadwal.tanggal)}
                    </div>

                    <p className="text-wrapper-5">
                      {jadwal.jamMulai.replace(":", ".")}–
                      {jadwal.jamSelesai.replace(":", ".")} WIB
                      {" • "}
                      {jadwal.peserta}/{jadwal.kuota} peserta
                      {" • "}
                      {jadwal.status}
                    </p>

                    <p className="detail-ruang">
                      Durasi rata-rata: {jadwal.durasiRataRata} menit
                    </p>

                    {/* TOMBOL AKSI */}

                    {jadwalTerpilih?.id === jadwal.id && (
                      <div className="aksi-jadwal">

                        <button
                          type="button"
                          className="tombol-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit();
                          }}
                        >
                          Ubah Jadwal
                        </button>

                        <button
                          type="button"
                          className="tombol-hapus"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHapusJadwal(jadwal.id);
                          }}
                        >
                          Hapus
                        </button>

                      </div>
                    )}

                  </div>

                ))}

              </div>
            ) : (
              <p className="jadwal-kosong">
                Belum ada jadwal yang tersedia.
              </p>
            )}

            {/* TOMBOL BUAT JADWAL */}

            <button
              type="button"
              className="buat-jadwal"
              onClick={handleBuatJadwal}
            >
              Buat Jadwal
            </button>

          </>
        )}

        {/* =====================================
            FORM BUAT / EDIT JADWAL
        ===================================== */}

        {tampilan === "edit" && (

          <form
            className="form-edit-jadwal"
            onSubmit={handleSimpanEdit}
          >

            <h2>
              {modeForm === "create"
                ? "Buat Jadwal Baru"
                : "Informasi Jadwal"}
            </h2>

            {/* TANGGAL */}

            <div className="form-edit-grup">

              <label htmlFor="tanggal-jadwal">
                Tanggal
              </label>

              <input
                id="tanggal-jadwal"
                type="date"
                name="tanggal"
                value={formEdit.tanggal}
                onChange={handleChangeEdit}
              />

            </div>

            {/* JAM MULAI DAN JAM SELESAI */}

            <div className="form-edit-baris">

              <div className="form-edit-grup">

                <label htmlFor="jam-mulai-jadwal">
                  Jam Mulai
                </label>

                <input
                  id="jam-mulai-jadwal"
                  type="time"
                  name="jamMulai"
                  value={formEdit.jamMulai}
                  onChange={handleChangeEdit}
                />

              </div>

              <div className="form-edit-grup">

                <label htmlFor="jam-selesai-jadwal">
                  Jam Selesai
                </label>

                <input
                  id="jam-selesai-jadwal"
                  type="time"
                  name="jamSelesai"
                  value={formEdit.jamSelesai}
                  onChange={handleChangeEdit}
                />

              </div>

            </div>

            {/* KUOTA */}

            <div className="form-edit-grup">

              <label htmlFor="kuota-jadwal">
                Kuota Peserta
              </label>

              <input
                id="kuota-jadwal"
                type="number"
                name="kuota"
                min={
                  modeForm === "edit"
                    ? jadwalTerpilih?.peserta
                    : 1
                }
                value={formEdit.kuota}
                onChange={handleChangeEdit}
              />

              {modeForm === "edit" && (
                <small>
                  Peserta yang sudah terdaftar:{" "}
                  {jadwalTerpilih?.peserta}
                </small>
              )}

            </div>

            {/* DURASI RATA-RATA */}

            <div className="form-edit-grup">

              <label htmlFor="durasi-jadwal">
                Durasi Rata-rata (Menit)
              </label>

              <input
                id="durasi-jadwal"
                type="number"
                name="durasiRataRata"
                min="1"
                value={formEdit.durasiRataRata}
                onChange={handleChangeEdit}
              />

            </div>

            {/* STATUS JADWAL */}

            <div className="form-edit-grup">

              <label htmlFor="status-jadwal">
                Status Jadwal
              </label>

              <select
                id="status-jadwal"
                name="status"
                value={formEdit.status}
                onChange={handleChangeEdit}
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>

            </div>

            {/* TOMBOL FORM */}

            <div className="aksi-form-edit">

              <button
                type="submit"
                className="tombol-simpan-edit"
              >
                {modeForm === "create"
                  ? "Simpan Jadwal"
                  : "Simpan Perubahan"}
              </button>

              <button
                type="button"
                className="tombol-batal-edit"
                onClick={handleBatal}
              >
                Batal
              </button>

            </div>

          </form>

        )}

        {/* =====================================
            KONFIRMASI BERHASIL
        ===================================== */}

        {tampilan === "success" && jadwalTersimpan && (

          <div className="jadwal-berhasil">

            <h2>
              {modeForm === "create"
                ? "Jadwal berhasil dibuat"
                : "Jadwal berhasil disimpan"}
            </h2>

            <p>
              Status: {jadwalTersimpan.status}
              <br />

              {formatTanggal(jadwalTersimpan.tanggal)}
              {" • "}
              {jadwalTersimpan.jamMulai.replace(":", ".")}–
              {jadwalTersimpan.jamSelesai.replace(":", ".")} WIB
              {" • "}
              {jadwalTersimpan.kuota} Kuota
              {" • "}
              {jadwalTersimpan.durasiRataRata} menit
            </p>

            <button
              type="button"
              className="tombol-kembali-jadwal"
              onClick={handleKembaliJadwal}
            >
              Kembali ke Jadwal
            </button>

          </div>

        )}

      </main>
    </div>
  );
};
