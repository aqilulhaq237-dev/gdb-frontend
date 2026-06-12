import React, { useEffect, useState } from "react";
import API from "../services/api";
import { swalSukses, swalError, swalHapus, swalWarning } from "../utils/swal";

function TransaksiKas({ user, onLogout, onNavigate }) {
  const [transaksiList, setTransaksiList] = useState([]);
  const [allTransaksi, setAllTransaksi] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [rabList, setRabList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    id_program: "",
    jenis: "Masuk",
    nominal: "",
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: "",
    status_bukti: "ada",
    bukti_file: null,
    status: "Selesai",
    sumber_dana: "Saldo",
  });
  const [selectedRAB, setSelectedRAB] = useState(null);
  const [periodeAktif, setPeriodeAktif] = useState([]);
  const [saving, setSaving] = useState(false);
  const [displayNominal, setDisplayNominal] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [searchProgram, setSearchProgram] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const periodeRes = await API.get("/periode/aktif");
      const periodeData = periodeRes.data.data || [];
      setPeriodeAktif(periodeData);

      const progRes = await API.get("/program-kerja");
      if (progRes.data.status === "success") {
        let programs = progRes.data.data.filter(
          (prog) => prog.status_program === "Berjalan",
        );
        if (periodeData.length > 0) {
          programs = programs.filter((prog) =>
            periodeData.some((p) => prog.periode?.toString() === p.toString()),
          );
        }
        setProgramList(programs);
      }

      const transRes = await API.get("/transaksi", {
        params: { hide_selesai: "true" },
      });
      if (transRes.data.status === "success") {
        setAllTransaksi(transRes.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchProgram) {
      setTransaksiList(
        allTransaksi.filter((t) => t.id_program == searchProgram),
      );
    } else {
      setTransaksiList([]);
    }
  }, [searchProgram, allTransaksi]);

  const fetchRAB = async (id_program) => {
    try {
      const response = await API.get("/rab");
      if (response.data.status === "success") {
        let filtered = response.data.data.filter(
          (r) => r.id_program == id_program,
        );

        const usedRABIds = [];
        allTransaksi
          .filter((t) => t.id_program == id_program && t.jenis === "Keluar")
          .forEach((t) => {
            const match = t.keterangan?.match(/\[RAB:(\d+)\]/);
            if (match) {
              usedRABIds.push(parseInt(match[1]));
            }
          });

        filtered = filtered.filter((rab) => !usedRABIds.includes(rab.id_rab));
        filtered.sort((a, b) =>
          (a.nama_item || "").localeCompare(b.nama_item || "", "id"),
        );
        setRabList(filtered);
      }
    } catch (error) {
      console.error("Gagal memuat RAB:", error);
    }
  };

  const formatNominal = (value) => {
    if (!value && value !== 0) return "";
    const strValue = value.toString().replace(/\D/g, "");
    if (strValue === "") return "";
    return strValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "id_program") {
      setFormData({ ...formData, id_program: value });
      if (formData.jenis === "Keluar") {
        fetchRAB(value);
      }
      setSelectedRAB(null);
    } else if (name === "jenis") {
      setFormData({
        ...formData,
        jenis: value,
        id_program: searchProgram || "",
        nominal: "",
        status: value === "Masuk" ? "Selesai" : "Pending",
        status_bukti: "ada",
        sumber_dana: "Saldo",
        keterangan: "",
      });
      setDisplayNominal("");
      setSelectedRAB(null);
      // ✅ Fetch RAB jika pilih Keluar dan ada program
      if (value === "Keluar" && (searchProgram || formData.id_program)) {
        fetchRAB(searchProgram || formData.id_program);
      } else {
        setRabList([]);
      }
    } else if (name === "nominal") {
      const rawValue = value.replace(/\./g, "").replace(/\D/g, "");
      const numberValue = parseInt(rawValue) || 0;
      const formatted =
        rawValue === "" ? "" : rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      setFormData({ ...formData, nominal: numberValue });
      setDisplayNominal(formatted);
    } else if (name === "status_bukti") {
      setFormData({
        ...formData,
        status_bukti: value,
        status: value === "ada" ? "Selesai" : "Pending",
        bukti_file: value === "tidak_ada" ? null : formData.bukti_file,
      });
    } else if (name === "bukti_file") {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 500 * 1024) {
          compressImage(file, (compressedFile) => {
            setFormData({ ...formData, bukti_file: compressedFile });
          });
        } else {
          setFormData({ ...formData, bukti_file: file });
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxSize = 1024;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            callback(compressedFile);
          },
          "image/jpeg",
          0.7,
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRAB = (rab) => {
    setSelectedRAB(rab);
    const harga = parseFloat(rab.harga_satuan) || 0;
    setFormData({
      ...formData,
      nominal: harga,
      keterangan: rab.nama_item,
    });
    setDisplayNominal(formatNominal(harga));
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  const cleanKeterangan = (keterangan) => {
    if (!keterangan) return "-";
    let cleaned = keterangan.replace(/\[RAB:\d+\]\s*/g, "");
    cleaned = cleaned.replace(/\[(Saldo|Sponsorship)\]\s*/g, "");
    return cleaned.trim() || "-";
  };

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.id_program) {
      swalWarning("Perhatian!", "Silakan pilih program kerja terlebih dahulu!");
      return;
    }

    // ✅ Validasi: Pengeluaran harus pilih RAB (jika RAB tersedia)
    if (formData.jenis === "Keluar" && rabList.length > 0 && !selectedRAB) {
      swalWarning(
        "Perhatian!",
        "Silakan pilih item dari Daftar Biaya RAB terlebih dahulu!",
      );
      return;
    }

    if (!formData.nominal || isNaN(formData.nominal) || formData.nominal <= 0) {
      swalWarning("Perhatian!", "Nominal harus diisi dengan angka!");
      return;
    }

    if (!formData.tanggal) {
      swalWarning("Perhatian!", "Silakan pilih tanggal transaksi!");
      return;
    }

    if (formData.tanggal > today) {
      swalWarning(
        "Perhatian!",
        "Tanggal transaksi tidak boleh lebih dari hari ini!",
      );
      return;
    }

    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("id_program", formData.id_program);
      formDataToSend.append("id_pengguna", user.id_user);
      formDataToSend.append("jenis", formData.jenis);
      formDataToSend.append("nominal", formData.nominal);
      formDataToSend.append("tanggal", formData.tanggal);

      let finalKeterangan = formData.keterangan;
      if (selectedRAB && formData.jenis === "Keluar") {
        finalKeterangan = `[RAB:${selectedRAB.id_rab}] ${formData.keterangan || selectedRAB.nama_item}`;
      }
      if (formData.jenis === "Masuk" && formData.sumber_dana) {
        finalKeterangan = `[${formData.sumber_dana}] ${finalKeterangan}`;
      }
      formDataToSend.append("keterangan", finalKeterangan);
      formDataToSend.append("status", formData.status);

      if (formData.bukti_file) {
        formDataToSend.append("bukti_file", formData.bukti_file);
      }

      if (editingId) {
        await API.put(`/transaksi/${editingId}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        swalSukses("Berhasil!", "Transaksi berhasil diubah!");
      } else {
        await API.post("/transaksi", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (
          formData.jenis === "Keluar" &&
          formData.status_bukti === "tidak_ada"
        ) {
          swalSukses(
            "Berhasil!",
            "Transaksi disimpan dengan status Pending. Menunggu konfirmasi Ketua.",
          );
        } else {
          swalSukses("Berhasil!", "Transaksi berhasil ditambahkan!");
        }
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      swalError("Gagal!", "Gagal menyimpan transaksi. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setError("");
    setFormData({
      id_program: searchProgram || "",
      jenis: "Masuk",
      nominal: "",
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: "",
      status_bukti: "ada",
      bukti_file: null,
      status: "Selesai",
      sumber_dana: "Saldo",
    });
    setDisplayNominal("");
    setRabList([]);
    setSelectedRAB(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
    // ✅ Fetch RAB setelah modal terbuka
    if (searchProgram) {
      fetchRAB(searchProgram);
    }
  };

  const openEditModal = (transaksi) => {
    setEditingId(transaksi.id_transaksi);
    setError("");

    let cleanKet = transaksi.keterangan || "";
    cleanKet = cleanKet
      .replace(/\[RAB:\d+\]\s*/, "")
      .replace(/\[(Saldo|Sponsorship)\]\s*/, "");

    setFormData({
      id_program: transaksi.id_program,
      jenis: transaksi.jenis,
      nominal: transaksi.nominal,
      tanggal: transaksi.tanggal,
      keterangan: cleanKet,
      status_bukti: transaksi.status === "Pending" ? "tidak_ada" : "ada",
      bukti_file: null,
      status: transaksi.status || "Selesai",
      sumber_dana: "Saldo",
    });
    setDisplayNominal(formatNominal(transaksi.nominal));
    if (transaksi.jenis === "Keluar") {
      fetchRAB(transaksi.id_program);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await swalHapus(
      "Transaksi yang dihapus tidak dapat dikembalikan.",
    );
    if (result.isConfirmed) {
      try {
        await API.delete(`/transaksi/${id}`);
        swalSukses("Berhasil!", "Transaksi berhasil dihapus!");
        fetchData();
      } catch (error) {
        swalError("Gagal!", "Gagal menghapus transaksi.");
      }
    }
  };

  const totalMasuk = transaksiList
    .filter(
      (t) =>
        t.jenis === "Masuk" &&
        (t.status === "Valid" ||
          t.status_validasi === "Valid" ||
          t.status === "Selesai"),
    )
    .reduce((sum, t) => sum + (parseFloat(t.nominal) || 0), 0);

  const totalKeluar = transaksiList
    .filter(
      (t) =>
        t.jenis === "Keluar" &&
        (t.status === "Valid" ||
          t.status_validasi === "Valid" ||
          t.status === "Selesai"),
    )
    .reduce((sum, t) => sum + (parseFloat(t.nominal) || 0), 0);

  const sisaSaldo = totalMasuk - totalKeluar;

  const selectedProgramData = programList.find(
    (p) => p.id_program == searchProgram,
  );

  const modalProgramList = searchProgram
    ? programList.filter((p) => p.id_program == searchProgram)
    : programList;

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">💳 Transaksi Kas</h1>
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

      {/* Info Periode Aktif */}
      {periodeAktif.length > 0 && (
        <div className="alert alert-info py-2 small mb-3">
          📅 <strong>Periode Aktif:</strong>{" "}
          {periodeAktif.map((t, i) => (
            <span key={i} className="badge bg-success me-1">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-danger py-2 mb-3 small">{error}</div>
      )}

      {/* 🔍 Filter Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header card-header-orange py-2">
          <h5 className="mb-0 h6">🔍 Filter Transaksi</h5>
        </div>
        <div className="card-body py-3">
          <div className="row align-items-end g-3">
            <div className="col-md-8">
              <label className="form-label small fw-bold mb-1">
                Pilih Program Kerja (Berjalan)
              </label>
              <select
                className="form-select form-select-sm"
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
              >
                <option value="">-- Pilih Program --</option>
                {programList.map((prog) => (
                  <option key={prog.id_program} value={prog.id_program}>
                    {prog.nama_program} ({prog.periode || "-"}) -{" "}
                    {prog.status_program || "?"}
                  </option>
                ))}
              </select>
              {searchProgram && (
                <small className="text-muted">
                  ✅ {transaksiList.length} transaksi ditemukan
                  {selectedProgramData?.kategori && (
                    <> &nbsp;|&nbsp; 📂 {selectedProgramData.kategori}</>
                  )}
                </small>
              )}
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                onClick={() => {
                  setSearchProgram(selectedProgram);
                  setTimeout(() => {
                    document
                      .getElementById("transaksi-content")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                disabled={!selectedProgram}
              >
                🔍 Cari Program Kerja
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hasil Filter */}
      {searchProgram && selectedProgramData && (
        <div id="transaksi-content">
          {/* 📄 Detail Card */}
          <div className="card shadow-sm mb-4">
            <div className="card-header card-header-blue py-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="mb-0 h6">
                📄 Transaksi Kas - {selectedProgramData.nama_program}
              </h5>
              <button className="btn btn-success btn-sm" onClick={openAddModal}>
                ➕ Tambah Transaksi
              </button>
            </div>
            <div className="card-body py-2 px-3">
              <table className="table table-sm table-borderless mb-0 small">
                <tbody>
                  <tr>
                    <td style={{ width: "150px" }}>
                      <strong>Nama Program</strong>
                    </td>
                    <td>: {selectedProgramData.nama_program}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Tahun Ajaran</strong>
                    </td>
                    <td>: {selectedProgramData.periode || "-"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Status</strong>
                    </td>
                    <td>
                      :{" "}
                      <span className="badge bg-primary">
                        ▶️ {selectedProgramData.status_program}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 💰 Statistik Cards */}
          <div className="row g-2 mb-4">
            <div className="col-6 col-md-3">
              <div className="card bg-success text-white h-100 shadow-sm">
                <div className="card-body text-center py-3">
                  <small className="d-block">Total Pemasukan</small>
                  <h5 className="mb-0 mt-1">{formatRupiah(totalMasuk)}</h5>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card bg-danger text-white h-100 shadow-sm">
                <div className="card-body text-center py-3">
                  <small className="d-block">Total Pengeluaran</small>
                  <h5 className="mb-0 mt-1">{formatRupiah(totalKeluar)}</h5>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className={`card h-100 shadow-sm ${sisaSaldo >= 0 ? "bg-info" : "bg-warning"} text-white`}
              >
                <div className="card-body text-center py-3">
                  <small className="d-block">Sisa Saldo</small>
                  <h5 className="mb-0 mt-1">{formatRupiah(sisaSaldo)}</h5>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card bg-warning text-dark h-100 shadow-sm">
                <div className="card-body text-center py-3">
                  <small className="d-block">Status Program</small>
                  <h5 className="mb-0 mt-1">▶️ Berjalan</h5>
                </div>
              </div>
            </div>
          </div>

          {/* 📋 Tabel Transaksi */}
          <div className="card shadow-sm mb-4">
            <div className="card-header card-header-blue py-2 d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📋 Detail Transaksi</h6>
              {transaksiList.length > 0 && (
                <small className="text-muted">
                  {transaksiList.length} transaksi
                </small>
              )}
            </div>
            <div className="card-body p-2 p-md-3">
              {transaksiList.length === 0 ? (
                <div className="text-center py-3 text-muted small">
                  Belum ada transaksi untuk program ini.
                </div>
              ) : (
                <table className="table table-bordered table-sm align-middle mb-0 w-100 small">
                  <thead className="table-light text-center">
                    <tr>
                      <th style={{ width: "5%" }}>No</th>
                      <th style={{ width: "15%" }}>Tanggal</th>
                      <th style={{ width: "10%" }}>Jenis</th>
                      <th style={{ width: "18%" }}>Nominal</th>
                      <th style={{ width: "32%" }}>Keterangan</th>
                      <th style={{ width: "10%" }}>Bukti</th>
                      <th style={{ width: "10%" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaksiList.map((t, index) => (
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
                        <td>{cleanKeterangan(t.keterangan)}</td>
                        <td className="text-center">
                          {t.bukti_file ? (
                            <a
                              href={`https://gdb-backend-production-4dd1.up.railway.app/uploads/${t.bukti_file}`}
                              target="_blank"
                              rel="noreferrer"
                              className="small"
                            >
                              📎 Lihat
                            </a>
                          ) : (
                            <span
                              className={`badge ${t.status === "Valid" || t.status_validasi === "Valid" ? "bg-success" : "bg-warning text-dark"}`}
                            >
                              {t.status === "Valid" ||
                              t.status_validasi === "Valid"
                                ? "✅ Valid"
                                : "⏳ Pending"}
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => openEditModal(t)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(t.id_transaksi)}
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </div>
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
                        {formatRupiah(totalMasuk)}
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end">
                        Total Pengeluaran:
                      </td>
                      <td className="text-end text-danger">
                        {formatRupiah(totalKeluar)}
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end">
                        Sisa Saldo:
                      </td>
                      <td className="text-end text-primary">
                        {formatRupiah(sisaSaldo)}
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchProgram && (
        <div className="alert alert-info small">
          👆 Silakan <strong>pilih program kerja</strong> yang berstatus{" "}
          <strong>Berjalan</strong>, lalu klik{" "}
          <strong>Cari Program Kerja</strong> untuk melihat transaksi kas.
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            style={{ maxHeight: "90vh" }}
          >
            <div className="modal-content" style={{ maxHeight: "90vh" }}>
              <div
                className="modal-header py-2"
                style={{ position: "sticky", top: 0, zIndex: 10 }}
              >
                <h5 className="modal-title h6">
                  {editingId
                    ? "✏️ Edit Data Transaksi"
                    : "➕ Tambah Transaksi Baru"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div
                  className="modal-body"
                  style={{
                    overflowY: "auto",
                    maxHeight: "calc(90vh - 120px)",
                    padding: "1rem",
                  }}
                >
                  {error && (
                    <div className="alert alert-danger py-2 mb-3 small">
                      {error}
                    </div>
                  )}

                  {/* Jenis Transaksi */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Jenis Transaksi
                    </label>
                    <div className="d-flex gap-3">
                      <label className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="jenis"
                          value="Masuk"
                          checked={formData.jenis === "Masuk"}
                          onChange={handleChange}
                        />
                        <span className="badge bg-success ms-1">
                          💰 Pemasukan
                        </span>
                      </label>
                      <label className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="jenis"
                          value="Keluar"
                          checked={formData.jenis === "Keluar"}
                          onChange={handleChange}
                        />
                        <span className="badge bg-danger ms-1">
                          📤 Pengeluaran
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Program Kerja */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Pilih Program Kerja <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-sm ${searchProgram ? "bg-light" : ""}`}
                      name="id_program"
                      value={formData.id_program}
                      onChange={handleChange}
                      required
                      disabled={searchProgram !== ""}
                    >
                      <option value="">
                        {searchProgram
                          ? selectedProgramData?.nama_program ||
                            "Program hasil pencarian"
                          : "-- Pilih Program Kerja --"}
                      </option>
                      {modalProgramList.map((prog) => (
                        <option key={prog.id_program} value={prog.id_program}>
                          {prog.nama_program} ({prog.periode})
                        </option>
                      ))}
                    </select>
                    {searchProgram ? (
                      <small className="text-muted">
                        🔒 Program otomatis terisi sesuai hasil pencarian
                      </small>
                    ) : (
                      <small className="text-muted">
                        Hanya program dengan status Berjalan yang ditampilkan
                      </small>
                    )}
                  </div>

                  {/* Sumber Dana (Pemasukan) */}
                  {formData.jenis === "Masuk" && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">
                        Sumber Dana
                      </label>
                      <select
                        className="form-select form-select-sm"
                        name="sumber_dana"
                        value={formData.sumber_dana}
                        onChange={handleChange}
                      >
                        <option value="Saldo">💰 Saldo Kas</option>
                        <option value="Sponsorship">🤝 Sponsorship</option>
                      </select>
                    </div>
                  )}

                  {/* Daftar RAB (Pengeluaran) */}
                  {formData.jenis === "Keluar" && rabList.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">
                        📋 Daftar Biaya RAB
                      </label>
                      <div className="card bg-light">
                        <div
                          className="card-body p-2"
                          style={{ maxHeight: "150px", overflowY: "auto" }}
                        >
                          <table className="table table-sm table-bordered mb-0 small">
                            <thead
                              className="table-light text-center"
                              style={{ position: "sticky", top: 0 }}
                            >
                              <tr>
                                <th>Pilih</th>
                                <th>Item Biaya</th>
                                <th>Harga Claim</th>
                                <th>Keterangan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rabList.map((rab) => (
                                <tr
                                  key={rab.id_rab}
                                  className={
                                    selectedRAB?.id_rab === rab.id_rab
                                      ? "table-success"
                                      : ""
                                  }
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleSelectRAB(rab)}
                                >
                                  <td className="text-center">
                                    <input
                                      type="radio"
                                      checked={
                                        selectedRAB?.id_rab === rab.id_rab
                                      }
                                      readOnly
                                    />
                                  </td>
                                  <td>{rab.nama_item}</td>
                                  <td className="text-end">
                                    {formatRupiah(rab.harga_satuan)}
                                  </td>
                                  <td>
                                    <small>{rab.keterangan || "-"}</small>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nominal */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Nominal (Rp) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="nominal"
                      value={displayNominal}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        const allowedKeys = [
                          "Backspace",
                          "Delete",
                          "ArrowLeft",
                          "ArrowRight",
                          "Tab",
                          "Home",
                          "End",
                          "0",
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                        ];
                        if (
                          !allowedKeys.includes(e.key) &&
                          !e.ctrlKey &&
                          !e.metaKey
                        )
                          e.preventDefault();
                      }}
                      required
                      placeholder="Masukkan nominal"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    <small className="text-muted">
                      ✍️ Titik pemisah ribuan muncul otomatis
                    </small>
                  </div>

                  {/* Tanggal */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Tanggal Transaksi <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="tanggal"
                      value={formData.tanggal}
                      onChange={handleChange}
                      max={today}
                      required
                    />
                  </div>

                  {/* Status Bukti (Pengeluaran) */}
                  {formData.jenis === "Keluar" && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">
                        Status Bukti
                      </label>
                      <div className="d-flex gap-3">
                        <label className="form-check">
                          <input
                            type="radio"
                            className="form-check-input"
                            name="status_bukti"
                            value="ada"
                            checked={formData.status_bukti === "ada"}
                            onChange={handleChange}
                          />
                          <span>✅ Ada Bukti</span>
                        </label>
                        <label className="form-check">
                          <input
                            type="radio"
                            className="form-check-input"
                            name="status_bukti"
                            value="tidak_ada"
                            checked={formData.status_bukti === "tidak_ada"}
                            onChange={handleChange}
                          />
                          <span>❌ Tidak Ada Bukti</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Upload Bukti */}
                  {formData.jenis === "Keluar" &&
                    formData.status_bukti === "ada" && (
                      <div className="mb-3 p-3 bg-light rounded">
                        <label className="form-label small fw-bold">
                          Upload Foto/Dokumen
                        </label>
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          name="bukti_file"
                          accept="image/*,.pdf"
                          onChange={handleChange}
                        />
                        <small className="text-muted">Max 500KB</small>
                        <div className="mt-2">
                          <span className="badge bg-success">
                            ✅ Status: Selesai (Otomatis)
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Peringatan Pending */}
                  {formData.jenis === "Keluar" &&
                    formData.status_bukti === "tidak_ada" && (
                      <div className="mb-3 p-3 bg-warning-light rounded border border-warning">
                        <small>
                          ⚠️ Memerlukan <strong>konfirmasi Ketua</strong>.
                        </small>
                        <div className="mt-2">
                          <span className="badge bg-warning text-dark">
                            ⏳ Status: Pending
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Status Pemasukan */}
                  {formData.jenis === "Masuk" && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <span className="badge bg-success">
                        ✅ Status: Selesai (Otomatis)
                      </span>
                    </div>
                  )}

                  {/* Keterangan */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Keterangan
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      name="keterangan"
                      rows="3"
                      value={formData.keterangan}
                      onChange={handleChange}
                      placeholder="Keterangan transaksi"
                    />
                  </div>
                </div>

                <div
                  className="modal-footer py-2"
                  style={{
                    position: "sticky",
                    bottom: 0,
                    backgroundColor: "white",
                    borderTop: "1px solid #dee2e6",
                    zIndex: 10,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowModal(false)}
                  >
                    ❌ Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                  >
                    {saving ? "⏳ Menyimpan..." : "💾 Simpan Transaksi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransaksiKas;
