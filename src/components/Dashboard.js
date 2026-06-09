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
    totalRAB: 0,
  });
  const [pendingApproval, setPendingApproval] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [programDistribution, setProgramDistribution] = useState([]);

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

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

      // 3. Ambil SEMUA RAB
      const rabRes = await API.get("/rab", { headers });
      const allRAB = rabRes.data.status === "success" ? rabRes.data.data : [];
      const totalRAB = allRAB.length;

      setStats({
        totalKasMasuk: totalMasuk,
        totalKasKeluar: totalKeluar,
        sisaSaldo: sisaSaldo,
        totalProgram: allPrograms.length,
        programAktif: programAktif,
        programSelesai: programSelesai,
        totalRAB: totalRAB,
      });

      // 4. Fetch notifikasi approval (Ketua & Admin)
      if (user.role === "Ketua" || user.role === "Admin") {
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

      // 5. Data untuk chart bulanan
      const monthlyData = [];
      for (let i = 1; i <= 12; i++) {
        const transaksiBulanIni = allTransaksi.filter((t) => {
          const bulan = new Date(t.tanggal).getMonth() + 1;
          return (
            bulan === i &&
            (t.status === "Valid" ||
              t.status_validasi === "Valid" ||
              t.status === "Selesai")
          );
        });

        const pemasukan = transaksiBulanIni
          .filter((t) => t.jenis === "Masuk")
          .reduce((sum, t) => sum + parseFloat(t.nominal || 0), 0);

        const pengeluaran = transaksiBulanIni
          .filter((t) => t.jenis === "Keluar")
          .reduce((sum, t) => sum + parseFloat(t.nominal || 0), 0);

        monthlyData.push({
          name: MONTHS[i - 1],
          pemasukan: pemasukan,
          pengeluaran: pengeluaran,
        });
      }
      setMonthlyData(monthlyData);

      // 6. Distribusi program per status
      const statusCount = {};
      allPrograms.forEach((p) => {
        const status = p.status_program || "Lainnya";
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      const programDistribution = Object.keys(statusCount).map((key) => ({
        name: key,
        value: statusCount[key],
      }));
      setProgramDistribution(programDistribution);

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
        <div className="col-6 col-md">
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
        <div className="col-6 col-md">
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
        <div className="col-6 col-md">
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
        <div className="col-6 col-md">
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

        {/* Notifikasi Approval - Hanya Ketua & Admin */}
        {(user.role === "Ketua" || user.role === "Admin") && (
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

      {/* Charts */}
      <div className="row g-3 mb-4">
        {/* Monthly Chart */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white py-2">
              <h5 className="mb-0 h6">📈 Pemasukan & Pengeluaran Bulanan</h5>
            </div>
            <div className="card-body">
              {monthlyData.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered mb-0">
                    <thead className="table-light text-center">
                      <tr>
                        <th>Bulan</th>
                        <th>Pemasukan</th>
                        <th>Pengeluaran</th>
                        <th>Selisih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((data, index) => (
                        <tr key={index}>
                          <td className="text-center fw-bold">{data.name}</td>
                          <td className="text-end text-success">
                            {formatRupiah(data.pemasukan)}
                          </td>
                          <td className="text-end text-danger">
                            {formatRupiah(data.pengeluaran)}
                          </td>
                          <td className="text-end">
                            {formatRupiah(data.pemasukan - data.pengeluaran)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  Belum ada data transaksi
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Program Distribution */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white py-2">
              <h5 className="mb-0 h6">📊 Distribusi Program</h5>
            </div>
            <div className="card-body">
              {programDistribution.length > 0 ? (
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    {programDistribution.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <span
                            className={`badge ${
                              item.name === "Berjalan"
                                ? "bg-primary"
                                : item.name === "Selesai"
                                  ? "bg-success"
                                  : item.name === "Rencana"
                                    ? "bg-warning text-dark"
                                    : "bg-secondary"
                            }`}
                          >
                            {item.name}
                          </span>
                        </td>
                        <td className="text-end fw-bold">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4 text-muted">
                  Belum ada program
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
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
            <div className="table-responsive">
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
                  {recentTransactions.map((t, index) => (
                    <tr key={index}>
                      <td className="text-center">
                        {formatDate(t.tanggal || t.created_at)}
                      </td>
                      <td>{t.nama_program || "-"}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            t.jenis === "Masuk" ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {t.jenis}
                        </span>
                      </td>
                      <td className="text-end">
                        <span
                          className={
                            t.jenis === "Masuk" ? "text-success" : "text-danger"
                          }
                        >
                          {formatRupiah(t.nominal)}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            t.status === "Valid" ||
                            t.status_validasi === "Valid"
                              ? "bg-success"
                              : t.status === "Pending"
                                ? "bg-warning text-dark"
                                : "bg-danger"
                          }`}
                        >
                          {t.status === "Valid" || t.status_validasi === "Valid"
                            ? "✅ Valid"
                            : t.status === "Pending"
                              ? "⏳ Pending"
                              : "❌ Tidak Valid"}
                        </span>
                      </td>
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

export default Dashboard;
