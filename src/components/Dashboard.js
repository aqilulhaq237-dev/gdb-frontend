import React, { useState, useEffect } from "react";
import API from "../services/api";

function Dashboard({ user, onLogout, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalKasMasuk: 0,
    totalKasKeluar: 0,
    sisaSaldo: 0,
    totalProgram: 0,
    programAktif: 0,
    programSelesai: 0,
  });
  const [pendingApproval, setPendingApproval] = useState(0);
  const [users, setUsers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Program
      const programRes = await API.get("/program-kerja");
      const allPrograms = programRes.data.status === "success" ? programRes.data.data : [];
      const programAktif = allPrograms.filter((p) => p.status_program === "Berjalan" || p.status_program === "Aktif").length;
      const programSelesai = allPrograms.filter((p) => p.status_program === "Selesai").length;

      // Transaksi
      const transRes = await API.get("/transaksi");
      const allTransaksi = transRes.data.status === "success" ? transRes.data.data : [];
      let totalMasuk = 0, totalKeluar = 0;
      allTransaksi.forEach((t) => {
        if (t.status === "Valid" || t.status_validasi === "Valid" || t.status === "Selesai") {
          if (t.jenis === "Masuk") totalMasuk += parseFloat(t.nominal || 0);
          else if (t.jenis === "Keluar") totalKeluar += parseFloat(t.nominal || 0);
        }
      });

      setStats({
        totalKasMasuk: totalMasuk,
        totalKasKeluar: totalKeluar,
        sisaSaldo: totalMasuk - totalKeluar,
        totalProgram: allPrograms.length,
        programAktif: programAktif,
        programSelesai: programSelesai,
      });

      const recent = allTransaksi.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 5);
      setRecentTransactions(recent);

    } catch (err) {
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === "Admin") {
      API.get("/users")
        .then(res => { if (res.data.status === "success") setUsers(res.data.data); })
        .catch(err => console.error(err));
    }
    if (user.role === "Ketua") {
      API.get("/pengajuan/menunggu")
        .then(res => { if (res.data.status === "success") setPendingApproval(res.data.data.length); })
        .catch(err => console.error(err));
    }
  }, [user.role]);

  const formatRupiah = (angka) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka || 0);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /><p>Memuat...</p></div>;

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">📊 Dashboard</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

      <div className="row g-2 mb-4">
        <div className="col-6 col-md-3"><div className="card bg-success text-white h-100 shadow-sm"><div className="card-body text-center py-3"><div className="mb-2">💰</div><small>Total Kas Masuk</small><h5 className="mb-0 mt-1">{formatRupiah(stats.totalKasMasuk)}</h5></div></div></div>
        <div className="col-6 col-md-3"><div className="card bg-danger text-white h-100 shadow-sm"><div className="card-body text-center py-3"><div className="mb-2">📤</div><small>Total Kas Keluar</small><h5 className="mb-0 mt-1">{formatRupiah(stats.totalKasKeluar)}</h5></div></div></div>
        <div className="col-6 col-md-3"><div className={`card h-100 shadow-sm ${stats.sisaSaldo >= 0 ? "bg-info" : "bg-warning"} text-white`}><div className="card-body text-center py-3"><div className="mb-2">💳</div><small>Sisa Saldo</small><h5 className="mb-0 mt-1">{formatRupiah(stats.sisaSaldo)}</h5></div></div></div>
        <div className="col-6 col-md-3"><div className="card bg-primary text-white h-100 shadow-sm"><div className="card-body text-center py-3"><div className="mb-2">📋</div><small>Program Aktif</small><h5 className="mb-0 mt-1">{stats.programAktif} / {stats.totalProgram}</h5><small className="opacity-75">✅ {stats.programSelesai} Selesai</small></div></div></div>
        {user.role === "Ketua" && <div className="col-6 col-md"><div className="card bg-warning text-dark h-100 shadow-sm" style={{cursor:"pointer"}} onClick={() => onNavigate("konfirmasi-transaksi")}><div className="card-body text-center py-3"><div className="mb-2">🔔</div><small>Menunggu Approval</small><h5 className="mb-0 mt-1">{pendingApproval}</h5></div></div></div>}
      </div>

      {user.role === "Admin" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 h6">👥 Data Pengguna</h5>
            <button className="btn btn-light btn-sm" onClick={() => onNavigate("kelola-user")}>Kelola Pengguna</button>
          </div>
          <div className="card-body p-2 p-md-3">
            {users.length === 0 ? (
              <div className="text-center py-4 text-muted">Belum ada pengguna</div>
            ) : (
              <table className="table table-bordered table-hover align-middle mb-0 small">
                <thead className="table-light text-center"><tr><th>Username</th><th>Nama Lengkap</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id_user}><td><strong>{u.username}</strong></td><td>{u.nama_lengkap}</td><td><span className="badge bg-info">{u.role}</span></td><td className="text-center"><span className="badge bg-success">🟢 Aktif</span></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {user.role === "Ketua" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 h6">📋 Transaksi Terbaru</h5>
            <button className="btn btn-light btn-sm" onClick={() => onNavigate("transaksi")}>Lihat Semua</button>
          </div>
          <div className="card-body p-2 p-md-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-4 text-muted">Belum ada transaksi</div>
            ) : (
              <table className="table table-bordered table-hover align-middle mb-0 small">
                <thead className="table-light text-center"><tr><th>Tanggal</th><th>Program</th><th>Jenis</th><th>Nominal</th><th>Status</th></tr></thead>
                <tbody>
                  {recentTransactions.map((t, i) => (
                    <tr key={i}><td className="text-center">{formatDate(t.tanggal)}</td><td>{t.nama_program || "-"}</td><td className="text-center"><span className={`badge ${t.jenis === "Masuk" ? "bg-success" : "bg-danger"}`}>{t.jenis}</span></td><td className="text-end">{formatRupiah(t.nominal)}</td><td className="text-center"><span className={`badge ${t.status === "Valid" || t.status_validasi === "Valid" ? "bg-success" : "bg-warning text-dark"}`}>{t.status === "Valid" || t.status_validasi === "Valid" ? "✅ Valid" : "⏳ Pending"}</span></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;