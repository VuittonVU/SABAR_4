
import "./style.css";
import { SidebarDosen } from "../../Components/SidebarDosen.jsx";

export const DashboardDosen = ({ onNavigate }) => {
  return (
    <div className="dashboard-dosen">

      {/* Sidebar dari komponen bersama */}
      <SidebarDosen
        activePage="dashboard"
        onNavigate={onNavigate}
      />

      {/* Konten utama */}
      <main className="konten-SABAR">
        <div className="text-wrapper-4">
          Dashboard Dosen
        </div>

        <p className="p">
          Ringkasan bimbingan hari ini • Dr. Jhon Doe, M.Kom.
        </p>

        {/* Informasi sesi aktif */}
        <section className="sesi-aktif">
          <p className="text-wrapper-5">
            Sesi aktif • 5 November 2026
          </p>

          <p className="element-WIB">
            10.00–12.30 WIB
            <br />
            10 peserta • 4 selesai • 1 dipanggil • 5 menunggu
          </p>
        </section>

        {/* Tombol navigasi */}
        <button
          type="button"
          className="kelola-antrean"
          onClick={() => onNavigate("/kelola-antrean")}
        >
          <span className="text-wrapper-6">
            Kelola antrean
          </span>
        </button>

        <button
          type="button"
          className="kelola-jadwal-dan"
          onClick={() => onNavigate("/kelola-jadwal")}
        >
          <span className="text-wrapper-7">
            Kelola jadwal dan kuota
          </span>
        </button>

        <button
          type="button"
          className="riwayat-bimbingan"
          onClick={() => onNavigate("/riwayat")}
        >
          <span className="text-wrapper-8">
            Riwayat bimbingan
          </span>
        </button>
      </main>
    </div>
  );
};
