import React, { useEffect, useState } from "react";
import API from "../services/api";

function TransaksiKas({ user, onLogout, onNavigate }) {
  const [transaksiList, setTransaksiList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [rabList, setRabList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id_program: "",
    jenis: "Masuk",
    nominal: "",
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: "",
    status_bukti: "ada",
    bukti_file: null,
    status: "Selesai",
  });
  const [selectedRAB, setSelectedRAB] = useState(null);
  const [periodeAktif, setPeriodeAktif] = useState([]);
  const [saving, setSaving] = useState(false);

  // Format nominal dengan titik
  const [displayNominal, setDisplayNominal] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil periode aktif
      const periodeRes = await API.get("/periode/aktif");
      const periodeData = periodeRes.data.data || [];
      setPeriodeAktif(periodeData);

      // Ambil program kerja sesuai periode aktif
      const progRes = await API.get("/program-kerja");
      if (progRes.data.status === "success") {
        let programs = progRes.data.data.filter(
          (prog) => prog.status_program !== "Selesai",
        );
        if (periodeData.length > 0) {
          programs = programs.filter((prog) =>
            periodeData.some((p) => prog.periode?.toString() === p.toString()),
          );
        }
        setProgramList(programs);
      }

      // Ambil transaksi
      const transRes = await API.get("/transaksi");
      if (transRes.data.status === "success") {
        setTransaksiList(transRes.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch RAB ketika program dipilih (untuk pengeluaran)
  const fetchRAB = async (id_program) => {
    try {
      const response = await API.get("/rab");
      if (response.data.status === "success") {
        const filtered = response.data.data.filter(
          (r) => r.id_program == id_program,
        );
        setRabList(filtered);
      }
    } catch (error) {
      console.error("Gagal memuat RAB:", error);
    }
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
        id_program: "",
        nominal: "",
        status: value === "Masuk" ? "Selesai" : "Pending",
        status_bukti: "ada",
      });
      setDisplayNominal("");
      setRabList([]);
      setSelectedRAB(null);
    } else if (name === "nominal") {
      // Hapus titik dan karakter non-digit
      const rawValue = value.replace(/\D/g, "");
      const numberValue = parseInt(rawValue) || 0;
      setFormData({ ...formData, nominal: numberValue });
      setDisplayNominal(formatNominal(numberValue));
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
        // Kompres jika > 500KB
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

  // Kompresi gambar
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize jika terlalu besar
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
    setFormData({
      ...formData,
      nominal: parseFloat(rab.harga_satuan),
      keterangan: rab.nama_item,
    });
    setDisplayNominal(formatNominal(parseFloat(rab.harga_satuan)));
  };

  const formatNominal = (value) => {
    if (!value && value !== 0) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  // Tanggal maksimal hari ini
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id_program) {
      alert("⚠️ Pilih program kerja!");
      return;
    }

    if (!formData.nominal || formData.nominal <= 0) {
      alert("⚠️ Masukkan nominal!");
      return;
    }

    if (!formData.tanggal) {
      alert("⚠️ Pilih tanggal!");
      return;
    }

    if (formData.tanggal > today) {
      alert("⚠️ Tanggal tidak boleh lebih dari hari ini!");
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
      formDataToSend.append("keterangan", formData.keterangan);
      formDataToSend.append("status", formData.status);

      if (formData.bukti_file) {
        formDataToSend.append("bukti_file", formData.bukti_file);
      }

      if (editingId) {
        await API.put(`/transaksi/${editingId}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("✅ Transaksi berhasil diubah");
      } else {
        await API.post("/transaksi", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (
          formData.jenis === "Keluar" &&
          formData.status_bukti === "tidak_ada"
        ) {
          alert(
            "✅ Transaksi disimpan dengan status Pending. Menunggu konfirmasi Ketua.",
          );
        } else {
          alert("✅ Transaksi berhasil ditambahkan");
        }
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("❌ Gagal menyimpan transaksi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus transaksi ini?")) return;
    try {
      await API.delete(`/transaksi/${id}`);
      alert("✅ Transaksi berhasil dihapus");
      fetchData();
    } catch (error) {
      alert("❌ Gagal menghapus transaksi");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      id_program: "",
      jenis: "Masuk",
      nominal: "",
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: "",
      status_bukti: "ada",
      bukti_file: null,
      status: "Selesai",
    });
    setDisplayNominal("");
    setRabList([]);
    setSelectedRAB(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (transaksi) => {
    setEditingId(transaksi.id_transaksi);
    setFormData({
      id_program: transaksi.id_program,
      jenis: transaksi.jenis,
      nominal: transaksi.nominal,
      tanggal: transaksi.tanggal,
      keterangan: transaksi.keterangan || "",
      status_bukti: transaksi.status === "Pending" ? "tidak_ada" : "ada",
      bukti_file: null,
      status: transaksi.status || "Selesai",
    });
    setDisplayNominal(formatNominal(transaksi.nominal));
    if (transaksi.jenis === "Keluar") {
      fetchRAB(transaksi.id_program);
    }
    setShowModal(true);
  };

  const getNamaProgram = (id) => {
    return programList.find((p) => p.id_program == id)?.nama_program || "-";
  };

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

      {/* Tombol Tambah */}
      <div className="mb-3">
        <button className="btn btn-success" onClick={openAddModal}>
          ➕ Tambah Transaksi
        </button>
      </div>

      {/* Tabel Transaksi */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">📋 Daftar Transaksi</h5>
          <span className="badge bg-light text-dark small">
            {transaksiList.length} transaksi
          </span>
        </div>
        <div className="card-body p-2 p-md-3">
          {transaksiList.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              Belum ada transaksi
            </div>
          ) : (
            <table className="table table-bordered table-hover align-middle mb-0 w-100 small">
              <thead className="table-light text-center">
                <tr>
                  <th>No</th>
                  <th>Program</th>
                  <th>Jenis</th>
                  <th>Nominal</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transaksiList.map((t, index) => (
                  <tr key={t.id_transaksi}>
                    <td className="text-center">{index + 1}</td>
                    <td>{getNamaProgram(t.id_program)}</td>
                    <td className="text-center">
                      <span
                        className={`badge ${t.jenis === "Masuk" ? "bg-success" : "bg-danger"}`}
                      >
                        {t.jenis}
                      </span>
                    </td>
                    <td className="text-end">{formatRupiah(t.nominal)}</td>
                    <td className="text-center">{t.tanggal}</td>
                    <td className="text-center">
                      <span
                        className={`badge ${t.status === "Valid" || t.status === "Selesai" || t.status_validasi === "Valid" ? "bg-success" : "bg-warning text-dark"}`}
                      >
                        {t.status === "Valid" ||
                        t.status === "Selesai" ||
                        t.status_validasi === "Valid"
                          ? "✅ Selesai"
                          : "⏳ Pending"}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-warning btn-sm me-1"
                        onClick={() => openEditModal(t)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(t.id_transaksi)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title h6">
                  {editingId ? "✏️ Edit Transaksi" : "➕ Tambah Transaksi"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
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
                        <span className="badge bg-success ms-1">💰 Masuk</span>
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
                        <span className="badge bg-danger ms-1">📤 Keluar</span>
                      </label>
                    </div>
                  </div>

                  {/* Program Kerja */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Program Kerja <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-sm"
                      name="id_program"
                      value={formData.id_program}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Pilih Program --</option>
                      {programList.map((prog) => (
                        <option key={prog.id_program} value={prog.id_program}>
                          {prog.nama_program} ({prog.periode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Daftar RAB (hanya untuk Pengeluaran) */}
                  {formData.jenis === "Keluar" && rabList.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">
                        📋 Daftar Biaya RAB
                      </label>
                      <div className="card bg-light">
                        <div
                          className="card-body p-2"
                          style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                          <table className="table table-sm table-bordered mb-0 small">
                            <thead className="table-light text-center">
                              <tr>
                                <th>Pilih</th>
                                <th>Item Biaya</th>
                                <th>Harga Claim</th>
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
                      required
                      placeholder="Masukkan nominal"
                    />
                  </div>

                  {/* Tanggal */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Tanggal <span className="text-danger">*</span>
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
                    <small className="text-muted">
                      Maksimal hari ini (
                      {new Date().toLocaleDateString("id-ID")})
                    </small>
                  </div>

                  {/* Status Bukti (hanya Pengeluaran) */}
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

                  {/* Upload Bukti (jika Ada Bukti) */}
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
                        <small className="text-muted">
                          Max 500KB. File akan otomatis dikompres jika melebihi.
                        </small>
                        <div className="mt-2">
                          <span className="badge bg-success">
                            ✅ Status: Selesai (Otomatis)
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Konfirmasi Ketua (jika Tidak Ada Bukti) */}
                  {formData.jenis === "Keluar" &&
                    formData.status_bukti === "tidak_ada" && (
                      <div className="mb-3 p-3 bg-warning-light rounded border border-warning">
                        <small>
                          ⚠️ Transaksi ini akan memerlukan{" "}
                          <strong>konfirmasi Ketua</strong>.
                        </small>
                        <div className="mt-2">
                          <span className="badge bg-warning text-dark">
                            ⏳ Status: Pending
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Status (Pemasukan - readonly) */}
                  {formData.jenis === "Masuk" && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <span className="badge bg-success">
                        ✅ Status: Selesai (Otomatis untuk Pemasukan)
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
                      rows="2"
                      value={formData.keterangan}
                      onChange={handleChange}
                      placeholder="Keterangan tambahan"
                    />
                  </div>
                </div>
                <div className="modal-footer py-2">
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
                    {saving ? "Menyimpan..." : "💾 Simpan"}
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
