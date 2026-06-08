import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Filler,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler);

function Dashboard({ user, onLogout, onNavigate }) {
  const [stats, setStats] = useState({ total_pemasukan: 0, total_pengeluaran: 0, sisa_saldo: 0, program_aktif: 0, periode_aktif: [] });
  const [programList, setProgramList] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await API.get('/dashboard/stats');
      if (statsRes.data.status === 'success') setStats(statsRes.data.data);

      const progRes = await API.get('/program-kerja');
      if (progRes.data.status === 'success') {
        const periode = statsRes.data.data?.periode_aktif || [];
        let filtered = progRes.data.data;
        if (periode.length > 0) filtered = filtered.filter(p => periode.some(pr => p.periode?.toString() === pr.toString()));
        setProgramList(filtered.slice(0, 5));
      }

      const transRes = await API.get('/transaksi');
      if (transRes.data.status === 'success') setTransaksiList(transRes.data.data);
    } catch (error) { console.error('Gagal:', error); }
    finally { setLoading(false); }
  };

  const formatRupiah = (a) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(a || 0);

  // Chart Config
  const chartColors = { primary: '#6366f1', success: '#10b981', danger: '#ef4444', warning: '#f59e0b', info: '#3b82f6', dark: '#1e293b', light: '#f1f5f9' };

  const doughnutData = {
    labels: ['Pemasukan', 'Pengeluaran'],
    datasets: [{ data: [stats.total_pemasukan, stats.total_pengeluaran], backgroundColor: [chartColors.success, chartColors.danger], borderColor: '#ffffff', borderWidth: 3, hoverBorderWidth: 4 }]
  };

  const programNames = [...new Set(transaksiList.map(t => t.nama_program))];
  const barColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
  const barData = {
    labels: programNames,
    datasets: [{ label: 'Total Transaksi', data: programNames.map(name => transaksiList.filter(t => t.nama_program === name).reduce((s, t) => s + t.nominal, 0)), backgroundColor: barColors.slice(0, programNames.length), borderRadius: 6, borderSkipped: false }]
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, font: { size: 11 } } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#e2e8f0' } } } };

  const getStatusBadge = (s) => { switch(s) { case 'Selesai': return { bg: '#10b981', text: 'Selesai', icon: '✓' }; case 'Berjalan': return { bg: '#3b82f6', text: 'Berjalan', icon: '▶' }; default: return { bg: '#f59e0b', text: 'Rencana', icon: '○' }; } };
  const getProgress = (s) => { switch(s) { case 'Selesai': return 100; case 'Berjalan': return 65; default: return 25; } };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh', background: '#f8fafc' }}>
      <div className="text-center">
        <div className="spinner-border" style={{ color: '#6366f1', width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-muted">Memuat dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 mb-1" style={{ color: '#1e293b', fontWeight: 700 }}>📊 Dashboard</h1>
          <p className="small text-muted mb-0">Selamat datang, <strong>{user.nama_lengkap}</strong></p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {stats.periode_aktif?.length > 0 && stats.periode_aktif.map((t, i) => (
            <span key={i} className="badge px-3 py-2" style={{ background: '#6366f1', fontSize: '13px' }}>{t}</span>
          ))}
          <span className="badge px-3 py-2" style={{ background: '#e2e8f0', color: '#64748b', fontSize: '13px' }}>{user.role}</span>
          <button className="btn btn-sm px-3" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#ef4444' }} onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {[
          { icon: '💰', label: 'Total Kas Masuk', value: stats.total_pemasukan, color: '#10b981', bg: '#ecfdf5' },
          { icon: '📤', label: 'Total Kas Keluar', value: stats.total_pengeluaran, color: '#ef4444', bg: '#fef2f2' },
          { icon: '💵', label: 'Sisa Saldo', value: stats.sisa_saldo, color: '#6366f1', bg: '#eef2ff' },
          { icon: '📋', label: 'Program Aktif', value: `${stats.program_aktif} Program`, color: '#f59e0b', bg: '#fffbeb', isNum: false },
        ].map((card, i) => (
          <div className="col-6 col-xl-3" key={i}>
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '48px', height: '48px', background: card.bg, color: card.color, fontSize: '20px' }}>{card.icon}</div>
                  <div>
                    <p className="text-muted small mb-0" style={{ fontSize: '11px' }}>{card.label}</p>
                    <h5 className="mb-0 fw-bold" style={{ color: '#1e293b', fontSize: card.isNum === false ? '16px' : '18px' }}>{card.isNum === false ? card.value : formatRupiah(card.value)}</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white border-0 pt-3 pb-0">
              <h6 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>🍩 Pemasukan vs Pengeluaran</h6>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
              {stats.total_pemasukan === 0 && stats.total_pengeluaran === 0 ? <p className="text-muted small">Belum ada data</p> : <Doughnut data={doughnutData} options={{ ...chartOptions, cutout: '65%' }} />}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white border-0 pt-3 pb-0">
              <h6 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>📊 Transaksi per Program</h6>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
              {programNames.length === 0 ? <p className="text-muted small">Belum ada data</p> : <Bar data={barData} options={{ ...chartOptions, indexAxis: 'y' }} />}
            </div>
          </div>
        </div>
      </div>

      {/* Program Terbaru */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3 pb-0">
          <h6 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>📋 Program Terbaru</h6>
          <button className="btn btn-sm px-3" style={{ background: '#eef2ff', color: '#6366f1', border: 'none', borderRadius: '8px' }} onClick={() => onNavigate('program-kerja')}>Lihat Semua →</button>
        </div>
        <div className="card-body">
          {programList.length === 0 ? <p className="text-muted small text-center py-3">Belum ada program</p> : (
            programList.map((prog, i) => {
              const status = getStatusBadge(prog.status_program);
              const progress = getProgress(prog.status_program);
              return (
                <div key={i} className="d-flex align-items-center gap-3 py-3" style={{ borderBottom: i < programList.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '40px', height: '40px', background: '#eef2ff', color: '#6366f1', fontSize: '16px' }}>📌</div>
                  <div className="flex-grow-1">
                    <p className="mb-0 fw-bold small" style={{ color: '#1e293b' }}>{prog.nama_program}</p>
                    <span className="badge px-2 py-1 mt-1" style={{ background: status.bg, color: '#fff', fontSize: '10px' }}>{status.icon} {status.text}</span>
                  </div>
                  <div style={{ width: '120px' }}>
                    <div className="progress" style={{ height: '6px', borderRadius: '3px', background: '#f1f5f9' }}>
                      <div className="progress-bar" style={{ width: `${progress}%`, background: status.bg, borderRadius: '3px' }}></div>
                    </div>
                    <small className="text-muted" style={{ fontSize: '10px' }}>{progress}%</small>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-white border-0 pt-3 pb-0">
          <h6 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>⚡ Quick Actions</h6>
        </div>
        <div className="card-body">
          <div className="row g-2">
            {[
              { label: 'Program Kerja', icon: '📋', color: '#6366f1', bg: '#eef2ff', page: 'program-kerja' },
              { label: 'Kelola RAB', icon: '💰', color: '#10b981', bg: '#ecfdf5', page: 'kelola-rab' },
              { label: 'Transaksi Kas', icon: '💳', color: '#f59e0b', bg: '#fffbeb', page: 'transaksi' },
              { label: 'Lihat Laporan', icon: '📊', color: '#3b82f6', bg: '#eff6ff', page: 'lihat-laporan' },
            ].map((btn, i) => (
              <div className="col-6 col-md-3" key={i}>
                <button className="btn w-100 py-3 border-0" style={{ background: btn.bg, color: btn.color, borderRadius: '12px', fontWeight: 600, fontSize: '14px' }} onClick={() => onNavigate(btn.page)}>
                  <div className="fs-4 mb-1">{btn.icon}</div>
                  {btn.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center small text-muted py-2">
        © {new Date().getFullYear()} GDB Cash Management • Status: <span style={{ color: '#10b981' }}>● Online</span>
      </div>
    </div>
  );
}

export default Dashboard;