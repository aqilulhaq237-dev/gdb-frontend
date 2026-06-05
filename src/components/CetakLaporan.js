import React, { useEffect, useState } from 'react';
import API from '../services/api';

function CetakLaporan({ user, onLogout, onNavigate }) {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Ambil daftar program kerja
  const fetchPrograms = async () => {
    try {
      const response = await API.get('/program-kerja');
      if (response.data.status === 'success') {
        setPrograms(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil program kerja:', error);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleProgramChange = (e) => {
    setSelectedProgram(e.target.value);
    setMessage('');
  };

  const handleCetak = async () => {
    if (!selectedProgram) {
      setMessage('❌ Pilih program kerja terlebih dahulu');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Open PDF in new tab
      window.open(`https://gdb-backend-production-4dd1.up.railway.app/api/laporan-pdf/${selectedProgram}`, '_blank');
      setMessage('✅ Laporan PDF sedang diproses...');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('❌ Gagal mencetak laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary">Cetak Laporan Keuangan</h1>
        <div className="d-flex align-items-center gap-2">
          <span className="me-2">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary me-2">{user.role}</span>
          <button className="btn btn-outline-secondary me-2" onClick={() => onNavigate('dashboard')}>
            Dashboard
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">🖨️ Cetak Laporan PDF</h5>
        </div>
        <div className="card-body">
          {message && (
            <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} mb-3`}>
              {message}
            </div>
          )}

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Pilih Program Kerja</label>
              <select className="form-select" value={selectedProgram} onChange={handleProgramChange}>
                <option value="">-- Pilih Program Kerja --</option>
                {programs.map(program => (
                  <option key={program.id_program} value={program.id_program}>
                    {program.nama_program} - {program.periode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCetak}
            disabled={loading || !selectedProgram}
          >
            {loading ? 'Memproses...' : '🖨️ Cetak Laporan PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CetakLaporan;