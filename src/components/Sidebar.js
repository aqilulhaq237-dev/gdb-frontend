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
      className={`nav-link text-start text-white mb-1 ${activeMenu === item.id ? "active" : ""}`}
      onClick={() => onNavigate(item.id)}
      style={{
        border: "none",
        cursor: "pointer",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        whiteSpace: "nowrap",
        fontSize: "0.9rem",
      }}
    >
      <span>{item.icon}</span>
      {isOpen && <span>{item.name}</span>}
    </button>
  );

  const renderDropdownMenu = (item) => (
    <div key={item.id} className="mb-2" style={{ margin: "0 4px" }}>
      <button
        className={`nav-link text-start text-white`}
        onClick={() => toggleDropdown(item.id)}
        style={{
          background: openDropdown === item.id 
            ? "rgba(255,255,255,0.2)" 
            : "rgba(255,255,255,0.1)",
          border: "none",
          cursor: "pointer",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          whiteSpace: "nowrap",
          borderRadius: "10px 10px 0 0",
          fontWeight: 600,
          fontSize: "0.9rem",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>{item.icon}</span>
          {isOpen && <span>{item.name}</span>}
        </div>
        {isOpen && <span style={{ fontSize: "0.7rem" }}>{openDropdown === item.id ? "▲" : "▼"}</span>}
      </button>

      {isOpen && openDropdown === item.id && (
        <div style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: "0 0 10px 10px",
          padding: "4px 8px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}>
          {item.children.map((child, index) => (
            <button
              key={child.id}
              className={`nav-link text-start text-white`}
              onClick={() => onNavigate(child.id)}
              style={{
                background: activeMenu === child.id 
                  ? "rgba(255,255,255,0.2)" 
                  : "transparent",
                border: "none",
                cursor: "pointer",
                padding: "9px 12px 9px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                whiteSpace: "nowrap",
                fontSize: "0.85rem",
                borderRadius: activeMenu === child.id ? "8px" : "6px",
                margin: "2px 0",
                transition: "all 0.2s ease",
                borderBottom: index < item.children.length - 1 
                  ? "1px solid rgba(255,255,255,0.05)" 
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (activeMenu !== child.id) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeMenu !== child.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "0.8rem" }}>{child.icon}</span>
              <span>{child.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="sidebar d-flex flex-column text-white"
      style={{
        width: isOpen ? "280px" : "70px",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        transition: "width 0.3s ease",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 1000,
      }}
    >
      {/* Header dengan Logo */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-25">
        {isOpen && (
          <div>
            <img 
              src="/Game Developer Batam.png" 
              alt="Game Developer Batam" 
              style={{ 
                width: "50px", 
                height: "50px", 
                marginBottom: "0.5rem",
                objectFit: "contain"
              }}
            />
            <h6 className="mb-0">GDB Cash Management</h6>
            <small className="text-white-50">{user.nama_lengkap}</small>
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
            backgroundColor: "rgba(255,255,255,0.2)",
            border: "none",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
            marginLeft: isOpen ? "0" : "auto",
            transition: "background 0.3s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.35)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
          title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Menu */}
      <nav className="nav flex-column mt-2 px-2" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {menus.map((item) => {
          if (item.isDropdown) return renderDropdownMenu(item);
          else return renderMenuItem(item);
        })}
      </nav>

      <hr className="mx-2 my-2 border-secondary border-opacity-25" />

      {/* Profil */}
      <div className="px-2 mb-2">
        <button
          className={`nav-link text-start text-white w-100 ${activeMenu === "profil" ? "active" : ""}`}
          onClick={() => onNavigate("profil")}
          style={{
            border: "none",
            cursor: "pointer",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            whiteSpace: "nowrap",
            fontSize: "0.9rem",
          }}
        >
          <span>👤</span>
          {isOpen && <span>Profil Saya</span>}
        </button>
      </div>

      {/* Logout */}
      <div className="mt-auto p-3 border-top border-secondary border-opacity-25">
        <button
          className="btn btn-danger w-100"
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "10px",
            whiteSpace: "nowrap",
            fontSize: "0.9rem",
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