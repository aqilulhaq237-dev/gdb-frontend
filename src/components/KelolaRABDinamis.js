import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function KelolaRABDinamis({ user, onLogout, onNavigate }) {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [rabItems, setRabItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama_biaya: "",
    biaya_minimal: "",
    biaya_maksimal: "",
    realisasi: "",
    sisa: "",
  });
  const [displayBiayaMinimal, setDisplayBiayaMinimal] = useState("");
  const [displayBiayaMaksimal, setDisplayBiayaMaksimal] = useState("");
  const [displayRealisasi, setDisplayRealisasi] = useState("");

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchRABItems(selectedProgram);
    }
  }, [selectedProgram]);

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/program-kerja", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setPrograms(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };

  const fetchRABItems = async (programId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await API.get(`/rab-dinamis?id_program=${programId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        const filtered = response.data.data.filter(
          (r) => r.id_program == programId
        );
        setRabItems(filtered);
      }
    } catch (err) {
      console.error("Error fetching RAB:", err);
      setError("Gagal memuat data RAB.");
    } finally {
      setLoading(false);
    }
  };

  const formatNominal = (value) => {
    if (!value && value !== 0) return "";
    const strValue = value.toString().replace(/\D/g, "");
    if (strValue === "") return "";
    return strValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "biaya_minimal" || name === "biaya_maksimal" || name === "realisasi") {
      const rawValue = value.replace(/\./g, "").replace(/\D/g, "");
      const numberValue = parseInt(rawValue) || 0;
      const formatted = rawValue === "" ? "" : rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

      setFormData({ ...formData, [name]: numberValue });

      if (name === "biaya_minimal") setDisplayBiayaMinimal(formatted);
      if (name === "biaya_maksimal") setDisplayBiayaMaksimal(formatted);
      if (name === "realisasi") setDisplayRealisasi(formatted);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_biaya.trim()) {
      setError("⚠️ Nama biaya wajib diisi!");
      return;
    }

    if (!formData.biaya_minimal || formData.biaya_minimal <= 0) {
      setError("⚠️ Biaya minimal harus diisi dengan angka!");
      return;
    }

    if (!formData.biaya_maksimal || formData.biaya_maksimal <= 0) {
      setError("⚠️ Biaya maksimal harus diisi dengan angka!");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const payload = {
        ...formData,
        id_program: selectedProgram,
      };

      let response;
      if (editingItem) {
        response = await API.put(`/rab-dinamis/${editingItem.id_rab}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await API.post("/rab-dinamis", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (response.data.status === "success") {
        setSuccessMessage(editingItem ? "✅ Item RAB berhasil diupdate!" : "✅ Item RAB berhasil ditambahkan!");
        setTimeout(() => setSuccessMessage(""), 3000);
        closeModal();
        fetchRABItems(selectedProgram);
      }
    } catch (err) {
      console.error("Error saving RAB:", err);
      setError("❌ Gagal menyimpan item RAB.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nama_biaya: item.nama_biaya || "",
      biaya_minimal: item.biaya_minimal || "",
      biaya_maksimal: item.biaya_maksimal || "",
      realisasi: item.realisasi || "",
      sisa: item.sisa || "",
    });
    setDisplayBiayaMinimal(formatNominal(item.biaya_minimal));
    setDisplayBiayaMaksimal(formatNominal(item.biaya_maksimal));
    setDisplayRealisasi(formatNominal(item.realisasi));
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus item RAB ini?")) return;

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/rab-dinamis/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage("✅ Item RAB berhasil dihapus!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchRABItems(selectedProgram);
    } catch (err) {
      setError("❌ Gagal menghapus item.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      nama_biaya: "",
      biaya_minimal: "",
      biaya_maksimal: "",
      realisasi: "",
      sisa: "",
    });
    setDisplayBiayaMinimal("");
    setDisplayBiayaMaksimal("");
    setDisplayRealisasi("");
    setError("");
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  const calculateTotal = () => {
    return rabItems.reduce((total, item) => {
      return total + parseFloat(item.biaya_maksimal || 0);
    }, 0);
  };

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">🧮 Kelola RAB Dinamis</h1>
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

      {successMessage && (
        <div className="alert alert-success py-2 mb-3">{successMessage}</div>
      )}

      {error && (
        <div className="alert alert-danger py-2 mb-3 d-flex align-items-center justify-content-between">
          <span>{error}</span>
          <button className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <label className="form-label small fw-bold mb-2">Pilih Program</label>
          <select
            className="form-select form-select-sm"
            value={selectedProgram || ""}
            onChange={(e) => setSelectedProgram(e.target.value)}
          >
            <option value="">-- Pilih Program --</option>
            {programs.map((program) => (
              <option key={program.id_program} value={program.id_program}>
                {program.nama_program} ({program.periode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProgram && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">📋 Daftar Item RAB</h5>
            <button className="btn btn-success btn-sm" onClick={() => setShowModal(true)}>
              ➕ Tambah Item
            </button>
          </div>

          <div className="card shadow-sm">
            <div className="card-body p-2 p-md-3">
              {rabItems.length === 0 ? (
                <div className="text-center py-4 text-muted">Belum ada item RAB</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle mb-0 small">
                    <thead className="table-light text-center">
                      <tr>
                        <th>Nama Biaya</th>
                        <th>Biaya Minimal</th>
                        <th>Biaya Maksimal</th>
                        <th>Realisasi</th>
                        <th>Sisa</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rabItems.map((item) => (
                        <tr key={item.id_rab}>
                          <td className="fw-bold">{item.nama_biaya}</td>
                          <td className="text-end">{formatRupiah(item.biaya_minimal)}</td>
                          <td className="text-end">{formatRupiah(item.biaya_maksimal)}</td>
                          <td className="text-end">{formatRupiah(item.realisasi)}</td>
                          <td className="text-end">{formatRupiah(item.sisa)}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-warning btn-sm me-1"
                              onClick={() => handleEdit(item)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(item.id_rab)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {rabItems.length > 0 && (
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan="3" className="text-end fw-bold">Total Anggaran:</td>
                          <td colSpan="3" className="fw-bold">{formatRupiah(calculateTotal())}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title h6">
                  {editingItem ? "✏️ Edit Item RAB" : "➕ Tambah Item RAB"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger py-2 mb-3">{error}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Nama Biaya <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="nama_biaya"
                      value={formData.nama_biaya}
                      onChange={handleInputChange}
                      required
                      placeholder="Contoh: Konsumsi Peserta"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Biaya Minimal (Rp) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="biaya_minimal"
                      value={displayBiayaMinimal}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
                        if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      required
                      placeholder="Masukkan biaya minimal"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    <small className="text-muted">
                      ✍️ Ketik angka saja, titik pemisah ribuan muncul otomatis
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Biaya Maksimal (Rp) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="biaya_maksimal"
                      value={displayBiayaMaksimal}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
                        if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      required
                      placeholder="Masukkan biaya maksimal"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    <small className="text-muted">
                      ✍️ Ketik angka saja, titik pemisah ribuan muncul otomatis
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Realisasi (Rp)
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="realisasi"
                      value={displayRealisasi}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
                        if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Masukkan realisasi"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    <small className="text-muted">
                      ✍️ Ketik angka saja, titik pemisah ribuan muncul otomatis
                    </small>
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>
                    ❌ Batal
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                    {submitting ? "⏳ Menyimpan..." : "💾 Simpan"}
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

export default KelolaRABDinamis;