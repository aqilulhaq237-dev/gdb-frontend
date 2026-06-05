import React, { useState, useEffect } from "react";
import API from "../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function RiwayatPelaksanaan({ user, onLogout, onNavigate }) {
  const [riwayatList, setRiwayatList] = useState([]);
  const [tahunList, setTahunList] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchTahunList();
  }, []);

  useEffect(() => {
    fetchRiwayat();
  }, [currentPage, selectedYear]);

  const fetchTahunList = async () => {
    try {
      const response = await API.get("/periode/tahun-list");
      if (response.data.status === "success") {
        setTahunList(response.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat daftar tahun:", error);
    }
  };

  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      let url = `/riwayat?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
      if (selectedYear !== "all") {
        url += `&tahun=${encodeURIComponent(selectedYear)}`;
      }

      const response = await API.get(url);

      if (response.data.status === "success") {
        setRiwayatList(response.data.data);
        setTotalPages(response.data.total_pages || 1);
        setTotalData(response.data.total || 0);
      }
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
      try {
        const res = await API.get("/program-kerja/selesai");
        if (res.data.status === "success") {
          let data = res.data.data;
          if (selectedYear !== "all") {
            data = data.filter((p) => p.periode === selectedYear);
          }
          const start = (currentPage - 1) * ITEMS_PER_PAGE;
          const end = start + ITEMS_PER_PAGE;
          setRiwayatList(data.slice(start, end));
          setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
          setTotalData(data.length);
        }
      } catch (err) {
        console.error("Gagal fallback:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialReport = async (programId) => {
    setLoadingReport(true);
    try {
      const response = await API.get(`/laporan-keuangan/${programId}`);
      if (response.data.status === "success") {
        setSelectedReport(response.data.data);
        setShowModal(true);
      } else {
        alert("Gagal mengambil laporan keuangan");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat mengambil laporan");
    } finally {
      setLoadingReport(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleYearFilter = (year) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  const handleExportExcel = () => {
    if (riwayatList.length === 0) {
      alert("⚠️ Tidak ada data untuk diexport!");
      return;
    }

    const excelData = riwayatList.map((item, index) => ({
      No: (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
      "Nama Program": item.nama_program,
      Deskripsi: item.deskripsi_program || "-",
      Tahun: item.periode || "-",
      Kategori: item.kategori || "-",
      Status: item.status_program || "Selesai",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 40 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Pelaksanaan");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fileName = `Riwayat_Pelaksanaan_${new Date().toISOString().split("T")[0]}.xlsx`;
    saveAs(data, fileName);
  };

  // Hitung range data yang ditampilkan
  const startData =
    riwayatList.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endData = Math.min(currentPage * ITEMS_PER_PAGE, totalData);

  // Generate nomor halaman
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
      }
    }
    return pages;
  };

  const handleExportSingleExcel = async (program) => {
    setLoadingReport(true);
    try {
      const response = await API.get(`/laporan-keuangan/${program.id_program}`);
      if (response.data.status === "success") {
        const report = response.data.data;

        // Data ringkasan
        const ringkasanData = [
          {
            "Nama Program": report.program?.nama_program || "-",
            "Tahun Ajaran": report.program?.periode || "-",
            Status: report.program?.status || "-",
            "Total Pemasukan": report.ringkasan?.total_pemasukan || 0,
            "Total Pengeluaran": report.ringkasan?.total_pengeluaran || 0,
            "Sisa Saldo": report.ringkasan?.sisa_saldo || 0,
            "Total Anggaran": report.ringkasan?.total_anggaran || 0,
            "Realisasi Anggaran": report.ringkasan?.realisasi_anggaran || 0,
            Persentase: `${report.ringkasan?.persentase || 0}%`,
          },
        ];

        // Data transaksi
        const transaksiData = (report.transaksi || []).map((t, index) => ({
          No: index + 1,
          Tanggal: t.tanggal,
          Jenis: t.jenis,
          Nominal: t.nominal,
          Keterangan: t.keterangan || "-",
        }));

        // Buat workbook
        const workbook = XLSX.utils.book_new();

        // Sheet Ringkasan
        const wsRingkasan = XLSX.utils.json_to_sheet(ringkasanData);
        wsRingkasan["!cols"] = [
          { wch: 25 },
          { wch: 15 },
          { wch: 12 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 12 },
        ];
        XLSX.utils.book_append_sheet(workbook, wsRingkasan, "Ringkasan");

        // Sheet Transaksi
        if (transaksiData.length > 0) {
          const wsTransaksi = XLSX.utils.json_to_sheet(transaksiData);
          wsTransaksi["!cols"] = [
            { wch: 5 },
            { wch: 15 },
            { wch: 10 },
            { wch: 20 },
            { wch: 40 },
          ];
          XLSX.utils.book_append_sheet(workbook, wsTransaksi, "Transaksi");
        }

        // Download
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const data = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const programName =
          program.nama_program?.replace(/\s/g, "_") || "program";
        const fileName = `Laporan_${programName}_${new Date().toISOString().split("T")[0]}.xlsx`;
        saveAs(data, fileName);
      }
    } catch (error) {
      console.error("Gagal export:", error);
      alert("❌ Gagal mengexport data");
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">
          📜 Riwayat Pelaksanaan Program Kerja
        </h1>
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

      {/* Card Tabel + Filter Gabungan */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white py-2">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <h5 className="mb-0 h6">📋 Daftar Program Selesai</h5>

            <div className="ms-auto d-flex flex-wrap align-items-center gap-2">
              {/* Filter Tahun */}
              <div className="d-flex align-items-center gap-1">
                <label className="form-label mb-0 small text-white text-nowrap">
                  Filter:
                </label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "160px" }}
                  value={selectedYear}
                  onChange={(e) => handleYearFilter(e.target.value)}
                >
                  <option value="all">📅 Semua Tahun</option>
                  {tahunList.map((tahun, index) => (
                    <option key={index} value={tahun}>
                      {tahun}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Total */}
              <span className="badge bg-light text-dark small text-nowrap">
                📊 Total: {totalData} data
              </span>

              {/* Tombol Export */}
              <button
                className="btn btn-success btn-sm text-nowrap"
                onClick={handleExportExcel}
                disabled={riwayatList.length === 0}
              >
                📥 Export Excel
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-2 p-md-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-2 text-muted small">Memuat data riwayat...</p>
            </div>
          ) : riwayatList.length === 0 ? (
            <div className="text-center py-5">
              <span className="fs-1">📭</span>
              <p className="text-muted mt-2">Belum ada program yang selesai</p>
              {selectedYear !== "all" && (
                <p className="text-muted small">
                  Coba pilih tahun lain atau "Semua Tahun"
                </p>
              )}
            </div>
          ) : (
            <>
              <table className="table table-bordered table-hover align-middle mb-0 w-100">
                <thead className="table-light text-center small">
                  <tr>
                    <th style={{ width: "5%" }}>No</th>
                    <th style={{ width: "35%" }}>Program Kerja</th>
                    <th style={{ width: "15%" }}>Tahun</th>
                    <th style={{ width: "15%" }}>Status</th>
                    <th style={{ width: "15%" }}>Kategori</th>
                    <th style={{ width: "15%" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatList.map((item, index) => (
                    <tr key={item.id_program}>
                      <td className="text-center small">{startData + index}</td>
                      <td>
                        <strong className="small">{item.nama_program}</strong>
                        {item.deskripsi_program && (
                          <small className="text-muted d-block">
                            {item.deskripsi_program?.substring(0, 80)}
                            {item.deskripsi_program?.length > 80 ? "..." : ""}
                          </small>
                        )}
                      </td>
                      <td className="text-center small">
                        {item.periode || "-"}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge small ${
                            item.status_program === "Selesai"
                              ? "bg-success"
                              : item.status_program === "Berjalan"
                                ? "bg-primary"
                                : item.status_program === "Batal"
                                  ? "bg-danger"
                                  : "bg-warning"
                          }`}
                        >
                          {item.status_program || "Selesai"}
                        </span>
                      </td>
                      <td className="text-center small">
                        {item.kategori ? (
                          <span className="badge bg-info text-dark">
                            {item.kategori}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() =>
                              fetchFinancialReport(item.id_program)
                            }
                            disabled={loadingReport}
                            title="Lihat Laporan Keuangan"
                          >
                            📄 Lihat
                          </button>
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => handleExportSingleExcel(item)}
                            title="Export ke Excel"
                          >
                            📥
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Info & Pagination */}
              <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-2">
                <small className="text-muted">
                  Menampilkan {startData}-{endData} dari {totalData} data
                </small>

                {totalPages > 1 && (
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li
                        className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          ◀ Prev
                        </button>
                      </li>

                      {getPageNumbers()[0] > 1 && (
                        <>
                          <li className="page-item">
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(1)}
                            >
                              1
                            </button>
                          </li>
                          {getPageNumbers()[0] > 2 && (
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}
                        </>
                      )}

                      {getPageNumbers().map((page) => (
                        <li
                          key={page}
                          className={`page-item ${currentPage === page ? "active" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}

                      {getPageNumbers()[getPageNumbers().length - 1] <
                        totalPages && (
                        <>
                          {getPageNumbers()[getPageNumbers().length - 1] <
                            totalPages - 1 && (
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}
                          <li className="page-item">
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(totalPages)}
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
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next ▶
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Laporan Keuangan */}
      {showModal && selectedReport && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title h6">
                  📄 Laporan Keuangan - {selectedReport.program?.nama_program}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-2 mb-3">
                  <div className="col-6 col-md-3">
                    <div className="card bg-success text-white h-100">
                      <div className="card-body text-center py-2">
                        <small>Total Pemasukan</small>
                        <h6 className="mb-0">
                          {formatRupiah(
                            selectedReport.ringkasan?.total_pemasukan,
                          )}
                        </h6>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card bg-danger text-white h-100">
                      <div className="card-body text-center py-2">
                        <small>Total Pengeluaran</small>
                        <h6 className="mb-0">
                          {formatRupiah(
                            selectedReport.ringkasan?.total_pengeluaran,
                          )}
                        </h6>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card bg-info text-white h-100">
                      <div className="card-body text-center py-2">
                        <small>Sisa Saldo</small>
                        <h6 className="mb-0">
                          {formatRupiah(selectedReport.ringkasan?.sisa_saldo)}
                        </h6>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card bg-warning h-100">
                      <div className="card-body text-center py-2">
                        <small>Realisasi</small>
                        <h6 className="mb-0">
                          {selectedReport.ringkasan?.persentase || 0}%
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header py-1 small fw-bold">
                    Daftar Transaksi
                  </div>
                  <div className="card-body p-0">
                    {!selectedReport.transaksi ||
                    selectedReport.transaksi.length === 0 ? (
                      <div className="text-center py-3 text-muted small">
                        Belum ada transaksi tervalidasi.
                      </div>
                    ) : (
                      <table className="table table-sm table-bordered mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Tanggal</th>
                            <th>Jenis</th>
                            <th>Nominal</th>
                            <th>Keterangan</th>
                            <th>Bukti</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.transaksi.map((t) => (
                            <tr key={t.id_transaksi}>
                              <td>{t.tanggal}</td>
                              <td>
                                <span
                                  className={`badge ${t.jenis === "Masuk" ? "bg-success" : "bg-danger"}`}
                                >
                                  {t.jenis}
                                </span>
                              </td>
                              <td>{formatRupiah(t.nominal)}</td>
                              <td>{t.keterangan || "-"}</td>
                              <td>
                                {t.bukti_file ? (
                                  <a
                                    href={`https://gdb-backend-production-4dd1.up.railway.app/uploads/${t.bukti_file}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="small"
                                  >
                                    Lihat
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer py-2">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={closeModal}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingReport && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content text-center py-4">
              <div
                className="spinner-border text-primary mx-auto"
                role="status"
              />
              <p className="mt-2 mb-0 small">Memuat laporan keuangan...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiwayatPelaksanaan;
