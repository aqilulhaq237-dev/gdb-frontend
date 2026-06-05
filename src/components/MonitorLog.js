import React, { useEffect, useState } from 'react';
import API from '../services/api';

function MonitorLog({ user, onLogout, onNavigate }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    start_date: '',
    end_date: '',
    aktivitas: ''
  });
  const [message, setMessage] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await API.get('/logs');
      if (response.data.status === 'success') {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data log:', error);
      setMessage('❌ Gagal mengambil data log');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredLogs = async () => {
    setLoading(true);
    try {
      let url = '/logs?';
      if (filter.start_date) url += `start_date=${filter.start_date}&`;
      if (filter.end_date) url += `end_date=${filter.end_date}&`;
      if (filter.aktivitas) url += `aktivitas=${filter.aktivitas}&`;
      
      const response = await API.get(url);
      if (response.data.status === 'success') {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error('Gagal memfilter log:', error);
      setMessage('❌ Gagal memfilter data log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const applyFilter = () => {
    fetchFilteredLogs();
  };

  const resetFilter = () => {
    setFilter({ start_date: '', end_date: '', aktivitas: '' });
    fetchLogs();
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString('id-ID');
  };

  const getAktivitasBadge = (aktivitas) => {
    switch (aktivitas) {
      case 'Login': return 'bg-success';
      case 'Logout': return 'bg-secondary';
      case 'Tambah': return 'bg-primary';
      case 'Ubah': return 'bg-warning';
      case 'Hapus': return 'bg-danger';
      default: return 'bg-info';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" />
        <p>Memuat data log...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary">Monitor Log Aktivitas</h1>
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

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} mb-3`}>
          {message}
        </div>
      )}

      {/* Filter */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">🔍 Filter Log</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">Tanggal Mulai</label>
              <input
                type="date"
                className="form-control"
                name="start_date"
                value={filter.start_date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Tanggal Akhir</label>
              <input
                type="date"
                className="form-control"
                name="end_date"
                value={filter.end_date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Jenis Aktivitas</label>
              <select className="form-select" name="aktivitas" value={filter.aktivitas} onChange={handleFilterChange}>
                <option value="">Semua</option>
                <option value="Login">Login</option>
                <option value="Logout">Logout</option>
                <option value="Tambah">Tambah</option>
                <option value="Ubah">Ubah</option>
                <option value="Hapus">Hapus</option>
                <option value="Transaksi">Transaksi</option>
              </select>
            </div>
            <div className="col-md-3 mb-3 d-flex align-items-end gap-2">
              <button className="btn btn-primary" onClick={applyFilter}>
                🔍 Filter
              </button>
              <button className="btn btn-secondary" onClick={resetFilter}>
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Log */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">📋 Riwayat Aktivitas</h5>
        </div>
        <div className="card-body">
          {logs.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">Belum ada aktivitas yang tercatat</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Waktu</th>
                    <th>Pengguna</th>
                    <th>Aktivitas</th>
                    <th>Deskripsi</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id_log}>
                      <td>{formatDateTime(log.waktu)}</td>
                      <td>{log.pengguna || '-'}</td>
                      <td>
                        <span className={`badge ${getAktivitasBadge(log.aktivitas)}`}>
                          {log.aktivitas}
                        </span>
                      </td>
                      <td>{log.deskripsi || '-'}</td>
                      <td>{log.ip_address || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonitorLog;