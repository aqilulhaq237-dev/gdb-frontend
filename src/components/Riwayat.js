import React from 'react';

function Riwayat({ user, onLogout, onNavigate }) {
  return (
    <div className="container">
      <h1 className="text-primary mb-4">Riwayat Pelaksanaan</h1>
      <div className="card">
        <div className="card-body text-center py-5">
          <h4>📜 Riwayat Pelaksanaan Program Kerja</h4>
          <p className="text-muted">Fitur ini sedang dalam pengembangan.</p>
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Riwayat;