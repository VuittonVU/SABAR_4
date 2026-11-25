
import "./style.css";

export const SidebarDosen = ({ activePage, onNavigate }) => {
  // Daftar menu sidebar
  const menuSidebar = [
    {
      label: "Beranda",
      path: "/dashboard-dosen",
      page: "dashboard",
    },
    {
      label: "Jadwal & Kuota",
      path: "/kelola-jadwal",
      page: "jadwal",
    },
    {
      label: "Kelola Antrean",
      path: "/kelola-antrean",
      page: "antrean",
    },
    {
      label: "Riwayat",
      path: "/riwayat",
      page: "riwayat",
    },
  ];

  return (
    <aside className="sidebar-SABAR">
      <div className="sidebar-logo">Sabar</div>
      <div className="sidebar-role">DOSEN</div>

      {/* Menu navigasi */}
      {menuSidebar.map((menu) => {
        const isActive = activePage === menu.page;

        return (
          <button
            key={menu.path}
            type="button"
            className={
              isActive
                ? "sidebar-menu aktif"
                : "sidebar-menu"
            }
            onClick={() => onNavigate(menu.path)}
          >
            <span>{menu.label}</span>
          </button>
        );
      })}

      {/* Tombol keluar */}
      <button
        type="button"
        className="sidebar-menu"
        onClick={() => onNavigate("/login")}
      >
        <span>Keluar</span>
      </button>
    </aside>
  );
};
