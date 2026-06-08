import React from 'react';

function Sidebar({ activeMenu, onNavigate, user, onLogout, onToggle, isSidebarOpen }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['Admin', 'Ketua', 'Bendahara', 'Anggota Umum'] },
    { id: 'kelola-user', label: 'Kelola Pengguna', icon: '👥', roles: ['Admin'] },
    { id: 'periode-aktif', label: 'Periode Aktif', icon: '📅', roles: ['Admin', 'Ketua'] },
    { id: 'kelola-biaya', label: 'Daftar Biaya', icon: '💰', roles: ['Admin', 'Ketua'] },
    { id: 'program-kerja', label: 'Program Kerja', icon: '📋', roles: ['Admin', 'Ketua'] },
    { id: 'kelola-rab', label: 'Kelola RAB', icon: '💵', roles: ['Admin', 'Ketua'] },
    { id: 'transaksi', label: 'Transaksi Kas', icon: '💳', roles: ['Admin', 'Ketua', 'Bendahara'] },
    { id: 'update-status', label: 'Update Status', icon: '🔄', roles: ['Admin', 'Ketua'] },
    { id: 'konfirmasi-transaksi', label: 'Konfirmasi', icon: '✅', roles: ['Admin', 'Ketua'] },
    { id: 'lihat-laporan', label: 'Lihat Laporan', icon: '📊', roles: ['Admin', 'Ketua', 'Bendahara', 'Anggota Umum'] },
    { id: 'riwayat', label: 'Riwayat', icon: '📜', roles: ['Admin', 'Ketua', 'Bendahara', 'Anggota Umum'] },
    { id: 'monitor-log', label: 'Monitor Log', icon: '📋', roles: ['Admin', 'Ketua'] },
    { id: 'profil', label: 'Profil', icon: '👤', roles: ['Admin', 'Ketua', 'Bendahara', 'Anggota Umum'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="sidebar d-flex flex-column" style={{ width: isSidebarOpen ? '240px' : '60px', minHeight: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 1000, transition: 'width 0.25s ease', overflow: 'hidden' }}>
      
      {/* Header */}
      <div className="sidebar-header d-flex align-items-center justify-content-between">
        {isSidebarOpen && (
          <div>
            <div className="sidebar-brand">🏦 GDB Kas</div>
            <div className="sidebar-role mt-1">{user?.role}</div>
          </div>
        )}
        <button className="btn-toggle" onClick={() => onToggle(!isSidebarOpen)}>
          {isSidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      {/* Menu */}
      <nav className="flex-grow-1 py-2" style={{ overflowY: 'auto' }}>
        {filteredMenu.map((item) => (
          <a
            key={item.id}
            className={`nav-link ${activeMenu === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            style={{ cursor: 'pointer' }}
          >
            <span className="nav-icon">{item.icon}</span>
            {isSidebarOpen && <span>{item.label}</span>}
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="btn-logout" onClick={onLogout}>
          {isSidebarOpen ? '🚪 Logout' : '🚪'}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;