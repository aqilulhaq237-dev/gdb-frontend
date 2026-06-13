import React, { useEffect, useState } from "react";
import API from "../services/api";

function MonitorLog({ user, onLogout, onNavigate }) {
  const [allLogs, setAllLogs] = useState([]); // ✅ Simpan semua data
  const [logs, setLogs] = useState([]); // ✅ Data yang ditampilkan
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    start_date: "",
    end_date: "",
  });
  const [message, setMessage] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 15;

  // Cek akses: hanya Ketua & Admin
  useEffect(() => {
    if (user.role !== "Ketua" && user.role !== "Admin") {
      onNavigate("dashboard");
    }
  }, [user.role]);

  useEffect(() => {
    fetchAllLogs();
  }, []);

  // ✅ Fetch SEMUA data log (tanpa filter)
  const fetchAllLogs = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Fetch semua data (pakai limit besar)
      const response = await API.get("/logs?limit=1000");

      if (response.data.status === "success") {
        const data = response.data.data || [];
        setAllLogs(data);

        // Terapkan filter + pagination
        applyFiltersAndPagination(data, 1, filter);
      } else {
        setMessage("❌ Gagal mengambil data log");
      }
    } catch (error) {
      console.error("Gagal mengambil data log:", error);
      setMessage("❌ Gagal mengambil data log");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter + Pagination client-side
  const applyFiltersAndPagination = (data, page, activeFilter) => {
    let filtered = [...data];

    // Filter by start_date
    if (activeFilter.start_date) {
      const startDate = new Date(activeFilter.start_date);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.waktu.replace(" ", "T"));
        return logDate >= startDate;
      });
    }

    // Filter by end_date
    if (activeFilter.end_date) {
      const endDate = new Date(activeFilter.end_date);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.waktu.replace(" ", "T"));
        return logDate <= endDate;
      });
    }

    // Update total
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / limit) || 1);
    setCurrentPage(page);

    // Paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    setLogs(filtered.slice(start, end));
  };

  const applyFilter = () => {
    setCurrentPage(1);
    applyFiltersAndPagination(allLogs, 1, filter);
  };

  const resetFilter = () => {
    const emptyFilter = { start_date: "", end_date: "" };
    setFilter(emptyFilter);
    setCurrentPage(1);
    applyFiltersAndPagination(allLogs, 1, emptyFilter);
  };

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    applyFiltersAndPagination(allLogs, page, filter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return "-";
    return new Date(datetime.replace(" ", "T")).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAktivitasInfo = (aktivitas) => {
    switch (aktivitas) {
      case "Login":
        return { icon: "🔑", badge: "badge-login" };
      case "Logout":
        return { icon: "🚪", badge: "badge-logout" };
      case "Tambah":
        return { icon: "➕", badge: "badge-tambah" };
      case "Ubah":
        return { icon: "✏️", badge: "badge-ubah" };
      case "Hapus":
        return { icon: "🗑️", badge: "badge-hapus" };
      case "Transaksi":
        return { icon: "💰", badge: "badge-transaksi" };
      case "Konfirmasi":
        return { icon: "✅", badge: "badge-konfirmasi" };
      case "Tolak":
        return { icon: "❌", badge: "badge-tolak" };
      default:
        return { icon: "📋", badge: "badge-default" };
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <nav className="d-flex justify-content-center mt-3">
        <ul className="pagination pagination-sm mb-0 flex-wrap">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => goToPage(currentPage - 1)}
            >
              ◀️ Sebelumnya
            </button>
          </li>
          {startPage > 1 && (
            <>
              <li className="page-item">
                <button className="page-link" onClick={() => goToPage(1)}>
                  1
                </button>
              </li>
              {startPage > 2 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
            </>
          )}
          {pages.map((page) => (
            <li
              key={page}
              className={`page-item ${page === currentPage ? "active" : ""}`}
            >
              <button className="page-link" onClick={() => goToPage(page)}>
                {page}
              </button>
            </li>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => goToPage(totalPages)}
                >
                  {totalPages}
                </button>
              </li>
            </>
          )}
          <li
            className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => goToPage(currentPage + 1)}
            >
              Selanjutnya ▶️
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  if (loading && allLogs.length === 0) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">📊 Monitor Log Aktivitas</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">
            Halo, <strong>{user.nama_lengkap}</strong>
          </span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            📊 Dashboard
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`alert ${message.includes("✅") ? "alert-success" : "alert-danger"} py-2 mb-3 small`}
        >
          {message}
        </div>
      )}

      {/* Filter - Hanya Tanggal */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white py-2">
          <h5 className="mb-0 h6">🔍 Filter Log</h5>
        </div>
        <div className="card-body py-3">
          <div className="row align-items-end g-3">
            <div className="col-sm-5">
              <label className="form-label small fw-bold mb-1">
                📅 Tanggal Mulai
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                name="start_date"
                value={filter.start_date}
                max={filter.end_date || today}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-sm-5">
              <label className="form-label small fw-bold mb-1">
                📅 Tanggal Akhir
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                name="end_date"
                value={filter.end_date}
                min={filter.start_date}
                max={today}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-sm-2 d-flex gap-2">
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={applyFilter}
              >
                🔍 Filter
              </button>
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={resetFilter}
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Log */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white py-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h5 className="mb-0 h6">📋 Riwayat Aktivitas</h5>
          {totalItems > 0 && (
            <small className="opacity-75">
              Menampilkan {(currentPage - 1) * limit + 1}-
              {Math.min(currentPage * limit, totalItems)} dari {totalItems}
            </small>
          )}
        </div>
        <div className="card-body p-2 p-md-3">
          {logs.length === 0 ? (
            <div className="text-center py-5">
              <span className="fs-1">📭</span>
              <p className="text-muted mt-2 mb-0">
                Belum ada aktivitas yang tercatat
              </p>
              <small className="text-muted">
                {filter.start_date || filter.end_date
                  ? "Tidak ada aktivitas di rentang tanggal tersebut"
                  : "Aktivitas akan muncul di sini"}
              </small>
            </div>
          ) : (
            <>
              {/* Tabel Desktop */}
              <div className="d-none d-md-block table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0 w-100 small">
                  <thead className="table-light text-center">
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "20%" }}>Waktu</th>
                      <th style={{ width: "15%" }}>Pengguna</th>
                      <th style={{ width: "15%" }}>Aktivitas</th>
                      <th style={{ width: "45%" }}>Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => {
                      const info = getAktivitasInfo(log.aktivitas);
                      return (
                        <tr key={log.id_log || index}>
                          <td className="text-center">
                            {(currentPage - 1) * limit + index + 1}
                          </td>
                          <td className="text-nowrap small">
                            {formatDateTime(log.waktu)}
                          </td>
                          <td>
                            <strong className="small">
                              {log.pengguna || "-"}
                            </strong>
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
              </div>

              {/* Card Mobile */}
              <div className="d-md-none">
                {logs.map((log, index) => {
                  const info = getAktivitasInfo(log.aktivitas);
                  return (
                    <div
                      key={log.id_log || index}
                      className="card mb-2 shadow-sm border-start border-3"
                      style={{
                        borderLeftColor:
                          log.aktivitas === "Login"
                            ? "#6f42c1"
                            : log.aktivitas === "Logout"
                              ? "#6c757d"
                              : log.aktivitas === "Tambah"
                                ? "#0d6efd"
                                : log.aktivitas === "Ubah"
                                  ? "#ffc107"
                                  : log.aktivitas === "Hapus"
                                    ? "#dc3545"
                                    : log.aktivitas === "Transaksi"
                                      ? "#0dcaf0"
                                      : log.aktivitas === "Konfirmasi"
                                        ? "#198754"
                                        : log.aktivitas === "Tolak"
                                          ? "#dc3545"
                                          : "#dee2e6",
                      }}
                    >
                      <div className="card-body py-2 px-3">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <span className={`badge ${info.badge} small`}>
                            {info.icon} {log.aktivitas}
                          </span>
                          <small className="text-muted">
                            #{(currentPage - 1) * limit + index + 1}
                          </small>
                        </div>
                        <div className="small mb-1">
                          <strong>{log.pengguna || "-"}</strong>
                        </div>
                        <div className="small text-muted mb-1">
                          🕐 {formatDateTime(log.waktu)}
                        </div>
                        <div className="small">{log.deskripsi || "-"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonitorLog;
