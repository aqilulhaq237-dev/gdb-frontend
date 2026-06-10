import React, { useState, useEffect } from "react";
import API from "../services/api";

function Dashboard({ user, onLogout, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingApproval, setPendingApproval] = useState(0);
  const [users, setUsers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        onNavigate("login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // 1. Ambil SEMUA program kerja
      const programRes = await API.get("/program-kerja", { headers });
      const allPrograms =
        programRes.data.status === "success" ? programRes.data.data : [];

      const programAktif = allPrograms.filter(
        (p) => p.status_program === "Berjalan" || p.status_program === "Aktif",
      ).length;
      const programSelesai = allPrograms.filter(
        (p) => p.status_program === "Selesai",
      ).length;

      // 2. Ambil SEMUA transaksi
      const transRes = await API.get("/transaksi", { headers });
      const allTransaksi =
        transRes.data.status === "success" ? transRes.data.data : [];

      let totalMasuk = 0;
      let totalKeluar = 0;

      allTransaksi.forEach((t) => {
        if (
          t.status === "Valid" ||
          t.status_validasi === "Valid" ||
          t.status === "Selesai"
        ) {
          if (t.jenis === "Masuk") {
            totalMasuk += parseFloat(t.nominal || 0);
          } else if (t.jenis === "Keluar") {
            totalKeluar += parseFloat(t.nominal || 0);
          }
        }
      });

      const sisaSaldo = totalMasuk - totalKeluar;

      // 4. Fetch notifikasi approval (Ketua)
      if (user.role === "Ketua") {
        try {
          const pengajuanRes = await API.get("/pengajuan/menunggu", {
            headers,
          });
          if (pengajuanRes.data.status === "success") {
            setPendingApproval(pengajuanRes.data.data.length);
          }
        } catch (err) {
          console.error("Gagal fetch pengajuan:", err);
        }
      }

      if (user.role === "Admin") {
        // Fetch data users (Admin)
        try {
          const usersRes = await API.get("/users", { headers });
          if (usersRes.data.status === "success") {
            setUsers(usersRes.data.data);
          }
        } catch (err) {
          console.error("Gagal fetch users:", err);
        }
      }

      // 7. Transaksi terbaru (5 terakhir)
      const recentTrans = allTransaksi
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
        .slice(0, 5);
      setRecentTransactions(recentTrans);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data dashboard...</p>
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
          <span className="text-nowrap small">
            Halo, <strong>{user.nama_lengkap}</strong>
          </span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

      {/* Stats Cards */}
      <div className="row g-2 mb-4">
        {/* Total Kas Masuk */}
        <div className="col-6 col-md-3">
          <div className="card bg-success text-white h-100 shadow-sm">
            <div className="card-body text-center py-3">
              <div className="mb-2">💰</div>
              <small className="d-block">Total Kas Masuk</small>
              <h5 className="mb-0 mt-1">{formatRupiah(stats.totalKasMasuk)}</h5>
              <small className="d-block mt-1 opacity-75">Semua Program</small>
            </div>
          </div>
        </div>

        {/* Total Kas Keluar */}
        <div className="col-6 col-md-3">
          <div className="card bg-danger text-white h-100 shadow-sm">
            <div className="card-body text-center py-3">
              <div className="mb-2">📤</div>
              <small className="d-block">Total Kas Keluar</small>
              <h5 className="mb-0 mt-1">
                {formatRupiah(stats.totalKasKeluar)}
              </h5>
              <small className="d-block mt-1 opacity-75">Semua Program</small>
            </div>
          </div>
        </div>

        {/* Sisa Saldo */}
        <div className="col-6 col-md-3">
          <div
            className={`card h-100 shadow-sm ${
              stats.sisaSaldo >= 0 ? "bg-info" : "bg-warning"
            } text-white`}
          >
            <div className="card-body text-center py-3">
              <div className="mb-2">💳</div>
              <small className="d-block">Sisa Saldo</small>
              <h5 className="mb-0 mt-1">{formatRupiah(stats.sisaSaldo)}</h5>
              <small className="d-block mt-1 opacity-75">Semua Program</small>
            </div>
          </div>
        </div>

        {/* Program Aktif */}
        <div className="col-6 col-md-3">
          <div className="card bg-primary text-white h-100 shadow-sm">
            <div className="card-body text-center py-3">
              <div className="mb-2">📋</div>
              <small className="d-block">Program Aktif</small>
              <h5 className="mb-0 mt-1">
                {stats.programAktif} / {stats.totalProgram}
              </h5>
              <small className="d-block mt-1 opacity-75">
                ✅ {stats.programSelesai} Selesai
              </small>
            </div>
          </div>
        </div>

        {/* Notifikasi Approval - Hanya Ketua */}
        {user.role === "Ketua" && (
          <div className="col-6 col-md">
            <div
              className="card bg-warning text-dark h-100 shadow-sm"
              style={{ cursor: "pointer" }}
              onClick={() => onNavigate("konfirmasi-transaksi")}
            >
              <div className="card-body text-center py-3">
                <div className="mb-2">🔔</div>
                <small className="d-block">Menunggu Approval</small>
                <h5 className="mb-0 mt-1">
                  {pendingApproval > 0 ? pendingApproval : "0"}
                </h5>
                {pendingApproval > 0 && (
                  <small className="d-block mt-1">Klik untuk review →</small>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabel Users - Hanya Admin */}
      {user.role === "Admin" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 h6">👥 Data Pengguna</h5>
            <button
              className="btn btn-light btn-sm"
              onClick={() => onNavigate("kelola-user")}
            >
              Kelola Pengguna
            </button>
          </div>
          <div className="card-body p-2 p-md-3">
            {users.length === 0 ? (
              <div className="text-center py-4 text-muted">
                Belum ada pengguna
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0 small">
                  <thead className="table-light text-center">
                    <tr>
                      <th>Username</th>
                      <th>Nama Lengkap</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id_user}>
                        <td>
                          <strong>{u.username}</strong>
                        </td>
                        <td>{u.nama_lengkap}</td>
                        <td>
                          <span className="badge bg-info">{u.role}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-success">🟢 Aktif</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabel Transaksi - Selain Admin */}
      {user.role !== "Admin" && (
        <div className="card shadow-sm">
          ... tabel transaksi terbaru (asli) ...
        </div>
      )}
    </div>
  );
}

export default Dashboard;
