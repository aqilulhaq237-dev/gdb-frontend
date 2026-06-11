import React, { useState, useEffect } from "react";
import API from "../services/api";

function KelolaKategori({ user, onLogout, onNavigate }) {
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama_kategori: "",
    deskripsi_kategori: "",
    status: "Aktif",
  });

  useEffect(() => {
    fetchKategori();
  }, []);

  const fetchKategori = async () => {
    try {
      setLoading(true);
      const response = await API.get("/kategori");
      if (response.data.status === "success") {
        setKategoriList(response.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat kategori:", err);
      setError("Gagal memuat data kategori.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_kategori.trim()) {
      setError("⚠️ Nama kategori wajib diisi!");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      if (editingId) {
        await API.put(`/kategori/${editingId}`, formData);
        setSuccessMessage("✅ Kategori berhasil diupdate!");
      } else {
        await API.post("/kategori", formData);
        setSuccessMessage("✅ Kategori berhasil ditambahkan!");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      closeModal();
      fetchKategori();
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      setError("❌ Gagal menyimpan kategori.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (kategori) => {
    setEditingId(kategori.id_kategori);
    setFormData({
      nama_kategori: kategori.nama_kategori || "",
      deskripsi_kategori: kategori.deskripsi_kategori || "",
      status: kategori.status || "Aktif",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus kategori ini?")) return;

    try {
      await API.delete(`/kategori/${id}`);
      setSuccessMessage("✅ Kategori berhasil dihapus!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchKategori();
    } catch (err) {
      setError("❌ Gagal menghapus kategori.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nama_kategori: "",
      deskripsi_kategori: "",
      status: "Aktif",
    });
    setError("");
  };

  const getStatusBadge = (status) => {
    return status === "Aktif" ? "bg-success" : "bg-secondary";
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data kategori...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">📂 Kelola Kategori Program</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">
            Halo, <strong>{user.nama_lengkap}</strong>
          </span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
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
          ➕ Tambah Kategori
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">📋 Daftar Kategori Program</h5>
          <span className="badge bg-light text-dark small">{kategoriList.length} kategori</span>
        </div>
        <div className="card-body p-2 p-md-3">
          {kategoriList.length === 0 ? (
            <div className="text-center py-4 text-muted">Belum ada kategori</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0 small">
                <thead className="table-light text-center">
                  <tr>
                    <th>No</th>
                    <th>Nama Kategori</th>
                    <th>Deskripsi</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kategoriList.map((k, index) => (
                    <tr key={k.id_kategori}>
                      <td className="text-center">{index + 1}</td>
                      <td><strong>{k.nama_kategori}</strong></td>
                      <td>{k.deskripsi_kategori || "-"}</td>
                      <td className="text-center">
                        <span className={`badge ${getStatusBadge(k.status)}`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="btn btn-warning btn-sm me-1" onClick={() => handleEdit(k)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(k.id_kategori)}>🗑️</button>
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
                <h5 className="modal-title h6">
                  {editingId ? "✏️ Edit Kategori" : "➕ Tambah Kategori"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Nama Kategori <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="nama_kategori"
                      value={formData.nama_kategori}
                      onChange={handleInputChange}
                      required
                      placeholder="Contoh: Workshop, Bootcamp, Seminar"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Deskripsi</label>
                    <textarea
                      className="form-control form-control-sm"
                      name="deskripsi_kategori"
                      rows="3"
                      value={formData.deskripsi_kategori}
                      onChange={handleInputChange}
                      placeholder="Deskripsi kategori (opsional)"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Status</label>
                    <select
                      className="form-select form-select-sm"
                      name="status"
                      value={formData.status}
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

export default KelolaKategori;