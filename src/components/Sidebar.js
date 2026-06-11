import React, { useState } from "react";

function Sidebar({
  activeMenu,
  onNavigate,
  user,
  onLogout,
  onToggle,
  isSidebarOpen,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const isOpen = isSidebarOpen;

  const toggleDropdown = (menuId) => {
    setOpenDropdown(openDropdown === menuId ? null : menuId);
  };

  const adminMenu = [
    { id: "dashboard", name: "Dashboard", icon: "🏠" },
    { id: "kelola-user", name: "Kelola Pengguna", icon: "👥" },
    { id: "kelola-kategori", name: "Kelola Kategori Program", icon: "📂" },
    { id: "periode-aktif", name: "Kelola Periode Aktif", icon: "📅" },
    { id: "kelola-biaya", name: "Kelola Daftar Biaya", icon: "💰" },
    { id: "riwayat", name: "Riwayat Pelaksanaan", icon: "📜" },
    { id: "lihat-laporan", name: "Lihat Laporan Keuangan", icon: "📄" },
    { id: 'monitor-log', name: 'Monitor Log', icon: '📋' },
  ];

  const ketuaMenu = [
    { id: "dashboard", name: "Dashboard", icon: "🏠" },
    { id: "periode-aktif", name: "Kelola Periode Aktif", icon: "📅" },
    { id: "kelola-biaya", name: "Kelola Daftar Biaya", icon: "💰" },
    { id: "kelola-rab", name: "Kelola RAB", icon: "📊" },
    { id: 'monitor-log', name: 'Monitor Log', icon: '📋' },
    {
      id: "manajemen-proker",
      name: "Manajemen Program Kerja",
      icon: "📋",
      isDropdown: true,
      children: [
        { id: "program-kerja", name: "Kelola Program Kerja", icon: "📋" },
        { id: "update-status", name: "Kelola Status Program Kerja", icon: "🔄" },
        { id: "konfirmasi-transaksi", name: "Konfirmasi Transaksi", icon: "✅" },
      ],
    },
    { id: "riwayat", name: "Riwayat Pelaksanaan", icon: "📜" },
    { id: "lihat-laporan", name: "Lihat Laporan Keuangan", icon: "📄" },
  ];

  const bendaharaMenu = [
    { id: "dashboard", name: "Dashboard", icon: "🏠" },
    { id: "transaksi", name: "Transaksi Kas", icon: "💰" },
    { id: "riwayat", name: "Riwayat Pelaksanaan", icon: "📜" },
    { id: "lihat-laporan", name: "Lihat Laporan Keuangan", icon: "📄" },
  ];

  const anggotaMenu = [
    { id: "dashboard", name: "Dashboard", icon: "🏠" },
    { id: "riwayat", name: "Riwayat Pelaksanaan", icon: "📜" },
    { id: "lihat-laporan", name: "Lihat Laporan Keuangan", icon: "📄" },
  ];

  let menus = [];
  if (user.role === 'Admin') menus = adminMenu;
  else if (user.role === 'Ketua') menus = ketuaMenu;
  else if (user.role === 'Bendahara') menus = bendaharaMenu;
  else if (user.role === 'Anggota Umum') menus = anggotaMenu;

  const renderMenuItem = (item) => (
    <button
      key={item.id}
      className={`nav-link text-start text-white mb-1 ${activeMenu === item.id ? "bg-primary rounded" : ""}`}
      onClick={() => onNavigate(item.id)}
      style={{
        backgroundColor: activeMenu === item.id ? "#0d6efd" : "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 12px",
        borderRadius: "5px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
      }}
    >
      <span>{item.icon}</span>
      {isOpen && <span>{item.name}</span>}
    </button>
  );

  const renderDropdownMenu = (item) => (
    <div key={item.id} className="mb-1">
      <button
        className={`nav-link text-start text-white ${openDropdown === item.id ? "bg-primary rounded" : ""}`}
        onClick={() => toggleDropdown(item.id)}
        style={{
          backgroundColor: openDropdown === item.id ? "#0d6efd" : "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px 12px",
          borderRadius: "5px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>{item.icon}</span>
          {isOpen && <span>{item.name}</span>}
        </div>
        {isOpen && <span>{openDropdown === item.id ? "▲" : "▼"}</span>}
      </button>

      {isOpen && openDropdown === item.id && (
        <div className="ms-3 mt-1">
          {item.children.map((child) => (
            <button
              key={child.id}
              className={`nav-link text-start text-white mb-1 ${activeMenu === child.id ? "bg-primary rounded" : ""}`}
              onClick={() => onNavigate(child.id)}
              style={{
                backgroundColor: activeMenu === child.id ? "#0d6efd" : "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
                paddingLeft: "35px",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
              }}
            >
              <span>{child.icon}</span>
              <span>{child.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="d-flex flex-column vh-100 bg-dark text-white"
      style={{
        width: isOpen ? "280px" : "70px",
        position: "fixed",
        left: 0,
        top: 0,
        transition: "width 0.3s ease",
        overflowX: "hidden",
        zIndex: 1000,
      }}
    >
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
        {isOpen && (
          <div>
            <h6 className="mb-0">GDB Cash Management</h6>
            <small className="text-muted">{user.nama_lengkap}</small>
            <br />
            <span className="badge bg-info mt-1">{user.role}</span>
          </div>
        )}
        <button
          className="btn rounded-circle d-flex align-items-center justify-content-center"
          onClick={() => onToggle(!isSidebarOpen)}
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: "#1976D2",
            border: "none",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
            marginLeft: isOpen ? "0" : "auto",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0b5ed7")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1976D2")}
          title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      <nav className="nav flex-column mt-3 px-2 overflow-auto" style={{ flex: 1 }}>
        {menus.map((item) => {
          if (item.isDropdown) return renderDropdownMenu(item);
          else return renderMenuItem(item);
        })}
      </nav>

      <hr className="mx-2 my-2" />

      <div className="px-2 mb-2">
        <button
          className={`nav-link text-start text-white w-100 ${activeMenu === "profil" ? "bg-primary rounded" : ""}`}
          onClick={() => onNavigate("profil")}
          style={{
            backgroundColor: activeMenu === "profil" ? "#0d6efd" : "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px 12px",
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>👤</span>
          {isOpen && <span>Profil Saya</span>}
        </button>
      </div>

      <div className="mt-auto p-3 border-top border-secondary">
        <button
          className="btn btn-danger w-100"
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "8px",
          }}
        >
          <span>🚪</span>
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;