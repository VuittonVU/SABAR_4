import { useEffect, useState } from "react";
import { SidebarDosen } from "../../Components/SidebarDosen.jsx";
import "./Style.css";

export const KelolaAntrean = ({ onNavigate, onLogout, user }) => {
  // =====================================
  // STATE DATA ANTREAN & LOADING
  // =====================================

  const [daftarAntrean, setDaftarAntrean] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pesanError, setPesanError] = useState("");

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
  const [idCatatanAktif, setIdCatatanAktif] = useState(null);

  // Daftar jadwal aktif dosen untuk opsi penjadwalan ulang
  const [jadwalTersedia, setJadwalTersedia] = useState([]);
  const [idJadwalBaru, setIdJadwalBaru] = useState("");

  const token = localStorage.getItem("token");

  // =====================================
  // FORMAT TANGGAL DAN WAKTU
  // =====================================

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";
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
    if (!mulai || !selesai) return "-";
    return `${mulai.slice(0, 5).replace(":", ".")}–${selesai.slice(0, 5).replace(":", ".")} WIB`;
  };

  // =====================================
  // NORMALISASI DATA DARI BACKEND
  // =====================================

  const normalisasiItem = (item) => ({
    id: item.id_antrian,
    id_antrian: item.id_antrian,
    id_jadwal: item.id_jadwal,
    nomor: `#${item.nomor_antrian}`,
    nomor_antrian: item.nomor_antrian,
    nama: item.nama_mahasiswa || "Mahasiswa",
    email_npm: item.email_npm || "-",
    status: item.status_antrian,
    status_antrian: item.status_antrian,
    versi: item.versi || 1,
    berkas: 1,
    tanggal: item.tanggal,
    jamMulai: (item.jam_mulai || "").slice(0, 5),
    jamSelesai: (item.jam_selesai || "").slice(0, 5),
    ruang: item.ruang || "",
    catatan: item.catatan || "",
    id_catatan: item.id_catatan || null,
    catatan_updated_at: item.catatan_updated_at || null,
  });

  // =====================================
  // MEMUAT DATA ANTREAN DARI API
  // =====================================

  const muatDataAntrean = async () => {
    setLoading(true);
    setPesanError("");
    try {
      const response = await fetch("/api/antrean", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success && Array.isArray(result.data)) {
        const dataList = result.data.map(normalisasiItem);
        setDaftarAntrean(dataList);
      } else {
        // Fallback jika belum ada antrean di database
        setDaftarAntrean([]);
      }
    } catch (err) {
      setPesanError(err.message || "Gagal memuat data antrean mahasiswa.");
    } finally {
      setLoading(false);
    }
  };

  // Memuat daftar jadwal aktif dosen untuk keperluan reschedule
  const muatJadwalDosen = async () => {
    try {
      const res = await fetch("/api/jadwal", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setJadwalTersedia(json.data.filter((j) => j.status_jadwal === "Aktif"));
      }
    } catch {
      // Abaikan jika gagal memuat jadwal
    }
  };

  useEffect(() => {
    muatDataAntrean();
    muatJadwalDosen();
  }, []);

  // =====================================
  // MEMILIH ANTREAN & MEMUAT CATATAN RIIL
  // =====================================

  const handlePilihAntrean = async (antrean) => {
    if (antreanTerpilih?.id === antrean.id) {
      setAntreanTerpilih(null);
      setCatatanEdit("");
      setIdCatatanAktif(null);
      return;
    }

    setAntreanTerpilih(antrean);
    setCatatanEdit(antrean.catatan || "");
    setIdCatatanAktif(antrean.id_catatan || null);

    // Ambil riwayat catatan bimbingan terbaru untuk antrean ini dari API
    try {
      const res = await fetch(`/api/antrean/${antrean.id_antrian}/catatan`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const catatanTerbaru = json.data[0];
        setCatatanEdit(catatanTerbaru.isi_catatan || "");
        setIdCatatanAktif(catatanTerbaru.id_catatan);
      }
    } catch {
      // Pertahankan catatan lokal dari antrean jika request gagal
    }
  };

  // =====================================
  // PERUBAHAN STATUS ANTREAN VIA API
  // =====================================

  const handleUbahStatus = async (statusBaru, idJadwalBaruVal = null) => {
    if (!antreanTerpilih) return;

    setSubmitting(true);
    setPesanError("");

    try {
      const payload = {
        status_antrian: statusBaru,
        versi: antreanTerpilih.versi,
      };

      if (idJadwalBaruVal) {
        payload.id_jadwal_baru = String(idJadwalBaruVal);
      }

      const res = await fetch(`/api/antrean/${antreanTerpilih.id_antrian}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui status antrean.");
      }

      // Update state lokal
      const versiBaru = json.data?.versi || antreanTerpilih.versi + 1;
      const dataTerupdate = {
        ...antreanTerpilih,
        status: statusBaru,
        status_antrian: statusBaru,
        versi: versiBaru,
        ...(json.data?.tanggal ? { tanggal: json.data.tanggal } : {}),
        ...(json.data?.jam_mulai ? { jamMulai: json.data.jam_mulai.slice(0, 5) } : {}),
        ...(json.data?.jam_selesai ? { jamSelesai: json.data.jam_selesai.slice(0, 5) } : {}),
      };

      setDaftarAntrean((prev) =>
        prev.map((a) => (a.id === antreanTerpilih.id ? dataTerupdate : a))
      );
      setAntreanTerpilih(dataTerupdate);

      if (statusBaru === "Menunggu" && idJadwalBaruVal) {
        setDataSukses({
          jenis: "jadwal",
          antrean: dataTerupdate,
        });
        setTampilan("reschedule-success");
      }
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat memperbarui status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePanggil = () => handleUbahStatus("Dipanggil");
  const handleSelesai = () => handleUbahStatus("Selesai");
  const handleTunda = () => handleUbahStatus("Ditunda");

  // =====================================
  // MENYIMPAN CATATAN BIMBINGAN VIA API
  // =====================================

  const handleSimpanCatatan = async () => {
    if (!antreanTerpilih) return;

    if (!catatanEdit.trim()) {
      alert("Catatan bimbingan tidak boleh kosong.");
      return;
    }

    setSubmitting(true);
    setPesanError("");

    try {
      const isEdit = Boolean(idCatatanAktif);
      const url = isEdit
        ? `/api/antrean/${antreanTerpilih.id_antrian}/catatan/${idCatatanAktif}`
        : `/api/antrean/${antreanTerpilih.id_antrian}/catatan`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isi_catatan: catatanEdit.trim() }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan catatan bimbingan.");
      }

      const catatanTersimpan = json.data;
      setIdCatatanAktif(catatanTersimpan.id_catatan);

      const antreanBaru = {
        ...antreanTerpilih,
        catatan: catatanEdit.trim(),
        id_catatan: catatanTersimpan.id_catatan,
      };

      setDaftarAntrean((prev) =>
        prev.map((a) => (a.id === antreanTerpilih.id ? antreanBaru : a))
      );
      setAntreanTerpilih(antreanBaru);

      setDataSukses({
        jenis: "catatan",
        antrean: antreanBaru,
      });

      setTampilan("note-success");
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat menyimpan catatan bimbingan.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================
  // MEMBUKA FORM JADWAL ULANG
  // =====================================

  const handleBukaJadwalUlang = () => {
    if (!antreanTerpilih) return;
    setIdJadwalBaru("");
    setTampilan("reschedule");
  };

  // =====================================
  // MENYIMPAN JADWAL ULANG
  // =====================================

  const handleSimpanJadwalUlang = async (e) => {
    e.preventDefault();

    if (!idJadwalBaru) {
      alert("Silakan pilih jadwal baru untuk menjadwalkan ulang antrean ini.");
      return;
    }

    if (String(idJadwalBaru) === String(antreanTerpilih.id_jadwal)) {
      alert("Jadwal baru harus berbeda dari jadwal sebelumnya.");
      return;
    }

    await handleUbahStatus("Menunggu", idJadwalBaru);
  };

  // =====================================
  // KEMBALI KE ANTREAN
  // =====================================

  const handleKembaliAntrean = () => {
    setTampilan("list");
    setAntreanTerpilih(null);
    setDataSukses(null);
    setCatatanEdit("");
    setIdCatatanAktif(null);
  };

  // =====================================
  // RENDER HALAMAN
  // =====================================

  return (
    <div className="halaman-kelola-antrean">
      <SidebarDosen
        activePage="antrean"
        onNavigate={onNavigate}
        onLogout={onLogout}
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
                Kelola pemanggilan antrean sesi bimbingan dan berikan arahan revisi kepada mahasiswa.
              </p>
            </div>

            {/* Ringkasan alur status */}
            <div className="ringkasan-antrean">
              Alur status: Menunggu → Dipanggil → Selesai.
              Penundaan hanya dapat dilakukan saat antrean Menunggu/Dipanggil.
              Jadwalkan ulang hanya dapat dilakukan saat antrean Ditunda.
            </div>

            {pesanError && (
              <div style={{
                padding: "12px 16px",
                marginBottom: "16px",
                backgroundColor: "#fdf2f2",
                border: "1px solid #f8b4b4",
                borderRadius: "6px",
                color: "#9b1c1c",
                fontSize: "13px"
              }}>
                {pesanError}
              </div>
            )}

            {/* Tabel antrean */}
            <section className="tabel-antrean">
              <div className="baris-antrean header-tabel-antrean">
                <span>Nomor / Mahasiswa</span>
                <span>Status</span>
                <span>Waktu &amp; Sesi</span>
              </div>

              {loading ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#087568", fontWeight: "600" }}>
                  Memuat daftar antrean mahasiswa...
                </div>
              ) : daftarAntrean.length === 0 ? (
                <div style={{ padding: "28px", textAlign: "center", color: "#879791" }}>
                  Belum ada antrean mahasiswa terdaftar pada jadwal Anda.
                </div>
              ) : (
                daftarAntrean.map((antrean) => (
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

                    <span style={{ fontSize: "11px", color: "#718096" }}>
                      {antrean.tanggal || "-"} ({antrean.jamMulai}–{antrean.jamSelesai})
                    </span>
                  </div>
                ))
              )}
            </section>

            {/* Panel detail mahasiswa & input catatan bimbingan */}
            {antreanTerpilih && (
              <section className="panel-detail-antrean">
                <h2>
                  Antrean terpilih • {antreanTerpilih.nomor} • {antreanTerpilih.nama}
                </h2>

                <p className="informasi-detail-antrean">
                  {formatTanggal(antreanTerpilih.tanggal)}
                  {" • "}
                  {formatWaktu(
                    antreanTerpilih.jamMulai,
                    antreanTerpilih.jamSelesai
                  )}
                  {antreanTerpilih.ruang ? ` • Ruang: ${antreanTerpilih.ruang}` : ""}
                </p>

                {/* Tombol tindakan sesuai status */}
                <div className="aksi-status-antrean">
                  {antreanTerpilih.status === "Menunggu" && (
                    <>
                      <button
                        type="button"
                        className="tombol-aksi-utama"
                        disabled={submitting}
                        onClick={handlePanggil}
                      >
                        {submitting ? "Memproses..." : "Panggil Mahasiswa"}
                      </button>

                      <button
                        type="button"
                        className="tombol-aksi-sekunder"
                        disabled={submitting}
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
                        disabled={submitting}
                        onClick={handleSelesai}
                      >
                        {submitting ? "Memproses..." : "Selesaikan Sesi"}
                      </button>

                      <button
                        type="button"
                        className="tombol-aksi-sekunder"
                        disabled={submitting}
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
                      disabled={submitting}
                      onClick={handleBukaJadwalUlang}
                    >
                      Jadwalkan Ulang
                    </button>
                  )}

                  {antreanTerpilih.status === "Selesai" && (
                    <span className="keterangan-status-selesai">
                      Sesi bimbingan telah selesai. Anda tetap dapat memperbarui catatan bimbingan mahasiswa di bawah ini.
                    </span>
                  )}
                </div>

                {/* Input panel catatan bimbingan dosen */}
                <div className="form-catatan-antrean">
                  <label htmlFor="catatan-bimbingan">
                    Catatan Arahan Bimbingan &amp; Revisi
                  </label>

                  <textarea
                    id="catatan-bimbingan"
                    value={catatanEdit}
                    onChange={(e) => setCatatanEdit(e.target.value)}
                    placeholder="Tuliskan catatan arahan bimbingan, revisi skripsi, atau feedback untuk mahasiswa..."
                    rows={4}
                    disabled={submitting}
                  />
                  <small style={{ color: "#718096", fontSize: "11px", marginTop: "4px", display: "block" }}>
                    * Catatan ini tersimpan secara aman dan hanya dapat dibaca oleh mahasiswa bersangkutan.
                  </small>
                </div>

                <button
                  type="button"
                  className="tombol-simpan-catatan"
                  disabled={submitting}
                  onClick={handleSimpanCatatan}
                >
                  {submitting ? "Menyimpan Catatan..." : idCatatanAktif ? "Perbarui Catatan" : "Simpan Catatan"}
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
                Pindahkan antrean berstatus Ditunda ke jadwal bimbingan lain yang aktif dan tersedia.
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
                Status saat ini: Ditunda
                <br />
                Jadwal lama: {formatTanggal(antreanTerpilih.tanggal)} ({antreanTerpilih.jamMulai}–{antreanTerpilih.jamSelesai} WIB)
              </p>

              {/* Pilih jadwal tujuan */}
              <div className="form-antrean-grup">
                <label htmlFor="jadwal-tujuan">
                  Pilih Jadwal Bimbingan Baru
                </label>
                <select
                  id="jadwal-tujuan"
                  value={idJadwalBaru}
                  onChange={(e) => setIdJadwalBaru(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Jadwal Tersedia --</option>
                  {jadwalTersedia
                    .filter((j) => String(j.id_jadwal) !== String(antreanTerpilih.id_jadwal))
                    .map((j) => (
                      <option key={j.id_jadwal} value={j.id_jadwal}>
                        {j.tanggal} ({j.jam_mulai?.slice(0, 5)} - {j.jam_selesai?.slice(0, 5)} WIB) • Kuota: {j.kuota_mhs} mhs
                      </option>
                    ))}
                </select>
              </div>

              <div className="aksi-form-antrean">
                <button
                  type="submit"
                  className="tombol-aksi-utama"
                  disabled={submitting}
                >
                  {submitting ? "Memproses..." : "Konfirmasi Jadwal Ulang"}
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
                {dataSukses.antrean.nomor} • {dataSukses.antrean.nama}
              </h2>

              <p>
                Jadwal baru: {formatTanggal(dataSukses.antrean.tanggal)}
              </p>

              <p>
                Waktu: {formatWaktu(
                  dataSukses.antrean.jamMulai,
                  dataSukses.antrean.jamSelesai
                )}
              </p>

              <p>
                Status: {dataSukses.antrean.status}
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
              <h1>Catatan bimbingan berhasil disimpan</h1>
              <p>Catatan arahan telah tercatat dan notifikasi diteruskan ke mahasiswa.</p>
            </div>

            <div className="informasi-antrean-tersimpan">
              <p style={{ fontWeight: "700", color: "#155e56", fontSize: "14px" }}>
                {dataSukses.antrean.nomor} • {dataSukses.antrean.nama}
              </p>

              <p style={{ whiteSpace: "pre-wrap", color: "#2d3748" }}>
                "{dataSukses.antrean.catatan}"
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
