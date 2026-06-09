import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function KelolaPeriodeAktif({ user, onLogout, onNavigate }) {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama_periode: "",
    tahun: "",
    status_periode: "Nonaktif",
  });

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await API.get("/periode-aktif", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        // Fetch full list
        const allPeriode = await API.get("/periode/tahun-list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (allPeriode.data.status === "success") {
          const tahunList = allPeriode.data.data;
          const periodeData = tahunList.map((tahun) => ({
            id_periode: tahun,
            nama_periode: `Periode ${tahun}`,
            tahun: tahun,
            status_periode: response.data.data.tahun_sekarang && tahun === new Date().getFullYear().toString() ? "Aktif" : "Nonaktif",
          }));
          setPeriods(periodeData);
        }
      }
    } catch (err) {
      console.error("Error fetching periods:", err);
      setError("Gagal memuat data periode.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "tahun") {
      // HANYA ANGKA, maksimal 4 digit
      const cleaned = value.replace(/\D/g, "").slice(0, 4);
      setFormData({ ...formData, tahun: cleaned });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_periode.trim()) {
      setError("⚠️ Nama periode wajib diisi!");
      return;
    }

    if (!formData.tahun || formData.tahun.length !== 4) {
      setError("⚠️ Tahun harus 4 digit angka!");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      let response;
      if (editingPeriod) {
        response = await API.put(`/periode/tahun/${editingPeriod.tahun}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await API.post("/periode/tahun", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (response.data.status === "success") {
        setSuccessMessage(editingPeriod ? "✅ Periode berhasil diupdate!" : "✅ Periode berhasil ditambahkan!");
        setTimeout(() => setSuccessMessage(""), 3000);
        closeModal();
        fetchPeriods();
      }
    } catch (err) {
      console.error("Error saving period:", err);
      setError("❌ Gagal menyimpan periode.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tahun) => {
    if (!window.confirm("Hapus periode ini?")) return;

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/periode/tahun/${tahun}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage("✅ Periode berhasil dihapus!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchPeriods();
    } catch (err) {
      setError("❌ Gagal menghapus periode.");
    }
  };

  const handleEdit = (period) => {
    setEditingPeriod(period);
    setFormData({
      nama_periode: period.nama_periode || "",
      tahun: period.tahun || "",
      status_periode: period.status_periode || "Nonaktif",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPeriod(null);
    setFormData({
      nama_periode: "",
      tahun: "",
      status_periode: "Nonaktif",
    });
    setError("");
  };

  const getStatusBadge = (status) => {
    return status === "Aktif"
      ? "bg-success"
      : "bg-secondary";
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data periode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">📅 Kelola Periode Aktif</h1>
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

      <div className="mb-3">
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          ➕ Tambah Periode
        </button>
      </div>

      <div className="row g-3">
        {periods.length === 0 ? (
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body text-center py-4 text-muted">
                Belum ada periode
              </div>
            </div>
          </div>
        ) : (
          periods.map((period, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">{period.nama_periode}</h6>
                    <span className={`badge ${getStatusBadge(period.status_periode)}`}>
                      {period.status_periode}
                    </span>
                  </div>
                  <p className="card-text small text-muted mb-3">
                    Tahun: <strong>{period.tahun}</strong>
                  </p>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-warning btn-sm flex-1"
                      onClick={() => handleEdit(period)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm flex-1"
                      onClick={() => handleDelete(period.tahun)}
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title h6">
                  {editingPeriod ? "✏️ Edit Periode" : "➕ Tambah Periode"}
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
                      Nama Periode <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="nama_periode"
                      value={formData.nama_periode}
                      onChange={handleInputChange}
                      required
                      placeholder="Contoh: Periode 2026/2027"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Tahun <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="tahun"
                      value={formData.tahun}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
                        if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      required
                      placeholder="Masukkan 4 digit tahun"
                      maxLength="4"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    <small className="text-muted">
                      ✍️ Masukkan 4 digit tahun, contoh: 2026
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Status</label>
                    <select
                      className="form-select form-select-sm"
                      name="status_periode"
                      value={formData.status_periode}
                      onChange={handleInputChange}
                    >
                      <option value="Aktif">🟢 Aktif</option>
                      <option value="Nonaktif">⚪ Nonaktif</option>
                    </select>
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

export default KelolaPeriodeAktif;