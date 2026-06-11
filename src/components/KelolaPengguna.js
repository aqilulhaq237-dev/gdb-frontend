import React, { useState, useEffect } from "react";
import API from "../services/api";

function KelolaPengguna({ user, onLogout, onNavigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    username: "",
    nama_lengkap: "",
    email: "",
    password: "",
    role: "",
    no_hp: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get("/users");
      if (response.data.status === "success") {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat users:", err);
      setError("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Username: hanya huruf kecil, angka, underscore
    if (!formData.username.trim()) {
      errors.username = "Username wajib diisi!";
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      errors.username = "Username hanya boleh huruf kecil, angka, dan underscore!";
    }

    // Nama Lengkap
    if (!formData.nama_lengkap.trim()) {
      errors.nama_lengkap = "Nama lengkap wajib diisi!";
    }

    // Email
    if (!formData.email.trim()) {
      errors.email = "Email wajib diisi!";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format email tidak valid! Contoh: nama@domain.com";
    }

    // Password (hanya untuk tambah baru)
    if (!editingId) {
      if (!formData.password) {
        errors.password = "Password wajib diisi!";
      } else if (formData.password.length < 6) {
        errors.password = "Password minimal 6 karakter!";
      }
    }

    // Role
    if (!formData.role) {
      errors.role = "Pilih role pengguna!";
    }

    // No HP (opsional)
    if (formData.no_hp && !/^[0-9]{10,13}$/.test(formData.no_hp)) {
      errors.no_hp = "No HP hanya angka, 10-13 digit! Contoh: 08123456789";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "username") {
      // Auto lowercase, hanya izinkan a-z, 0-9, _
      const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
      setFormData({ ...formData, username: cleaned });
    } else if (name === "no_hp") {
      // Hanya angka
      const cleaned = value.replace(/\D/g, "").slice(0, 13);
      setFormData({ ...formData, no_hp: cleaned });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Hapus error field saat user mengetik
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

      const payload = {
        username: formData.username,
        nama_lengkap: formData.nama_lengkap,
        email: formData.email,
        role: formData.role,
        no_hp: formData.no_hp || null,
      };

      if (!editingId) {
        payload.password = formData.password;
      }

      if (editingId) {
        if (formData.password) {
          payload.password = formData.password;
        }
        await API.put(`/users/${editingId}`, payload);
        setSuccessMessage("✅ Pengguna berhasil diupdate!");
      } else {
        await API.post("/users", payload);
        setSuccessMessage("✅ Pengguna berhasil ditambahkan!");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      closeModal();
      fetchUsers();
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      setError(err.response?.data?.message || "❌ Gagal menyimpan pengguna.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (u) => {
    setEditingId(u.id_user);
    setFormData({
      username: u.username || "",
      nama_lengkap: u.nama_lengkap || "",
      email: u.email || "",
      password: "",
      role: u.role || "",
      no_hp: u.no_hp || "",
    });
    setFormErrors({});
    setShowPassword(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus pengguna ini?")) return;
    try {
      await API.delete(`/users/${id}`);
      setSuccessMessage("✅ Pengguna berhasil dihapus!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (err) {
      setError("❌ Gagal menghapus pengguna.");
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm("Reset password ke 'password123'?")) return;
    try {
      await API.post(`/users/${id}/reset-password`);
      setSuccessMessage("✅ Password direset ke password123");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("❌ Gagal reset password.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      username: "",
      nama_lengkap: "",
      email: "",
      password: "",
      role: "",
      no_hp: "",
    });
    setFormErrors({});
    setShowPassword(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">👥 Kelola Pengguna</h1>
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
        <button className="btn btn-success" onClick={() => { setEditingId(null); closeModal(); setShowModal(true); }}>
          ➕ Tambah Pengguna
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">📋 Daftar Pengguna</h5>
          <span className="badge bg-light text-dark small">{users.length} pengguna</span>
        </div>
        <div className="card-body p-2 p-md-3">
          {users.length === 0 ? (
            <div className="text-center py-4 text-muted">Belum ada pengguna</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0 small">
                <thead className="table-light text-center">
                  <tr>
                    <th>No</th>
                    <th>Username</th>
                    <th>Nama Lengkap</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>No HP</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr key={u.id_user}>
                      <td className="text-center">{index + 1}</td>
                      <td><strong>{u.username}</strong></td>
                      <td>{u.nama_lengkap}</td>
                      <td>{u.email}</td>
                      <td><span className="badge bg-info">{u.role}</span></td>
                      <td className="text-center">{u.no_hp || "-"}</td>
                      <td className="text-center">
                        <button className="btn btn-warning btn-sm me-1" onClick={() => handleEdit(u)}>✏️</button>
                        <button className="btn btn-danger btn-sm me-1" onClick={() => handleDelete(u.id_user)}>🗑️</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleResetPassword(u.id_user)} title="Reset Password">🔑</button>
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
                <h5 className="modal-title h6">{editingId ? "✏️ Edit Pengguna" : "➕ Tambah Pengguna Baru"}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

                  {/* Username */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Username <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${formErrors.username ? "border-danger" : ""}`}
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      placeholder="Masukkan username"
                      maxLength="20"
                      autoComplete="off"
                    />
                    {formErrors.username ? (
                      <small className="text-danger">❌ {formErrors.username}</small>
                    ) : (
                      <small className="text-muted">✍️ Huruf kecil, angka, underscore. Contoh: budi_123</small>
                    )}
                  </div>

                  {/* Nama Lengkap */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Nama Lengkap <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${formErrors.nama_lengkap ? "border-danger" : ""}`}
                      name="nama_lengkap"
                      value={formData.nama_lengkap}
                      onChange={handleInputChange}
                      required
                      placeholder="Masukkan nama lengkap"
                    />
                    {formErrors.nama_lengkap ? (
                      <small className="text-danger">❌ {formErrors.nama_lengkap}</small>
                    ) : (
                      <small className="text-muted">✍️ Nama lengkap sesuai identitas</small>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className={`form-control form-control-sm ${formErrors.email ? "border-danger" : ""}`}
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="contoh@email.com"
                    />
                    {formErrors.email ? (
                      <small className="text-danger">❌ {formErrors.email}</small>
                    ) : (
                      <small className="text-muted">✍️ Format email valid. Contoh: nama@domain.com</small>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Password {!editingId && <span className="text-danger">*</span>}
                      {editingId && <span className="text-muted">(Kosongkan jika tidak diubah)</span>}
                    </label>
                    <div className="input-group input-group-sm">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`form-control ${formErrors.password ? "border-danger" : ""}`}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={editingId ? "Isi jika ingin mengubah" : "Masukkan password"}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {formErrors.password ? (
                      <small className="text-danger">❌ {formErrors.password}</small>
                    ) : (
                      <small className="text-muted">✍️ Minimal 6 karakter</small>
                    )}
                  </div>

                  {/* Role */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Role <span className="text-danger">*</span></label>
                    <select
                      className={`form-select form-select-sm ${formErrors.role ? "border-danger" : ""}`}
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">-- Pilih Role --</option>
                      <option value="Admin">Admin</option>
                      <option value="Ketua">Ketua</option>
                      <option value="Bendahara">Bendahara</option>
                      <option value="Anggota Umum">Anggota Umum</option>
                    </select>
                    {formErrors.role ? (
                      <small className="text-danger">❌ {formErrors.role}</small>
                    ) : (
                      <small className="text-muted">✍️ Pilih role pengguna</small>
                    )}
                  </div>

                  {/* No HP */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">No HP <span className="text-muted">(Opsional)</span></label>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${formErrors.no_hp ? "border-danger" : ""}`}
                      name="no_hp"
                      value={formData.no_hp}
                      onChange={handleInputChange}
                      placeholder="08123456789"
                      maxLength="13"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    {formErrors.no_hp ? (
                      <small className="text-danger">❌ {formErrors.no_hp}</small>
                    ) : (
                      <small className="text-muted">✍️ Hanya angka, 10-13 digit. Contoh: 08123456789</small>
                    )}
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>❌ Batal</button>
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

export default KelolaPengguna;