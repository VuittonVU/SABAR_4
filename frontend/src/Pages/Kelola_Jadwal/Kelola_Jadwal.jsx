
import { useState } from "react";
import { SidebarDosen } from "../../Components/SidebarDosen.jsx";
import "./style.css";

export const KelolaJadwal = ({ onNavigate }) => {

  // Data awal jadwal
  const [daftarJadwal, setDaftarJadwal] = useState([
    {
      id: 1,
      tanggal: "2026-11-05",
      waktu: "10:00–12:30 WIB",
      peserta: 10,
      kuota: 12,
      durasiRataRata: 15,
      status: "Aktif",
    },
    {
      id: 2,
      tanggal: "2026-11-06",
      waktu: "13:00–15:00 WIB",
      peserta: 4,
      kuota: 12,
      durasiRataRata: 15,
      status: "Aktif",
    },
    {
      id: 3,
      tanggal: "2026-11-10",
      waktu: "09:00–11:00 WIB",
      peserta: 2,
      kuota: 8,
      durasiRataRata: 20,
      status: "Aktif",
    },
  ]);

  // Mengatur tampilan halaman
  const [tampilan, setTampilan] = useState("list");

  // Menyimpan jadwal yang dipilih
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);

  // Menyimpan hasil penyimpanan
  const [jadwalTersimpan, setJadwalTersimpan] = useState(null);

  // Menentukan apakah proses membuat atau mengubah jadwal
  const [jenisSimpan, setJenisSimpan] = useState("");

  // Data formulir
  const [formEdit, setFormEdit] = useState({
    tanggal: "",
    waktu: "",
    kuota: "",
    durasiRataRata: "",
    status: "Aktif",
  });

  // Format tanggal Indonesia
  const formatTanggal = (tanggal) => {
    const [tahun, bulan, hari] = tanggal.split("-");

    const tanggalObj = new Date(
      Number(tahun),
      Number(bulan) - 1,
      Number(hari)
    );

    return tanggalObj.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Memilih kotak jadwal
  const handlePilihJadwal = (jadwal) => {
    setJadwalTerpilih(
      jadwalTerpilih?.id === jadwal.id ? null : jadwal
    );
  };

  // Membuka form ubah jadwal
  const handleEdit = (jadwal) => {
    setJadwalTerpilih(jadwal);

    setFormEdit({
      tanggal: jadwal.tanggal,
      waktu: jadwal.waktu,
      kuota: jadwal.kuota,
      durasiRataRata: jadwal.durasiRataRata,
      status: jadwal.status,
    });

    setTampilan("edit");
  };

  // Membuka form buat jadwal
  const handleBuatJadwal = () => {
    setJadwalTerpilih(null);

    // Mengosongkan form untuk jadwal baru
    setFormEdit({
      tanggal: "",
      waktu: "",
      kuota: "",
      durasiRataRata: 15,
      status: "Aktif",
    });

    setTampilan("create");
  };

  // Mengubah nilai input
  const handleChangeEdit = (e) => {
    const { name, value } = e.target;

    setFormEdit((formSebelumnya) => ({
      ...formSebelumnya,
      [name]: value,
    }));
  };

  // Menyimpan form (buat atau ubah jadwal)
  const handleSimpanForm = (e) => {
    e.preventDefault();

    const kuotaBaru = Number(formEdit.kuota);
    const durasiBaru = Number(formEdit.durasiRataRata);

    const sedangMembuat = tampilan === "create";

    // Validasi kolom
    if (
      !formEdit.tanggal ||
      !formEdit.waktu.trim() ||
      !formEdit.kuota ||
      !formEdit.durasiRataRata ||
      !formEdit.status
    ) {
      alert("Semua kolom harus diisi.");
      return;
    }

    // Validasi kuota
    if (
      !Number.isInteger(kuotaBaru) ||
      kuotaBaru <= 0
    ) {
      alert("Kuota harus berupa bilangan bulat lebih dari 0.");
      return;
    }

    // Validasi kuota untuk jadwal yang sedang diedit
    if (
      !sedangMembuat &&
      kuotaBaru < jadwalTerpilih.peserta
    ) {
      alert(
        `Kuota tidak boleh lebih kecil dari jumlah peserta terdaftar (${jadwalTerpilih.peserta}).`
      );
      return;
    }

    // Validasi durasi
    if (
      !Number.isInteger(durasiBaru) ||
      durasiBaru <= 0
    ) {
      alert("Durasi harus berupa bilangan bulat lebih dari 0.");
      return;
    }

    let jadwalBaru;

    if (sedangMembuat) {

      // Membuat ID baru
      const idBaru =
        daftarJadwal.reduce(
          (idTerbesar, jadwal) =>
            Math.max(idTerbesar, jadwal.id),
          0
        ) + 1;

      // Membuat objek jadwal baru
      jadwalBaru = {
        id: idBaru,
        tanggal: formEdit.tanggal,
        waktu: formEdit.waktu.trim(),
        peserta: 0,
        kuota: kuotaBaru,
        durasiRataRata: durasiBaru,
        status: formEdit.status,
      };

      // Menambahkan jadwal ke daftar
      setDaftarJadwal((jadwalSebelumnya) => [
        ...jadwalSebelumnya,
        jadwalBaru,
      ]);

      setJenisSimpan("dibuat");

    } else {

      // Memperbarui jadwal yang sudah ada
      jadwalBaru = {
        ...jadwalTerpilih,
        tanggal: formEdit.tanggal,
        waktu: formEdit.waktu.trim(),
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

      setJenisSimpan("diperbarui");
    }

    // Menyimpan informasi hasil proses
    setJadwalTersimpan(jadwalBaru);
    setJadwalTerpilih(null);

    // Berpindah ke tampilan berhasil
    setTampilan("success");
  };

  // Membatalkan proses
  const handleBatal = () => {
    setTampilan("list");
    setJadwalTerpilih(null);
  };

  // Kembali ke daftar jadwal
  const handleKembaliJadwal = () => {
    setTampilan("list");
    setJadwalTerpilih(null);
    setJadwalTersimpan(null);
    setJenisSimpan("");
  };

  return (
    <div className="halaman-kelola-jadwal">

      {/* Sidebar */}
      <SidebarDosen
        activePage="jadwal"
        onNavigate={onNavigate}
      />

      <main className="konten-kelola-jadwal">

        {/* =================================
            TAMPILAN 1: DAFTAR JADWAL
        ================================= */}
        {tampilan === "list" && (
          <>
            <div className="header-kelola-jadwal">
              <h1>Kelola Jadwal dan Kuota</h1>

              <p>
                Atur jadwal aktif, kapasitas, dan durasi rata-rata.
              </p>
            </div>

            <section className="daftar-jadwal">

              {daftarJadwal.length > 0 ? (
                daftarJadwal.map((jadwal) => (
                  <div
                    key={jadwal.id}
                    className={`element-jadwal ${
                      jadwalTerpilih?.id === jadwal.id
                        ? "jadwal-terpilih"
                        : ""
                    }`}
                    onClick={() => handlePilihJadwal(jadwal)}
                  >
                    <div className="informasi-jadwal">
                      <h2>
                        {formatTanggal(jadwal.tanggal)}
                      </h2>

                      <p>
                        {jadwal.waktu}
                        {" • "}
                        {jadwal.peserta}/{jadwal.kuota} peserta
                        {" • "}
                        {jadwal.status}
                      </p>
                    </div>

                    {jadwalTerpilih?.id === jadwal.id && (
                      <button
                        type="button"
                        className="tombol-ubah-jadwal"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(jadwal);
                        }}
                      >
                        Ubah Jadwal
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="jadwal-kosong">
                  Belum ada jadwal yang tersedia.
                </p>
              )}

            </section>

            <button
              type="button"
              className="tombol-buat-jadwal"
              onClick={handleBuatJadwal}
            >
              Buat Jadwal
            </button>
          </>
        )}

        {/* =================================
            TAMPILAN 2: FORM BUAT / UBAH
        ================================= */}
        {(tampilan === "create" || tampilan === "edit") && (
          <>
            <div className="header-kelola-jadwal">
              <h1>
                {tampilan === "create"
                  ? "Buat Jadwal dan Kuota"
                  : "Ubah Jadwal dan Kuota"}
              </h1>

              <p>
                {tampilan === "create"
                  ? "Masukkan informasi untuk membuat jadwal bimbingan baru."
                  : "Perbarui informasi jadwal melalui form berikut."}
              </p>
            </div>

            <form
              className="form-edit-jadwal"
              onSubmit={handleSimpanForm}
            >

              {tampilan === "edit" && jadwalTerpilih && (
                <>
                  <h2>
                    {formatTanggal(jadwalTerpilih.tanggal)}
                  </h2>

                  <p className="keterangan-edit">
                    Peserta terdaftar: {jadwalTerpilih.peserta} orang.
                    Kuota tidak dapat lebih kecil dari jumlah peserta terdaftar.
                  </p>
                </>
              )}

              {/* Tanggal */}
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

              {/* Waktu */}
              <div className="form-edit-grup">
                <label htmlFor="waktu-jadwal">
                  Waktu
                </label>

                <input
                  id="waktu-jadwal"
                  type="text"
                  name="waktu"
                  value={formEdit.waktu}
                  onChange={handleChangeEdit}
                  placeholder="Contoh: 13:00–15:00 WIB"
                />
              </div>

              {/* Kuota */}
              <div className="form-edit-grup">
                <label htmlFor="kuota-jadwal">
                  Kuota Peserta
                </label>

                <input
                  id="kuota-jadwal"
                  type="number"
                  name="kuota"
                  min={
                    tampilan === "edit"
                      ? jadwalTerpilih?.peserta ?? 0
                      : 1
                  }
                  value={formEdit.kuota}
                  onChange={handleChangeEdit}
                />
              </div>

              {/* Durasi */}
              <div className="form-edit-grup">
                <label htmlFor="durasi-jadwal">
                  Durasi Rata-rata (menit)
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

              {/* Status */}
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

              {/* Tombol */}
              <div className="aksi-form-edit">

                <button
                  type="submit"
                  className="tombol-simpan-edit"
                >
                  {tampilan === "create"
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
          </>
        )}

        {/* =================================
            TAMPILAN 3: BERHASIL
        ================================= */}
        {tampilan === "success" && jadwalTersimpan && (
          <>
            <div className="header-kelola-jadwal">

              <h1>
                {jenisSimpan === "dibuat"
                  ? "Jadwal berhasil dibuat"
                  : "Jadwal berhasil disimpan"}
              </h1>

              <p>Status terkini</p>

            </div>

            <div className="informasi-jadwal-tersimpan">

              <p>
                {formatTanggal(jadwalTersimpan.tanggal)}
                {" • "}
                {jadwalTersimpan.waktu}
                {" • "}
                {jadwalTersimpan.kuota} Kuota
                {" • "}
                {jadwalTersimpan.status}
              </p>

            </div>

            <button
              type="button"
              className="tombol-kembali-jadwal"
              onClick={handleKembaliJadwal}
            >
              Kembali ke Jadwal
            </button>

          </>
        )}

      </main>
    </div>
  );
};
