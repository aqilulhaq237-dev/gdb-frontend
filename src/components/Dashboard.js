import React, { useState, useEffect } from "react";
import API from "../services/api";

function Dashboard({ user, onLogout, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    sisaSaldo: 0,
    totalProgram: 0,
    programAktif: 0,
    programSelesai: 0,
  });
  const [pendingApproval, setPendingApproval] = useState(0);
  const [users, setUsers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Program
      const programRes = await API.get("/program-kerja");
      const allPrograms =
        programRes.data.status === "success" ? programRes.data.data : [];
      const programAktif = allPrograms.filter(
        (p) => p.status_program === "Berjalan" || p.status_program === "Aktif",
      ).length;
      const programSelesai = allPrograms.filter(
        (p) => p.status_program === "Selesai",
      ).length;

      // Transaksi - hanya untuk hitung sisa saldo
      const transRes = await API.get("/transaksi");
      const allTransaksi =
        transRes.data.status === "success" ? transRes.data.data : [];
      let totalMasuk = 0,
        totalKeluar = 0;
      allTransaksi.forEach((t) => {
        if (
          t.status === "Valid" ||
          t.status_validasi === "Valid" ||
          t.status === "Selesai"
        ) {
          if (t.jenis === "Masuk") totalMasuk += parseFloat(t.nominal || 0);
          else if (t.jenis === "Keluar")
            totalKeluar += parseFloat(t.nominal || 0);
        }
      });

      setStats({
        sisaSaldo: totalMasuk - totalKeluar,
        totalProgram: allPrograms.length,
        programAktif: programAktif,
        programSelesai: programSelesai,
      });

      const recent = allTransaksi
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
        .slice(0, 5);
      setRecentTransactions(recent);

      // Fetch log aktivitas untuk Ketua & Admin
      if (user.role === "Ketua" || user.role === "Admin") {
        try {
          const logRes = await API.get("/logs?limit=5");
          if (logRes.data.status === "success") {
            setRecentLogs(logRes.data.data || []);
          }
        } catch (logErr) {
          console.error("Gagal memuat log aktivitas:", logErr);
        }
      }
    } catch (err) {
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === "Admin") {
      API.get("/users")
        .then((res) => {
          if (res.data.status === "success") setUsers(res.data.data);
        })
        .catch((err) => console.error(err));
    }
    if (user.role === "Ketua") {
      API.get("/pengajuan/menunggu")
        .then((res) => {
          if (res.data.status === "success")
            setPendingApproval(res.data.data.length);
        })
        .catch((err) => console.error(err));
    }
  }, [user.role]);

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka || 0);
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

  const formatLogTime = (datetime) => {
    if (!datetime) return "-";
    return new Date(datetime.replace(" ", "T")).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAktivitasInfo = (aktivitas) => {
    switch (aktivitas) {
      case "Login":
        return { icon: "🔑", badge: "" };
      case "Logout":
        return { icon: "🚪", badge: "bg-secondary text-white" };
      case "Tambah":
        return { icon: "➕", badge: "bg-primary text-white" };
      case "Ubah":
        return { icon: "✏️", badge: "bg-warning text-dark" };
      case "Hapus":
        return { icon: "🗑️", badge: "bg-danger text-white" };
      case "Transaksi":
        return { icon: "💰", badge: "bg-info text-dark" };
      case "Konfirmasi":
        return { icon: "✅", badge: "bg-success text-white" };
      case "Tolak":
        return { icon: "❌", badge: "bg-danger text-white" };
      default:
        return { icon: "📋", badge: "bg-light text-dark" };
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "Admin":
        return "bg-danger";
      case "Ketua":
        return "bg-primary";
      case "Bendahara":
        return "bg-warning text-dark";
      case "Anggota Umum":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
        <p>Memuat...</p>
      </div>
    );

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">📊 Dashboard</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">
            Halo, <strong>{user.nama_lengkap}</strong>
          </span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button
            className="btn btn-outline-info btn-sm"
            onClick={() => onNavigate("profil")}
          >
            👤 Profil
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

      {/* STATS CARDS */}
      <div className="row g-2 mb-4">
        <div className="col-6">
          <div
            className="card h-100 shadow-sm border-0"
            style={{ backgroundColor: "#2E7D32" }}
          >
            <div className="card-body text-center py-3 text-white">
              <div className="mb-2 fs-4">💳</div>
              <small className="text-white-50">Sisa Saldo</small>
              <h5 className="mb-0 mt-1 text-white">
                {formatRupiah(stats.sisaSaldo)}
              </h5>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div
            className="card h-100 shadow-sm border-0"
            style={{ backgroundColor: "#1565C0" }}
          >
            <div className="card-body text-center py-3 text-white">
              <div className="mb-2 fs-4">📋</div>
              <small className="text-white-50">Program Aktif</small>
              <h5 className="mb-0 mt-1 text-white">
                {stats.programAktif} / {stats.totalProgram}
              </h5>
              <small className="text-white-50">
                ✅ {stats.programSelesai} Selesai
              </small>
            </div>
          </div>
        </div>
        {user.role === "Ketua" && (
          <div className="col-12 mt-2">
            <div
              className="card h-100 shadow-sm border-0"
              style={{ backgroundColor: "#F9A825", cursor: "pointer" }}
              onClick={() => onNavigate("konfirmasi-transaksi")}
            >
              <div className="card-body text-center py-3">
                <div className="mb-2 fs-4">🔔</div>
                <small className="text-dark">Menunggu Approval</small>
                <h5 className="mb-0 mt-1 text-dark">{pendingApproval}</h5>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ MANAJEMEN PROFIL - Bendahara & Anggota Umum */}
      {(user.role === "Bendahara" || user.role === "Anggota Umum") && (
        <div className="card shadow-sm mb-4">
          <div className="card-header card-header-purple py-2 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 h6">👤 Manajemen Profil</h5>
            <button
              className="btn btn-light btn-sm"
              onClick={() => onNavigate("profil")}
            >
              ✏️ Edit Profil
            </button>
          </div>
          <div className="card-body py-3">
            <div className="row align-items-center">
              <div className="col-md-2 text-center mb-3 mb-md-0">
                <div
                  className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center"
                  style={{ width: "80px", height: "80px", fontSize: "2rem" }}
                >
                  🧑
                </div>
              </div>
              <div className="col-md-10">
                <table className="table table-sm table-borderless mb-0 small">
                  <tbody>
                    <tr>
                      <td style={{ width: "130px" }} className="fw-bold">
                        📛 Nama Lengkap
                      </td>
                      <td>: {user.nama_lengkap || "-"}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">👤 Username</td>
                      <td>: {user.username || "-"}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">📧 Email</td>
                      <td>: {user.email || "-"}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">📱 No. HP</td>
                      <td>: {user.no_hp || "-"}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">🔴 Role</td>
                      <td>
                        :{" "}
                        <span className={`badge ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABEL PENGGUNA - Admin */}
      {user.role === "Admin" && (
        <div className="card shadow-sm mb-4">
          <div className="card-header card-header-blue py-2 d-flex justify-content-between align-items-center">
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
            )}
          </div>
        </div>
      )}

      {/* TABEL TRANSAKSI TERBARU - Ketua */}
      {user.role === "Ketua" && (
        <div className="card shadow-sm mb-4">
          <div className="card-header card-header-green py-2 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 h6">📋 Transaksi Terbaru</h5>
            <button
              className="btn btn-light btn-sm"
              onClick={() => onNavigate("transaksi")}
            >
              Lihat Semua
            </button>
          </div>
          <div className="card-body p-2 p-md-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-4 text-muted">
                Belum ada transaksi
              </div>
            ) : (
              <table className="table table-bordered table-hover align-middle mb-0 small">
                <thead className="table-light text-center">
                  <tr>
                    <th>Tanggal</th>
                    <th>Program</th>
                    <th>Jenis</th>
                    <th>Nominal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t, i) => (
                    <tr key={i}>
                      <td className="text-center">{formatDate(t.tanggal)}</td>
                      <td>{t.nama_program || "-"}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${t.jenis === "Masuk" ? "bg-success" : "bg-danger"}`}
                        >
                          {t.jenis}
                        </span>
                      </td>
                      <td className="text-end">{formatRupiah(t.nominal)}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${t.status === "Valid" || t.status_validasi === "Valid" ? "bg-success" : "bg-warning text-dark"}`}
                        >
                          {t.status === "Valid" || t.status_validasi === "Valid"
                            ? "✅ Valid"
                            : "⏳ Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MONITOR LOG AKTIVITAS - Ketua & Admin */}
      {(user.role === "Ketua" || user.role === "Admin") && (
        <div className="card shadow-sm">
          <div className="card-header card-header-teal py-2 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 h6">📊 Monitor Log Aktivitas</h5>
            <button
              className="btn btn-light btn-sm"
              onClick={() => onNavigate("monitor-log")}
            >
              Lihat Semua
            </button>
          </div>
          <div className="card-body p-2 p-md-3">
            {recentLogs.length === 0 ? (
              <div className="text-center py-3 text-muted small">
                Belum ada aktivitas tercatat
              </div>
            ) : (
              <table className="table table-bordered table-hover align-middle mb-0 small">
                <thead className="table-light text-center">
                  <tr>
                    <th style={{ width: "20%" }}>Waktu</th>
                    <th style={{ width: "20%" }}>Pengguna</th>
                    <th style={{ width: "20%" }}>Aktivitas</th>
                    <th style={{ width: "40%" }}>Deskripsi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log, index) => {
                    const info = getAktivitasInfo(log.aktivitas);
                    return (
                      <tr key={log.id_log || index}>
                        <td className="text-center text-nowrap small">
                          {formatLogTime(log.waktu)}
                        </td>
                        <td className="small">
                          <strong>{log.pengguna || "-"}</strong>
                        </td>
                        <td className="text-center">
                          <span
                            className="badge small"
                            style={
                              log.aktivitas === "Login"
                                ? {
                                    backgroundColor: "#6A1B9A",
                                    color: "#FFFFFF",
                                  }
                                : {}
                            }
                          >
                            {info.icon} {log.aktivitas}
                          </span>
                        </td>
                        <td className="small">{log.deskripsi || "-"}</td>
                      </tr>
                    );
                  })}
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
