import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

// Register ChartJS
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Dashboard({ user, onLogout, onNavigate }) {
  const [status, setStatus] = useState('Loading...');
  const [stats, setStats] = useState({
    total_pemasukan: 0,
    total_pengeluaran: 0,
    sisa_saldo: 0,
    program_aktif: 0,
    periode_aktif: [],
  });
  const [programList, setProgramList] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const healthRes = await API.get('/health');
      setStatus(healthRes.data.message || 'Running');

      const statsRes = await API.get('/dashboard/stats');
      if (statsRes.data.status === 'success') {
        setStats(statsRes.data.data);
      }

      // Ambil program untuk tabel
      const progRes = await API.get('/program-kerja');
      if (progRes.data.status === 'success') {
        const periodeAktif = statsRes.data.data?.periode_aktif || [];
        let filtered = progRes.data.data;
        if (periodeAktif.length > 0) {
          filtered = filtered.filter((p) =>
            periodeAktif.some((periode) => p.periode?.toString() === periode.toString())
          );
        }
        setProgramList(filtered.slice(0, 5)); // 5 terbaru
      }

      // Ambil transaksi untuk chart
      const transRes = await API.get('/transaksi');
      if (transRes.data.status === 'success') {
        setTransaksiList(transRes.data.data);
      }
    } catch (error) {
      console.error('Gagal fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  // Data Pie Chart
  const pieData = {
    labels: ['Pemasukan', 'Pengeluaran'],
    datasets: [
      {
        data: [stats.total_pemasukan, stats.total_pengeluaran],
        backgroundColor: ['#28a745', '#dc3545'],
        borderColor: ['#1e7e34', '#b02a37'],
        borderWidth: 2,
      },
    ],
  };

  // Data Bar Chart - Transaksi per Program
  const programNames = [...new Set(transaksiList.map((t) => t.nama_program))];
  const barData = {
    labels: programNames,
    datasets: [
      {
        label: 'Total Transaksi',
        data: programNames.map((name) =>
          transaksiList
            .filter((t) => t.nama_program === name)
            .reduce((sum, t) => sum + t.nominal, 0)
        ),
        backgroundColor: '#007bff',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 12 } },
      },
    },
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-success';
      case 'Berjalan':
        return 'bg-primary';
      case 'Batal':
        return 'bg-danger';
      default:
        return 'bg-warning';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-success';
      case 'Berjalan':
        return 'bg-primary';
      default:
        return 'bg-warning';
    }
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case 'Selesai':
        return '100%';
      case 'Berjalan':
        return '60%';
      default:
        return '20%';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">📊 Dashboard</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {/* 4 Kartu Statistik */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-md-3">
          <div className="card bg-success text-white h-100 shadow-sm border-0">
            <div className="card-body text-center py-3">
              <small className="d-block opacity-75">💰 Total Kas Masuk</small>
              <h5 className="mb-0 fw-bold">{formatRupiah(stats.total_pemasukan)}</h5>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card bg-danger text-white h-100 shadow-sm border-0">
            <div className="card-body text-center py-3">
              <small className="d-block opacity-75">📤 Total Kas Keluar</small>
              <h5 className="mb-0 fw-bold">{formatRupiah(stats.total_pengeluaran)}</h5>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card bg-info text-white h-100 shadow-sm border-0">
            <div className="card-body text-center py-3">
              <small className="d-block opacity-75">💵 Sisa Saldo</small>
              <h5 className="mb-0 fw-bold">{formatRupiah(stats.sisa_saldo)}</h5>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card bg-warning h-100 shadow-sm border-0">
            <div className="card-body text-center py-3">
              <small className="d-block opacity-75">📋 Program Aktif</small>
              <h5 className="mb-0 fw-bold">{stats.program_aktif}</h5>
            </div>
          </div>
        </div>
      </div>

      {/* Periode Aktif */}
      {stats.periode_aktif && stats.periode_aktif.length > 0 && (
        <div className="alert alert-info py-2 small mb-4 border-0 shadow-sm">
          📅 <strong>Periode Aktif:</strong>{' '}
          {stats.periode_aktif.map((t, i) => (
            <span key={i} className="badge bg-success me-1">{t}</span>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        {/* Pie Chart */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-2 border-0">
              <h6 className="mb-0">🍩 Pemasukan vs Pengeluaran</h6>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '280px' }}>
              {stats.total_pemasukan === 0 && stats.total_pengeluaran === 0 ? (
                <p className="text-muted small">Belum ada data transaksi</p>
              ) : (
                <Pie data={pieData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-2 border-0">
              <h6 className="mb-0">📊 Transaksi per Program</h6>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '280px' }}>
              {programNames.length === 0 ? (
                <p className="text-muted small">Belum ada data transaksi</p>
              ) : (
                <Bar data={barData} options={{ ...chartOptions, indexAxis: 'y' }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Program Terbaru */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-2 border-0 d-flex justify-content-between align-items-center">
          <h6 className="mb-0">📋 Program Terbaru</h6>
          <button className="btn btn-outline-primary btn-sm" onClick={() => onNavigate('program-kerja')}>
            Lihat Semua
          </button>
        </div>
        <div className="card-body p-2">
          {programList.length === 0 ? (
            <p className="text-muted small text-center py-3">Belum ada program kerja</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-borderless table-sm align-middle mb-0 small">
                <thead className="text-muted border-bottom">
                  <tr>
                    <th>Program</th>
                    <th>Status</th>
                    <th style={{ width: '30%' }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {programList.map((prog) => (
                    <tr key={prog.id_program}>
                      <td><strong>{prog.nama_program}</strong></td>
                      <td>
                        <span className={`badge ${getStatusBadge(prog.status_program)}`}>
                          {prog.status_program || 'Rencana'}
                        </span>
                      </td>
                      <td>
                        <div className="progress" style={{ height: '8px' }}>
                          <div
                            className={`progress-bar ${getProgressColor(prog.status_program)}`}
                            style={{ width: getProgressWidth(prog.status_program) }}
                          ></div>
                        </div>
                        <small className="text-muted">{getProgressWidth(prog.status_program)}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-2 border-0">
          <h6 className="mb-0">⚡ Quick Actions</h6>
        </div>
        <div className="card-body py-3">
          <div className="row g-2">
            <div className="col-6 col-md-3">
              <button className="btn btn-outline-primary w-100 py-3" onClick={() => onNavigate('program-kerja')}>
                <div className="fs-4">📋</div>
                <small>Program Kerja</small>
              </button>
            </div>
            <div className="col-6 col-md-3">
              <button className="btn btn-outline-success w-100 py-3" onClick={() => onNavigate('kelola-rab')}>
                <div className="fs-4">💰</div>
                <small>Kelola RAB</small>
              </button>
            </div>
            <div className="col-6 col-md-3">
              <button className="btn btn-outline-warning w-100 py-3" onClick={() => onNavigate('transaksi')}>
                <div className="fs-4">💳</div>
                <small>Transaksi</small>
              </button>
            </div>
            <div className="col-6 col-md-3">
              <button className="btn btn-outline-info w-100 py-3" onClick={() => onNavigate('lihat-laporan')}>
                <div className="fs-4">📊</div>
                <small>Laporan</small>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-center small text-muted">
        Status: <strong className="text-success">{status}</strong> | Role: {user.role} | Email: {user.email}
      </div>
    </div>
  );
}

export default Dashboard;