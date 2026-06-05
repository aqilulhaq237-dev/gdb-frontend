import React, { useEffect, useState } from 'react';
import API from '../services/api';

function Dashboard({ user, onLogout, onNavigate }) {
  const [status, setStatus] = useState('Loading...');
  const [stats, setStats] = useState({
    total_pemasukan: 0,
    total_pengeluaran: 0,
    sisa_saldo: 0,
    program_aktif: 0,
    periode_aktif: []
  });
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [anggotaList, setAnggotaList] = useState([]);
  const [totalAnggota, setTotalAnggota] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingAnggota, setLoadingAnggota] = useState(true);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchDashboardData();
    
    // Hanya fetch logs untuk Admin & Ketua
    if (user.role === 'Admin' || user.role === 'Ketua') {
      fetchLogs(1);
    } else {
      setLoadingLogs(false);
    }
    
    // Hanya fetch anggota untuk Admin
    if (user.role === 'Admin') {
      fetchAnggota();
    } else {
      setLoadingAnggota(false);
    }
  }, []);

  useEffect(() => {
    if (user.role === 'Admin' || user.role === 'Ketua') {
      fetchLogs(logPage);
    }
  }, [logPage]);

  const fetchDashboardData = async () => {
    try {
      const healthRes = await API.get('/health');
      setStatus(healthRes.data.message || 'Running');

      const statsRes = await API.get('/dashboard/stats');
      if (statsRes.data.status === 'success') {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      setStatus('Gagal koneksi');
      console.error('Gagal fetch dashboard:', error);
    }
  };

  const fetchLogs = async (page) => {
    setLoadingLogs(true);
    try {
      const response = await API.get(`/logs?page=${page}&limit=${ITEMS_PER_PAGE}`);
      if (response.data.status === 'success') {
        setLogs(response.data.data || []);
        setLogTotalPages(response.data.total_pages || 1);
        setLogTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Gagal memuat log:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchAnggota = async () => {
    setLoadingAnggota(true);
    try {
      const response = await API.get('/users');
      if (response.data.status === 'success') {
        const allUsers = response.data.data || [];
        const anggota = allUsers.filter(u => u.role !== 'Admin').slice(0, 5);
        setAnggotaList(anggota);
        setTotalAnggota(allUsers.length);
      }
    } catch (error) {
      console.error('Gagal memuat anggota:', error);
    } finally {
      setLoadingAnggota(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  const handleLogPageChange = (page) => {
    setLogPage(page);
  };

  const getLogPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (logTotalPages <= maxVisible) {
      for (let i = 1; i <= logTotalPages; i++) pages.push(i);
    } else {
      if (logPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (logPage >= logTotalPages - 2) {
        for (let i = logTotalPages - 4; i <= logTotalPages; i++) pages.push(i);
      } else {
        for (let i = logPage - 2; i <= logPage + 2; i++) pages.push(i);
      }
    }
    return pages;
  };

  const logStart = logs.length > 0 ? (logPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const logEnd = Math.min(logPage * ITEMS_PER_PAGE, logTotal);

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">📊 Dashboard</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-md-3">
          <div className="card bg-success text-white h-100 shadow-sm">
            <div className="card-body text-center py-3">
              <small className="d-block">💰 Total Kas Masuk</small>
              <h5 className="mb-0">{formatRupiah(stats.total_pemasukan)}</h5>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card bg-danger text-white h-100 shadow-sm">
            <div className="card-body text-center py-3">
              <small className="d-block">📤 Total Kas Keluar</small>
              <h5 className="mb-0">{formatRupiah(stats.total_pengeluaran)}</h5>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card bg-info text-white h-100 shadow-sm">
            <div className="card-body text-center py-3">
              <small className="d-block">💵 Sisa Saldo</small>
              <h5 className="mb-0">{formatRupiah(stats.sisa_saldo)}</h5>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card bg-warning h-100 shadow-sm">
            <div className="card-body text-center py-3">
              <small className="d-block">📋 Program Aktif</small>
              <h5 className="mb-0">{stats.program_aktif}</h5>
            </div>
          </div>
        </div>
      </div>

      {/* Info Periode Aktif */}
      {stats.periode_aktif && stats.periode_aktif.length > 0 && (
        <div className="alert alert-info py-2 small mb-4">
          📅 <strong>Periode Aktif:</strong>{' '}
          {stats.periode_aktif.map((t, i) => (
            <span key={i} className="badge bg-success me-1">{t}</span>
          ))}
        </div>
      )}

      {/* Status Backend */}
      <div className="card shadow-sm mb-4">
        <div className="card-body py-2 px-3 small">
          <span className="text-muted">Status Backend:</span>{' '}
          <strong className="text-success">{status}</strong>
          <span className="mx-2">|</span>
          <span className="text-muted">Role:</span> <strong>{user.role}</strong>
          <span className="mx-2">|</span>
          <span className="text-muted">Email:</span> <strong>{user.email}</strong>
        </div>
      </div>

      {/* ========== ADMIN: Monitor Log + Daftar Anggota ========== */}
      {user.role === 'Admin' && (
        <div className="row g-3">
          {/* Kiri: Monitor Log */}
          <div className="col-md-7">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
                <h6 className="mb-0">📋 Monitor Log</h6>
                <span className="badge bg-light text-dark small">{logTotal} aktivitas</span>
              </div>
              <div className="card-body p-2">
                {loadingLogs ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" />
                    <p className="mt-2 small text-muted">Memuat log...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-3 text-muted small">Belum ada aktivitas</div>
                ) : (
                  <>
                    <table className="table table-sm table-bordered mb-0 small">
                      <thead className="table-light text-center">
                        <tr>
                          <th style={{ width: '10%' }}>No</th>
                          <th style={{ width: '45%' }}>Aktivitas</th>
                          <th style={{ width: '45%' }}>Waktu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, index) => (
                          <tr key={log.id_log}>
                            <td className="text-center">{logStart + index}</td>
                            <td>
                              <span className="text-capitalize small">{log.aktivitas}</span>
                              {log.deskripsi && (
                                <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                                  {log.deskripsi.substring(0, 50)}
                                  {log.deskripsi.length > 50 ? '...' : ''}
                                </small>
                              )}
                            </td>
                            <td className="text-center small">{log.waktu || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-2 gap-2">
                      <small className="text-muted">
                        {logStart}-{logEnd} dari {logTotal}
                      </small>
                      {logTotalPages > 1 && (
                        <nav>
                          <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${logPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handleLogPageChange(logPage - 1)}>◀</button>
                            </li>
                            {getLogPageNumbers().map((page) => (
                              <li key={page} className={`page-item ${logPage === page ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handleLogPageChange(page)}>{page}</button>
                              </li>
                            ))}
                            <li className={`page-item ${logPage === logTotalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handleLogPageChange(logPage + 1)}>▶</button>
                            </li>
                          </ul>
                        </nav>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Kanan: Daftar Anggota */}
          <div className="col-md-5">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
                <h6 className="mb-0">👥 Daftar Anggota</h6>
                <span className="badge bg-light text-dark small">{totalAnggota} anggota</span>
              </div>
              <div className="card-body p-2">
                {loadingAnggota ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" />
                    <p className="mt-2 small text-muted">Memuat anggota...</p>
                  </div>
                ) : anggotaList.length === 0 ? (
                  <div className="text-center py-3 text-muted small">Belum ada anggota</div>
                ) : (
                  <>
                    <table className="table table-sm table-bordered mb-3 small">
                      <thead className="table-light text-center">
                        <tr>
                          <th style={{ width: '10%' }}>No</th>
                          <th style={{ width: '55%' }}>Nama</th>
                          <th style={{ width: '35%' }}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anggotaList.map((anggota, index) => (
                          <tr key={anggota.id_user}>
                            <td className="text-center">{index + 1}</td>
                            <td>{anggota.nama_lengkap}</td>
                            <td className="text-center">
                              <span className={`badge small ${
                                anggota.role === 'Admin' ? 'bg-danger' :
                                anggota.role === 'Ketua' ? 'bg-primary' :
                                anggota.role === 'Bendahara' ? 'bg-warning text-dark' :
                                'bg-secondary'
                              }`}>
                                {anggota.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="text-center">
                      <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => onNavigate('kelola-user')}
                      >
                        🔍 Lihat Semua Anggota
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== KETUA: Hanya Monitor Log ========== */}
      {user.role === 'Ketua' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
                <h6 className="mb-0">📋 Monitor Log</h6>
                <span className="badge bg-light text-dark small">{logTotal} aktivitas</span>
              </div>
              <div className="card-body p-2">
                {loadingLogs ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" />
                    <p className="mt-2 small text-muted">Memuat log...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-3 text-muted small">Belum ada aktivitas</div>
                ) : (
                  <>
                    <table className="table table-sm table-bordered mb-0 small">
                      <thead className="table-light text-center">
                        <tr>
                          <th style={{ width: '8%' }}>No</th>
                          <th style={{ width: '40%' }}>Aktivitas</th>
                          <th style={{ width: '17%' }}>Pengguna</th>
                          <th style={{ width: '35%' }}>Waktu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, index) => (
                          <tr key={log.id_log}>
                            <td className="text-center">{logStart + index}</td>
                            <td>
                              <span className="text-capitalize small">{log.aktivitas}</span>
                              {log.deskripsi && (
                                <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                                  {log.deskripsi.substring(0, 50)}
                                  {log.deskripsi.length > 50 ? '...' : ''}
                                </small>
                              )}
                            </td>
                            <td className="small">{log.pengguna || '-'}</td>
                            <td className="text-center small">{log.waktu || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-2 gap-2">
                      <small className="text-muted">
                        {logStart}-{logEnd} dari {logTotal}
                      </small>
                      {logTotalPages > 1 && (
                        <nav>
                          <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${logPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handleLogPageChange(logPage - 1)}>◀</button>
                            </li>
                            {getLogPageNumbers().map((page) => (
                              <li key={page} className={`page-item ${logPage === page ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handleLogPageChange(page)}>{page}</button>
                              </li>
                            ))}
                            <li className={`page-item ${logPage === logTotalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handleLogPageChange(logPage + 1)}>▶</button>
                            </li>
                          </ul>
                        </nav>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== BENDAHARA & ANGGOTA UMUM: Dashboard Sederhana ========== */}
      {(user.role === 'Bendahara' || user.role === 'Anggota Umum') && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white py-2">
                <h6 className="mb-0">ℹ️ Informasi Sistem</h6>
              </div>
              <div className="card-body py-3">
                <div className="row text-center">
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">Status Backend</small>
                    <strong className="text-success">{status}</strong>
                  </div>
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">Role</small>
                    <strong>{user.role}</strong>
                  </div>
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">Email</small>
                    <strong>{user.email}</strong>
                  </div>
                </div>
                {stats.periode_aktif && stats.periode_aktif.length > 0 && (
                  <div className="text-center mt-2">
                    <small className="text-muted">📅 Periode Aktif:</small>{' '}
                    {stats.periode_aktif.map((t, i) => (
                      <span key={i} className="badge bg-success me-1">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;