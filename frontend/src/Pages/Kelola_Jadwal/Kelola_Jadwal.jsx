import { useEffect, useState } from "react";
import { SidebarDosen } from "../../Components/SidebarDosen.jsx";
import "./Style.css";

export const KelolaJadwal = ({ onNavigate, onLogout, user }) => {
  // =====================================
  // STATE DAFTAR JADWAL & LOADING
  // =====================================

  const [daftarJadwal, setDaftarJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pesanError, setPesanError] = useState("");

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
  const [modeForm, setModeForm] = useState("create");

  // =====================================
  // STATE FORM
  // =====================================

  const [formEdit, setFormEdit] = useState({
    tanggal: "",
    jamMulai: "",
    jamSelesai: "",
    ruang: "",
    kuota: "",
    durasiRataRata: "15",
    status: "Aktif",
  });

  const token = localStorage.getItem("token");

  // =====================================
  // NORMALISASI DATA DARI BACKEND
  // =====================================

  const normalisasiJadwal = (item) => ({
    id: item.id_jadwal,
    id_jadwal: item.id_jadwal,
    id_dosen: item.id_dosen,
    tanggal: item.tanggal,
    jamMulai: (item.jam_mulai || "").slice(0, 5),
    jamSelesai: (item.jam_selesai || "").slice(0, 5),
    ruang: item.ruang || "",
    kuota: item.kuota_mhs,
    durasiRataRata: item.durasi_menit,
    status: item.status_jadwal || "Aktif",
    peserta: item.peserta !== undefined ? Number(item.peserta) : Number(item.total_terdaftar || 0),
    sisaKuota: item.sisa_kuota !== undefined ? Number(item.sisa_kuota) : Math.max(0, item.kuota_mhs - Number(item.peserta || 0)),
  });

  // =====================================
  // MEMUAT DATA JADWAL DARI API
  // =====================================

  const muatDaftarJadwal = async () => {
    setLoading(true);
    setPesanError("");
    try {
      const response = await fetch("/api/jadwal", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memuat daftar jadwal bimbingan.");
      }

      const listNormal = (result.data || []).map(normalisasiJadwal);
      setDaftarJadwal(listNormal);
    } catch (err) {
      setPesanError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatDaftarJadwal();
  }, []);

  // =====================================
  // FORMAT TANGGAL
  // =====================================

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";
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
    if (jadwalTerpilih?.id === jadwal.id) {
      setJadwalTerpilih(null);
    } else {
      setJadwalTerpilih(jadwal);
    }
  };

  // =====================================
  // MEMBUKA FORM EDIT
  // =====================================

  const handleEdit = () => {
    if (!jadwalTerpilih) return;

    setModeForm("edit");
    setPesanError("");

    setFormEdit({
      tanggal: jadwalTerpilih.tanggal,
      jamMulai: jadwalTerpilih.jamMulai,
      jamSelesai: jadwalTerpilih.jamSelesai,
      ruang: jadwalTerpilih.ruang || "",
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
    setPesanError("");

    setFormEdit({
      tanggal: "",
      jamMulai: "",
      jamSelesai: "",
      ruang: "",
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
  // MENYIMPAN JADWAL (CREATE / UPDATE VIA API)
  // =====================================

  const handleSimpanEdit = async (e) => {
    e.preventDefault();
    setPesanError("");

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
      setPesanError("Semua kolom wajib harus diisi.");
      return;
    }

    // Validasi waktu
    if (formEdit.jamMulai >= formEdit.jamSelesai) {
      setPesanError("Jam selesai harus lebih besar dari jam mulai pada hari yang sama.");
      return;
    }

    // Validasi kuota
    if (!Number.isInteger(kuotaBaru) || kuotaBaru <= 0) {
      setPesanError("Kuota peserta harus berupa bilangan bulat lebih dari 0.");
      return;
    }

    // Validasi durasi
    if (!Number.isInteger(durasiBaru) || durasiBaru <= 0) {
      setPesanError("Durasi rata-rata sesi harus berupa bilangan bulat lebih dari 0 menit.");
      return;
    }

    // Validasi kuota saat edit
    if (modeForm === "edit" && kuotaBaru < (jadwalTerpilih?.peserta || 0)) {
      setPesanError(
        `Kuota tidak boleh lebih kecil dari jumlah peserta yang sudah terdaftar (${jadwalTerpilih.peserta}).`
      );
      return;
    }

    const payload = {
      tanggal: formEdit.tanggal,
      jam_mulai: formEdit.jamMulai,
      jam_selesai: formEdit.jamSelesai,
      ruang: formEdit.ruang.trim() || null,
      kuota_mhs: kuotaBaru,
      durasi_menit: durasiBaru,
      status_jadwal: formEdit.status,
    };

    setSubmitting(true);

    try {
      const endpoint = modeForm === "create"
        ? "/api/jadwal"
        : `/api/jadwal/${jadwalTerpilih.id_jadwal}`;
      const method = modeForm === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan jadwal bimbingan.");
      }

      const tersimpanNormal = normalisasiJadwal(result.data);
      setJadwalTersimpan(tersimpanNormal);

      // Muat ulang daftar jadwal terbaru dari server
      await muatDaftarJadwal();

      // Menampilkan halaman sukses
      setTampilan("success");
    } catch (err) {
      setPesanError(err.message || "Terjadi kesalahan saat menyimpan jadwal.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================
  // MEMBATALKAN FORM
  // =====================================

  const handleBatal = () => {
    setTampilan("list");
    setJadwalTerpilih(null);
    setPesanError("");
  };

  // =====================================
  // KEMBALI KE DAFTAR JADWAL
  // =====================================

  const handleKembaliJadwal = () => {
    setTampilan("list");
    setJadwalTerpilih(null);
    setJadwalTersimpan(null);
    setPesanError("");
  };

  // =====================================
  // MENGHAPUS JADWAL (DELETE VIA API)
  // =====================================

  const handleHapusJadwal = async (idJadwal) => {
    const konfirmasi = window.confirm(
      "Apakah Anda yakin ingin menghapus jadwal ini?"
    );
    if (!konfirmasi) return;

    setSubmitting(true);
    setPesanError("");

    try {
      const response = await fetch(`/api/jadwal/${idJadwal}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus jadwal bimbingan.");
      }

      setDaftarJadwal((sebelumnya) => sebelumnya.filter((j) => j.id !== idJadwal));
      setJadwalTerpilih(null);
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat menghapus jadwal.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================
  // TAMPILAN HALAMAN
  // =====================================

  return (
    <div className="halaman-kelola-jadwal">
      {/* SIDEBAR DOSEN */}
      <SidebarDosen
        activePage="jadwal"
        onNavigate={onNavigate}
        onLogout={onLogout}
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
                ? "Atur tanggal, waktu, ruangan, kapasitas, dan durasi rata-rata sesi."
                : "Atur jadwal aktif, ruangan, kapasitas, dan durasi rata-rata sesi bimbingan."}
            </p>
          </>
        )}

        {/* FEEDBACK ERROR */}
        {pesanError && (
          <div className="pesan-error-jadwal" role="alert">
            {pesanError}
          </div>
        )}

        {/* =====================================
            TAMPILAN DAFTAR JADWAL
        ===================================== */}
        {tampilan === "list" && (
          <>
            {loading ? (
              <div className="loading-jadwal">Memuat data jadwal bimbingan...</div>
            ) : daftarJadwal.length > 0 ? (
              <div className="daftar-jadwal">
                {daftarJadwal.map((jadwal) => (
                  <div
                    className={`element-november ${
                      jadwalTerpilih?.id === jadwal.id ? "jadwal-terpilih" : ""
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
                      {jadwal.ruang ? ` • Ruang: ${jadwal.ruang}` : ""}
                    </p>

                    {/* TOMBOL AKSI */}
                    {jadwalTerpilih?.id === jadwal.id && (
                      <div className="aksi-jadwal">
                        <button
                          type="button"
                          className="tombol-edit"
                          disabled={submitting}
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
                          disabled={submitting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHapusJadwal(jadwal.id);
                          }}
                        >
                          {submitting ? "Memproses..." : "Hapus"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="jadwal-kosong">
                Belum ada jadwal yang tersedia. Silakan buat jadwal baru.
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
          <form className="form-edit-jadwal" onSubmit={handleSimpanEdit}>
            <h2>
              {modeForm === "create"
                ? "Buat Jadwal Baru"
                : "Informasi Jadwal"}
            </h2>

            {/* TANGGAL */}
            <div className="form-edit-grup">
              <label htmlFor="tanggal-jadwal">Tanggal</label>
              <input
                id="tanggal-jadwal"
                type="date"
                name="tanggal"
                required
                disabled={submitting}
                value={formEdit.tanggal}
                onChange={handleChangeEdit}
              />
            </div>

            {/* JAM MULAI DAN JAM SELESAI */}
            <div className="form-edit-baris">
              <div className="form-edit-grup">
                <label htmlFor="jam-mulai-jadwal">Jam Mulai</label>
                <input
                  id="jam-mulai-jadwal"
                  type="time"
                  name="jamMulai"
                  required
                  disabled={submitting}
                  value={formEdit.jamMulai}
                  onChange={handleChangeEdit}
                />
              </div>

              <div className="form-edit-grup">
                <label htmlFor="jam-selesai-jadwal">Jam Selesai</label>
                <input
                  id="jam-selesai-jadwal"
                  type="time"
                  name="jamSelesai"
                  required
                  disabled={submitting}
                  value={formEdit.jamSelesai}
                  onChange={handleChangeEdit}
                />
              </div>
            </div>

            {/* RUANG (OPSIONAL) */}
            <div className="form-edit-grup">
              <label htmlFor="ruang-jadwal">Ruangan (Opsional)</label>
              <input
                id="ruang-jadwal"
                type="text"
                name="ruang"
                placeholder="Contoh: R. Dosen 204 atau Lab A"
                maxLength={100}
                disabled={submitting}
                value={formEdit.ruang}
                onChange={handleChangeEdit}
              />
            </div>

            {/* KUOTA */}
            <div className="form-edit-grup">
              <label htmlFor="kuota-jadwal">Kuota Peserta</label>
              <input
                id="kuota-jadwal"
                type="number"
                name="kuota"
                required
                min={modeForm === "edit" ? (jadwalTerpilih?.peserta || 1) : 1}
                disabled={submitting}
                value={formEdit.kuota}
                onChange={handleChangeEdit}
              />
              {modeForm === "edit" && (
                <small>
                  Peserta yang sudah terdaftar: {jadwalTerpilih?.peserta || 0} orang
                </small>
              )}
            </div>

            {/* DURASI RATA-RATA */}
            <div className="form-edit-grup">
              <label htmlFor="durasi-jadwal">Durasi Rata-rata (Menit)</label>
              <input
                id="durasi-jadwal"
                type="number"
                name="durasiRataRata"
                required
                min="1"
                disabled={submitting}
                value={formEdit.durasiRataRata}
                onChange={handleChangeEdit}
              />
            </div>

            {/* STATUS JADWAL */}
            <div className="form-edit-grup">
              <label htmlFor="status-jadwal">Status Jadwal</label>
              <select
                id="status-jadwal"
                name="status"
                disabled={submitting}
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
                disabled={submitting}
              >
                {submitting
                  ? "Menyimpan..."
                  : modeForm === "create"
                  ? "Simpan Jadwal"
                  : "Simpan Perubahan"}
              </button>

              <button
                type="button"
                className="tombol-batal-edit"
                disabled={submitting}
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
              {jadwalTersimpan.ruang ? ` • Ruang: ${jadwalTersimpan.ruang}` : ""}
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
