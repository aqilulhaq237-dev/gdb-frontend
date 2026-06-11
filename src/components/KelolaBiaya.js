import React, { useState, useEffect } from "react";
import API from "../services/api";

function KelolaBiaya({ user, onLogout, onNavigate }) {
  const [biayaList, setBiayaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    nama_biaya: "",
    biaya_minimal: 0,
    biaya_maksimal: 0,
    deskripsi_biaya: "",
  });
  const [displayBiayaMin, setDisplayBiayaMin] = useState("");
  const [displayBiayaMax, setDisplayBiayaMax] = useState("");

  useEffect(() => {
    fetchBiaya();
  }, []);

  const fetchBiaya = async () => {
    try {
      setLoading(true);
      const response = await API.get("/katalog-biaya");
      if (response.data.status === "success") {
        setBiayaList(response.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat biaya:", err);
      setError("Gagal memuat data biaya.");
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

  const validateForm = () => {
    const errors = {};

    if (!formData.nama_biaya.trim()) {
      errors.nama_biaya = "Nama biaya wajib diisi!";
    }

    if (!formData.biaya_minimal || formData.biaya_minimal <= 0) {
      errors.biaya_minimal = "Biaya minimal harus diisi dengan angka!";
    }

    if (!formData.biaya_maksimal || formData.biaya_maksimal <= 0) {
      errors.biaya_maksimal = "Biaya maksimal harus diisi dengan angka!";
    }

    if (formData.biaya_minimal > formData.biaya_maksimal) {
      errors.biaya_maksimal = "Biaya maksimal harus lebih besar dari biaya minimal!";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "biaya_minimal") {
      const rawValue = value.replace(/\./g, "").replace(/\D/g, "");
      const numberValue = parseInt(rawValue) || 0;
      const formatted = rawValue === "" ? "" : formatNominal(rawValue);
      setFormData({ ...formData, biaya_minimal: numberValue });
      setDisplayBiayaMin(formatted);
    } else if (name === "biaya_maksimal") {
      const rawValue = value.replace(/\./g, "").replace(/\D/g, "");
      const numberValue = parseInt(rawValue) || 0;
      const formatted = rawValue === "" ? "" : formatNominal(rawValue);
      setFormData({ ...formData, biaya_maksimal: numberValue });
      setDisplayBiayaMax(formatted);
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("⚠️ Periksa kembali input yang berwarna merah!");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      if (editingId) {
        await API.put(`/katalog-biaya/${editingId}`, formData);
        setSuccessMessage("✅ Biaya berhasil diupdate!");
      } else {
        await API.post("/katalog-biaya", formData);
        setSuccessMessage("✅ Biaya berhasil ditambahkan!");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      closeModal();
      fetchBiaya();
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      setError("❌ Gagal menyimpan biaya.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (biaya) => {
    setEditingId(biaya.id_biaya);
    setFormData({
      nama_biaya: biaya.nama_biaya || "",
      biaya_minimal: biaya.biaya_minimal || 0,
      biaya_maksimal: biaya.biaya_maksimal || 0,
      deskripsi_biaya: biaya.deskripsi_biaya || "",
    });
    setDisplayBiayaMin(formatNominal(biaya.biaya_minimal));
    setDisplayBiayaMax(formatNominal(biaya.biaya_maksimal));
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus biaya ini?")) return;
    try {
      await API.delete(`/katalog-biaya/${id}`);
      setSuccessMessage("✅ Biaya berhasil dihapus!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchBiaya();
    } catch (err) {
      setError("❌ Gagal menghapus biaya.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nama_biaya: "",
      biaya_minimal: 0,
      biaya_maksimal: 0,
      deskripsi_biaya: "",
    });
    setDisplayBiayaMin("");
    setDisplayBiayaMax("");
    setFormErrors({});
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data biaya...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">💰 Kelola Daftar Biaya</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate("dashboard")}>📊 Dashboard</button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {successMessage && <div className="alert alert-success py-2 mb-3">{successMessage}</div>}
      {error && <div className="alert alert-danger py-2 mb-3 d-flex align-items-center justify-content-between"><span>{error}</span><button className="btn-close" onClick={() => setError("")}></button></div>}

      <div className="mb-3">
        <button className="btn btn-success" onClick={() => setShowModal(true)}>➕ Tambah Biaya</button>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">📋 Daftar Biaya</h5>
          <span className="badge bg-light text-dark small">{biayaList.length} biaya</span>
        </div>
        <div className="card-body p-2 p-md-3">
          {biayaList.length === 0 ? (
            <div className="text-center py-4 text-muted">Belum ada biaya</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0 small">
                <thead className="table-light text-center">
                  <tr>
                    <th>No</th>
                    <th>Nama Biaya</th>
                    <th>Biaya Minimal</th>
                    <th>Biaya Maksimal</th>
                    <th>Deskripsi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {biayaList.map((b, index) => (
                    <tr key={b.id_biaya}>
                      <td className="text-center">{index + 1}</td>
                      <td><strong>{b.nama_biaya}</strong></td>
                      <td className="text-end">{formatRupiah(b.biaya_minimal)}</td>
                      <td className="text-end">{formatRupiah(b.biaya_maksimal)}</td>
                      <td>{b.deskripsi_biaya || "-"}</td>
                      <td className="text-center">
                        <button className="btn btn-warning btn-sm me-1" onClick={() => handleEdit(b)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id_biaya)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title h6">{editingId ? "✏️ Edit Biaya" : "➕ Tambah Biaya"}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Nama Biaya <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control form-control-sm ${formErrors.nama_biaya ? "border-danger" : ""}`} name="nama_biaya" value={formData.nama_biaya} onChange={handleInputChange} required placeholder="Masukkan nama biaya" />
                    {formErrors.nama_biaya ? <small className="text-danger">❌ {formErrors.nama_biaya}</small> : <small className="text-muted">✍️ Nama item biaya</small>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Biaya Minimal (Rp) <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control form-control-sm ${formErrors.biaya_minimal ? "border-danger" : ""}`} name="biaya_minimal" value={displayBiayaMin} onChange={handleInputChange} onKeyDown={(e) => { const allowedKeys = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End","0","1","2","3","4","5","6","7","8","9"]; if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); }} required placeholder="Masukkan biaya minimal" inputMode="numeric" autoComplete="off" />
                    {formErrors.biaya_minimal ? <small className="text-danger">❌ {formErrors.biaya_minimal}</small> : <small className="text-muted">✍️ Ketik angka, titik muncul otomatis</small>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Biaya Maksimal (Rp) <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control form-control-sm ${formErrors.biaya_maksimal ? "border-danger" : ""}`} name="biaya_maksimal" value={displayBiayaMax} onChange={handleInputChange} onKeyDown={(e) => { const allowedKeys = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End","0","1","2","3","4","5","6","7","8","9"]; if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); }} required placeholder="Masukkan biaya maksimal" inputMode="numeric" autoComplete="off" />
                    {formErrors.biaya_maksimal ? <small className="text-danger">❌ {formErrors.biaya_maksimal}</small> : <small className="text-muted">✍️ Ketik angka, titik muncul otomatis</small>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Deskripsi</label>
                    <textarea className="form-control form-control-sm" name="deskripsi_biaya" rows="2" value={formData.deskripsi_biaya} onChange={handleInputChange} placeholder="Deskripsi biaya (opsional)"></textarea>
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>❌ Batal</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? "⏳ Menyimpan..." : "💾 Simpan"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KelolaBiaya;