import React from 'react';
import { Nav } from 'react-bootstrap';

function Sidebar({ activeMenu, onNavigate, user, onLogout, onToggle, isSidebarOpen }) {
  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊', roles: ['Admin', 'Ketua', 'Bendahara', 'Anggota Umum'] },
    { id: 'kelola-user', label: '👥 Kelola Pengguna', icon: '👥', roles: ['Admin'] },
    { id: 'periode-aktif', label: '📅 Kelola Periode Aktif', icon: '📅', roles: ['Admin', 'Ketua'] },
    { id: 'kelola-biaya', label: '💰 Kelola Daftar Biaya', icon: '💰', roles: ['Admin', 'Ketua'] },
    { id: 'program-kerja', label: '📋 Program Kerja', icon: '📋', roles: ['Admin', 'Ketua'] },
    { id: 'kelola-rab', label: '💵 Kelola RAB', icon: '💵', roles: ['Admin', 'Ketua'] },
    { id: 'transaksi', label: '💳 Transaksi Kas', icon: '💳', roles: ['Admin', 'Ketua', 'Bendahara'] },
    { id: 'update-status', label: '🔄 Update Status Program', icon: '🔄', roles: ['Admin', 'Ketua'] },
    { id: 'konfirmasi-transaksi', label: '✅ Konfirmasi Transaksi', icon: '✅', roles: ['Admin', 'Ketua'] },
    { id: 'monitor-log', label: '📋 Monitor Log', icon: '📋', roles: ['Admin', 'Ketua'] },
    { id: 'lihat-laporan', label: '📊 Lihat Laporan', icon: '📊', roles: ['Admin', 'Ketua', 'Bendahara', 'Anggota Umum'] },
    { id: 'riwayat', label: '📜 Riwayat Pelaksanaan', icon: '📜', roles: ['Admin', 'Ketua', 'Bendahara', 'Anggota Umum'] },
    { id: 'profil', label: '👤 Profil', icon: '👤', roles: ['Admin', 'Ketua', 'Bendahara', 'Anggota Umum'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="sidebar bg-dark text-white d-flex flex-column" style={{ width: isSidebarOpen ? '250px' : '60px', minHeight: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 1000, transition: 'width 0.3s ease', overflow: 'hidden' }}>
      
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary">
        {isSidebarOpen && (
          <div>
            <span className="fs-6 fw-bold">🏦 GDB Kas</span>
            <br />
            <small className="text-muted">{user?.nama_lengkap}</small>
          </div>
        )}
        <button className="btn btn-sm btn-outline-light" onClick={() => onToggle(!isSidebarOpen)}>
          {isSidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      {isSidebarOpen && (
        <div className="px-3 pt-2">
          <span className="badge bg-info text-dark">{user?.role}</span>
        </div>
      )}

      <Nav className="flex-column flex-grow-1 px-2 py-2">
        {filteredMenu.map((item) => (
          <Nav.Link
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`d-flex align-items-center gap-2 py-2 px-3 rounded mb-1 ${activeMenu === item.id ? 'bg-primary text-white' : 'text-white-50'}`}
            style={{ whiteSpace: 'nowrap', fontSize: '14px', cursor: 'pointer' }}
          >
            <span>{item.icon}</span>
            {isSidebarOpen && <span>{item.label}</span>}
          </Nav.Link>
        ))}
      </Nav>

      <div className="p-3 border-top border-secondary">
        <button className="btn btn-danger btn-sm w-100" onClick={onLogout}>
          {isSidebarOpen ? '🚪 Logout' : '🚪'}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;