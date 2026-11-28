import { useEffect, useRef, useState } from "react";
import { SidebarDosen } from "../../Components/SidebarDosen.jsx";
import "./Style.css";

export const Riwayat = ({ onNavigate, onLogout, user }) => {
  const [daftarRiwayat, setDaftarRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pesanError, setPesanError] = useState("");

  // tampilan: list / detail
  const [tampilan, setTampilan] = useState("list");
  const [riwayatTerpilih, setRiwayatTerpilih] = useState(null);
  const inputFileRef = useRef(null);

  const token = localStorage.getItem("token");

  // Format tanggal Indonesia
  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";
    const [tahun, bulan, hari] = tanggal.split("-");
    const tanggalObj = new Date(Number(tahun), Number(bulan) - 1, Number(hari));
    return tanggalObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTanggalSingkat = (tanggal) => {
    if (!tanggal) return "-";
    const tanggalObj = new Date(tanggal.slice(0, 10) + "T00:00:00");
    return tanggalObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
    });
  };

  const formatUkuranFile = (bytes) => {
    if (!bytes || Number.isNaN(bytes)) return "-";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const normalisasiRiwayat = (item) => {
    const berkasMapped = (item.berkas_revisi || []).map((b, idx, arr) => ({
      id: b.id_berkas,
      versi: `v${arr.length - idx}`,
      namaFile: b.nama_file,
      tanggal: b.waktu_upload?.slice(0, 10) || item.tanggal,
      ringkasan: b.status_revisi || "Berkas revisi mahasiswa",
      ukuran: formatUkuranFile(Number(b.ukuran_file)),
    }));

    return {
      id: item.id_antrian,
      id_antrian: item.id_antrian,
      id_jadwal: item.id_jadwal,
      tanggal: item.tanggal,
      kode: `#${item.nomor_antrian}`,
      nomor_antrian: item.nomor_antrian,
      nama: item.nama_mahasiswa || "Mahasiswa",
      status: item.status_antrian,
      waktu: item.linimasa || `${item.jam_mulai}–${item.jam_selesai} WIB`,
      catatan: item.catatan_terbaru || "Belum ada catatan.",
      catatanList: item.catatan_bimbingan || [],
      versi: berkasMapped.length > 0 ? berkasMapped : [
        {
          id: 1,
          versi: "v1",
          namaFile: "Draft_Skripsi_Revisi.pdf",
          tanggal: item.tanggal,
          ringkasan: "Draft berkas bimbingan sesi ini",
          ukuran: "2.1 MB",
        }
      ],
      riwayatStatus: item.riwayat_status || [],
      ruang: item.ruang || "",
    };
  };

  const muatDataRiwayat = async () => {
    setLoading(true);
    setPesanError("");
    try {
      const res = await fetch("/api/riwayat", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setDaftarRiwayat(json.data.map(normalisasiRiwayat));
      } else {
        setDaftarRiwayat([]);
      }
    } catch (err) {
      setPesanError(err.message || "Gagal memuat arsip riwayat bimbingan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatDataRiwayat();
  }, []);

  const handleBukaDetail = (riwayat) => {
    setRiwayatTerpilih(riwayat.id);
    setTampilan("detail");
  };

  const riwayatDetail = daftarRiwayat.find(
    (riwayat) => riwayat.id === riwayatTerpilih
  );

  const handleKembali = () => {
    setTampilan("list");
    setRiwayatTerpilih(null);
  };

  const handlePilihFile = () => {
    inputFileRef.current?.click();
  };

  const handleUploadRevisi = (e) => {
    const file = e.target.files?.[0];
    if (!file || !riwayatDetail) return;

    const ekstensiDiizinkan = ["pdf", "doc", "docx"];
    const ekstensiFile = file.name.split(".").pop().toLowerCase();

    if (!ekstensiDiizinkan.includes(ekstensiFile)) {
      alert("Format file harus PDF, DOC, atau DOCX.");
      e.target.value = "";
      return;
    }

    const nomorVersiTerbesar = Math.max(
      0,
      ...riwayatDetail.versi.map((item) => Number(item.versi.replace("v", "")))
    );

    const sekarang = new Date();
    const versiBaru = {
      id: Date.now(),
      versi: `v${nomorVersiTerbesar + 1}`,
      namaFile: file.name,
      tanggal: sekarang.toISOString().slice(0, 10),
      ringkasan: "Revisi berkas baru telah dicatat.",
      ukuran: formatUkuranFile(file.size),
    };

    setDaftarRiwayat((prev) =>
      prev.map((r) =>
        r.id === riwayatTerpilih
          ? { ...r, versi: [versiBaru, ...r.versi] }
          : r
      )
    );

    alert("Revisi berhasil ditambahkan ke arsip.");
    e.target.value = "";
  };

  return (
    <div className="halaman-riwayat">
      <SidebarDosen
        activePage="riwayat"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="konten-riwayat">
        {tampilan === "list" && (
          <>
            <div className="judul-riwayat">Riwayat Bimbingan Dosen</div>
            <p className="deskripsi-riwayat">
              Telusuri arsip sesi bimbingan, perubahan status kronologis, dan catatan revisi mahasiswa.
            </p>

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

            <div className="daftar-riwayat">
              {loading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#087568", fontWeight: "600" }}>
                  Memuat arsip riwayat bimbingan...
                </div>
              ) : daftarRiwayat.length > 0 ? (
                daftarRiwayat.map((riwayat) => {
                  const berkasTerbaru = riwayat.versi[0];
                  return (
                    <section className="kartu-riwayat" key={riwayat.id}>
                      <div className="info-riwayat-utama">
                        <h3>
                          {formatTanggal(riwayat.tanggal)} • Antrean {riwayat.kode} • {riwayat.status}
                        </h3>
                        <p style={{ fontWeight: "700", color: "#155e56" }}>
                          Mahasiswa: {riwayat.nama}
                        </p>
                        <p style={{ fontSize: "12px", color: "#4a5568" }}>
                          Linimasa: {riwayat.waktu}
                        </p>
                        <p style={{ fontStyle: "italic", color: "#2d3748" }}>
                          Catatan: "{riwayat.catatan}"
                        </p>
                        {berkasTerbaru && (
                          <p style={{ fontSize: "12px", color: "#718096" }}>
                            Berkas: {berkasTerbaru.namaFile} ({berkasTerbaru.ukuran})
                          </p>
                        )}
                      </div>

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
                  Belum ada arsip riwayat bimbingan yang tercatat.
                </p>
              )}
            </div>
          </>
        )}

        {tampilan === "detail" && riwayatDetail && (
          <>
            <div className="judul-riwayat">Detail Revisi dan Catatan</div>
            <p className="deskripsi-riwayat">
              Sesi {formatTanggal(riwayatDetail.tanggal)} • Mahasiswa: {riwayatDetail.nama}
            </p>

            {/* INFORMASI BERKAS TERBARU */}
            <section className="kartu-detail-riwayat">
              <h3>{riwayatDetail.versi[0]?.namaFile || "Belum ada berkas"}</h3>
              <p>
                Versi {riwayatDetail.versi[0]?.versi || "-"} • {riwayatDetail.versi[0]?.ukuran || "-"} • Diunggah {formatTanggal(riwayatDetail.versi[0]?.tanggal || riwayatDetail.tanggal)}
              </p>
              <p>
                Terkait antrean {riwayatDetail.kode} • Status: {riwayatDetail.status}
              </p>
            </section>

            {/* CATATAN DOSEN */}
            <section className="kartu-catatan-riwayat">
              <h3>Arahan Catatan Bimbingan</h3>
              {riwayatDetail.catatanList.length > 0 ? (
                <ol>
                  {riwayatDetail.catatanList.map((c, i) => (
                    <li key={c.id_catatan || i}>
                      <strong>({c.updated_at || c.created_at}):</strong> {c.isi_catatan}
                    </li>
                  ))}
                </ol>
              ) : (
                <p style={{ margin: "0 0 10px", fontStyle: "italic", color: "#4a5568" }}>
                  "{riwayatDetail.catatan}"
                </p>
              )}

              <p className="waktu-catatan">
                Dicatat secara persisten pada sistem SABAR • Terlindungi otorisasi mahasiswa.
              </p>
            </section>

            {/* TABEL RIWAYAT STATUS */}
            {riwayatDetail.riwayatStatus.length > 0 && (
              <section className="kartu-versi-riwayat" style={{ marginBottom: "20px" }}>
                <h3 className="judul-tabel-versi">Linimasa Transisi Status</h3>
                <div className="tabel-versi-wrapper">
                  <table className="tabel-versi">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Perubahan Status</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riwayatDetail.riwayatStatus.map((s, idx) => (
                        <tr key={s.id_riwayat || idx}>
                          <td>{s.waktu_perubahan}</td>
                          <td>{s.status_lama || 'Awal'} → <strong>{s.status_baru}</strong></td>
                          <td>{s.catatan_perubahan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TABEL RIWAYAT VERSI BERKAS */}
            <section className="kartu-versi-riwayat">
              <h3 className="judul-tabel-versi">Riwayat Versi Berkas</h3>
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
                          {versi.versi} • {versi.namaFile.split(".").pop().toUpperCase()}
                        </td>
                        <td>{formatTanggalSingkat(versi.tanggal)}</td>
                        <td>{versi.ringkasan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <input
              ref={inputFileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="input-file-riwayat"
              onChange={handleUploadRevisi}
            />

            <div className="aksi-detail-riwayat">
              <button
                type="button"
                className="tombol-upload-riwayat"
                onClick={handlePilihFile}
              >
                Unggah revisi berkas baru
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
