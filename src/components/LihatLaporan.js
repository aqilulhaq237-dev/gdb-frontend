import React, { useState, useEffect } from "react";
import API from "../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Base URL backend untuk file upload
const BASE_URL = "https://gdb-backend-production-4dd1.up.railway.app";

function LihatLaporan({ user, onLogout, onNavigate }) {
  const [tahunList, setTahunList] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [programList, setProgramList] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPrograms, setFetchingPrograms] = useState(false);

  useEffect(() => {
    fetchTahunList();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchProgramByYear(selectedYear);
    } else {
      setProgramList([]);
      setSelectedProgramId("");
      setReport(null);
    }
  }, [selectedYear]);

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

  const fetchProgramByYear = async (tahun) => {
    // ✅ Validasi: tahun harus 4 digit angka
    if (!tahun || !/^\d{4}$/.test(tahun)) {
      setProgramList([]);
      setSelectedProgramId("");
      setReport(null);
      return;
    }

    setFetchingPrograms(true);
    setSelectedProgramId("");
    setReport(null);

    try {
      const response = await API.get("/program-kerja");
      if (response.data.status === "success") {
        const filtered = response.data.data.filter(
          (prog) => prog.status_program === "Selesai" && prog.periode === tahun,
        );
        setProgramList(filtered);
      }
    } catch (error) {
      console.error("Gagal memuat program:", error);
      try {
        const res = await API.get("/program-kerja/selesai");
        if (res.data.status === "success") {
          const filtered = res.data.data.filter(
            (prog) => prog.periode === tahun,
          );
          setProgramList(filtered);
        }
      } catch (err) {
        console.error("Gagal fallback:", err);
      }
    } finally {
      setFetchingPrograms(false);
    }
  };

  const fetchReport = async () => {
    // ✅ Validasi: pastikan program dipilih dan valid
    if (!selectedProgramId) {
      alert("⚠️ Pilih program kerja terlebih dahulu!");
      return;
    }

    // ✅ Validasi: pastikan selectedProgramId ada di programList
    const isValid = programList.some((p) => p.id_program == selectedProgramId);
    if (!isValid) {
      alert("⚠️ Program tidak valid. Silakan pilih ulang!");
      setSelectedProgramId("");
      return;
    }

    setLoading(true);
    setReport(null);

    try {
      const response = await API.get(`/laporan-keuangan/${selectedProgramId}`);
      if (response.data.status === "success") {
        setReport(response.data.data);
      } else {
        alert("❌ Gagal mengambil laporan keuangan");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Terjadi kesalahan saat mengambil laporan");
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

  const handleExportExcel = () => {
    if (!report) {
      alert("⚠️ Tidak ada laporan untuk diexport!");
      return;
    }

    // ✅ Data ringkasan - Semua nominal pakai titik
    const ringkasanData = [
      {
        "Nama Program": report.program?.nama_program || "-",
        "Tahun Ajaran": report.program?.periode || "-",
        Status: report.program?.status || "-",
        "Total Pemasukan": Number(
          report.ringkasan?.total_pemasukan || 0,
        ).toLocaleString("id-ID"),
        "Total Pengeluaran": Number(
          report.ringkasan?.total_pengeluaran || 0,
        ).toLocaleString("id-ID"),
        "Sisa Saldo": Number(report.ringkasan?.sisa_saldo || 0).toLocaleString(
          "id-ID",
        ),
        "Total Anggaran": Number(
          report.ringkasan?.total_anggaran || 0,
        ).toLocaleString("id-ID"),
        "Realisasi Anggaran": Number(
          report.ringkasan?.realisasi_anggaran || 0,
        ).toLocaleString("id-ID"),
        Persentase: `${report.ringkasan?.persentase || 0}%`,
      },
    ];

    // ✅ Data transaksi - Nominal pakai titik
    const transaksiData = (report.transaksi || []).map((t, index) => ({
      No: index + 1,
      Tanggal: t.tanggal,
      Jenis: t.jenis,
      Nominal: Number(t.nominal || 0).toLocaleString("id-ID"),
      Keterangan: t.keterangan || "-",
      Bukti: t.bukti_file ? `${BASE_URL}/uploads/${t.bukti_file}` : "-",
    }));

    // Buat workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Ringkasan
    const wsRingkasan = XLSX.utils.json_to_sheet(ringkasanData);
    wsRingkasan["!cols"] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsRingkasan, "Ringkasan");

    // Sheet 2: Transaksi
    if (transaksiData.length > 0) {
      const wsTransaksi = XLSX.utils.json_to_sheet(transaksiData);
      wsTransaksi["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 10 },
        { wch: 22 },
        { wch: 40 },
        { wch: 60 },
      ];
      XLSX.utils.book_append_sheet(workbook, wsTransaksi, "Transaksi");
    }

    // Generate & Download
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const programName =
      report.program?.nama_program?.replace(/\s/g, "_") || "program";
    const fileName = `Laporan_Keuangan_${programName}_${new Date().toISOString().split("T")[0]}.xlsx`;
    saveAs(data, fileName);
  };

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">
          📊 Laporan Keuangan Program Kerja
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

      {/* Filter */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white py-2">
          <h5 className="mb-0 h6">🔍 Filter Laporan</h5>
        </div>
        <div className="card-body py-3">
          <div className="row align-items-end g-3">
            {/* Pilih Tahun */}
            <div className="col-md-4">
              <label className="form-label small fw-bold mb-1">
                Pilih Tahun
              </label>
              <select
                className="form-select form-select-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">-- Pilih Tahun --</option>
                {tahunList.map((tahun, index) => (
                  <option key={index} value={tahun}>
                    {tahun}
                  </option>
                ))}
              </select>
              {selectedYear && (
                <small className="text-muted">
                  ✅ {programList.length} program selesai ditemukan
                </small>
              )}
            </div>

            {/* Pilih Program */}
            <div className="col-md-5">
              <label className="form-label small fw-bold mb-1">
                Pilih Program Kerja (Selesai)
                {fetchingPrograms && (
                  <span
                    className="ms-2 spinner-border spinner-border-sm"
                    role="status"
                    style={{ width: "12px", height: "12px" }}
                  />
                )}
              </label>
              <select
                className="form-select form-select-sm"
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(e.target.value);
                  setReport(null);
                }}
                disabled={!selectedYear || fetchingPrograms}
              >
                <option value="">
                  {!selectedYear
                    ? "-- Pilih tahun dulu --"
                    : fetchingPrograms
                      ? "Memuat program..."
                      : programList.length === 0
                        ? "-- Tidak ada program selesai --"
                        : "-- Pilih Program --"}
                </option>
                {programList.map((prog) => (
                  <option key={prog.id_program} value={prog.id_program}>
                    {prog.nama_program}
                  </option>
                ))}
              </select>
              {selectedProgramId && (
                <small className="text-muted">
                  📂{" "}
                  {programList.find((p) => p.id_program == selectedProgramId)
                    ?.kategori || "Kategori tidak tersedia"}
                </small>
              )}
            </div>

            {/* Tombol Lihat */}
            <div className="col-md-3">
              <button
                className="btn btn-primary w-100"
                onClick={fetchReport}
                disabled={!selectedProgramId || loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      style={{ width: "14px", height: "14px" }}
                    ></span>
                    Memuat...
                  </>
                ) : (
                  <>🔍 Lihat Laporan</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && !report && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted small">Memuat laporan keuangan...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !report && (
        <div className="alert alert-info small">
          👆 Silakan <strong>pilih tahun</strong> dan{" "}
          <strong>program kerja</strong> yang sudah selesai, lalu klik{" "}
          <strong>Lihat Laporan</strong> untuk menampilkan laporan keuangan.
        </div>
      )}

      {/* Hasil Laporan */}
      {report && (
        <div id="laporan-print">
          {/* Detail Program */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white py-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="mb-0 h6">
                📄 Laporan Keuangan - {report.program?.nama_program}
              </h5>
              {/* Tombol Export Excel di header */}
              <button
                className="btn btn-success btn-sm"
                onClick={handleExportExcel}
              >
                📥 Export Excel
              </button>
            </div>
            <div className="card-body py-2 px-3">
              <table className="table table-sm table-borderless mb-0 small">
                <tbody>
                  <tr>
                    <td style={{ width: "150px" }}>
                      <strong>Nama Program</strong>
                    </td>
                    <td>: {report.program?.nama_program}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Tahun Ajaran</strong>
                    </td>
                    <td>: {report.program?.periode || "-"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Status</strong>
                    </td>
                    <td>
                      :{" "}
                      <span className="badge bg-success">
                        ✅ {report.program?.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Ringkasan Keuangan */}
          <div className="row g-2 mb-4">
            <div className="col-6 col-md-3">
              <div className="card bg-success text-white h-100">
                <div className="card-body text-center py-3">
                  <small className="d-block">Total Pemasukan</small>
                  <h5 className="mb-0">
                    {formatRupiah(report.ringkasan?.total_pemasukan)}
                  </h5>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card bg-danger text-white h-100">
                <div className="card-body text-center py-3">
                  <small className="d-block">Total Pengeluaran</small>
                  <h5 className="mb-0">
                    {formatRupiah(report.ringkasan?.total_pengeluaran)}
                  </h5>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card bg-info text-white h-100">
                <div className="card-body text-center py-3">
                  <small className="d-block">Sisa Saldo</small>
                  <h5 className="mb-0">
                    {formatRupiah(report.ringkasan?.sisa_saldo)}
                  </h5>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card bg-warning h-100">
                <div className="card-body text-center py-3">
                  <small className="d-block">Realisasi Anggaran</small>
                  <h5 className="mb-0">{report.ringkasan?.persentase || 0}%</h5>
                  <small className="d-block mt-1">
                    {formatRupiah(report.ringkasan?.realisasi_anggaran)} /{" "}
                    {formatRupiah(report.ringkasan?.total_anggaran)}
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Transaksi */}
          <div className="card shadow-sm mb-4">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📋 Detail Transaksi</h6>
              {report.transaksi && report.transaksi.length > 0 && (
                <small className="text-muted">
                  {report.transaksi.length} transaksi
                </small>
              )}
            </div>
            <div className="card-body p-2 p-md-3">
              {!report.transaksi || report.transaksi.length === 0 ? (
                <div className="text-center py-3 text-muted small">
                  Belum ada transaksi tervalidasi.
                </div>
              ) : (
                <table className="table table-bordered table-sm align-middle mb-0 w-100 small">
                  <thead className="table-light text-center">
                    <tr>
                      <th style={{ width: "5%" }}>No</th>
                      <th style={{ width: "15%" }}>Tanggal</th>
                      <th style={{ width: "12%" }}>Jenis</th>
                      <th style={{ width: "20%" }}>Nominal</th>
                      <th style={{ width: "38%" }}>Keterangan</th>
                      <th style={{ width: "10%" }}>Bukti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.transaksi.map((t, index) => (
                      <tr key={t.id_transaksi}>
                        <td className="text-center">{index + 1}</td>
                        <td className="text-center">{t.tanggal}</td>
                        <td className="text-center">
                          <span
                            className={`badge ${t.jenis === "Masuk" ? "bg-success" : "bg-danger"}`}
                          >
                            {t.jenis}
                          </span>
                        </td>
                        <td className="text-end">{formatRupiah(t.nominal)}</td>
                        <td>{t.keterangan || "-"}</td>
                        <td className="text-center">
                          {t.bukti_file ? (
                            <a
                              href={`${BASE_URL}/uploads/${t.bukti_file}`}
                              target="_blank"
                              rel="noreferrer"
                              className="small"
                            >
                              📎 Lihat
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-bold">
                    <tr>
                      <td colSpan="3" className="text-end">
                        Total Pemasukan:
                      </td>
                      <td className="text-end text-success">
                        {formatRupiah(report.ringkasan?.total_pemasukan)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end">
                        Total Pengeluaran:
                      </td>
                      <td className="text-end text-danger">
                        {formatRupiah(report.ringkasan?.total_pengeluaran)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end">
                        Sisa Saldo:
                      </td>
                      <td className="text-end text-primary">
                        {formatRupiah(report.ringkasan?.sisa_saldo)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {/* Tombol Export Excel (Bottom) */}
          <div className="d-flex justify-content-end mb-4">
            <button className="btn btn-success" onClick={handleExportExcel}>
              📥 Export ke Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LihatLaporan;
