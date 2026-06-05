import React, { useState } from "react";
import API from "../services/api";

function Profil({ user, onLogout, onNavigate, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    no_hp: user.no_hp || "",
  });
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [message, setMessage] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi ukuran file (max 1MB)
      if (file.size > 1 * 1024 * 1024) {
        setMessage("❌ Ukuran foto maksimal 1MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await API.put("/user/profile", {
        user_id: user.id_user,
        nama_lengkap: formData.nama_lengkap,
        email: formData.email,
        no_hp: formData.no_hp,
      });

      if (response.data.status === "success") {
        // Update user melalui props dari App.js
        const updatedUser = {
          ...user,
          nama_lengkap: formData.nama_lengkap,
          email: formData.email,
          no_hp: formData.no_hp,
        };
        onProfileUpdate(updatedUser); // ← panggil fungsi dari parent

        setMessage("✅ Profil berhasil diupdate");
        setTimeout(() => setMessage(""), 3000);
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Gagal mengupdate profil");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage("❌ Password baru dan konfirmasi tidak cocok");
      return;
    }
    if (passwordData.new_password.length < 6) {
      setMessage("❌ Password baru minimal 6 karakter");
      return;
    }
    setIsLoading(true);
    try {
      const response = await API.post("/user/change-password", {
        user_id: user.id_user, // ← Pastikan ini ada
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      if (response.data.status === "success") {
        setMessage("✅ Password berhasil diubah");
        setPasswordData({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(response.data.message || "❌ Gagal mengubah password");
      }
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.message || "❌ Gagal mengubah password";
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) return;

    setIsLoading(true);
    const formDataFile = new FormData();
    formDataFile.append("foto", photoFile);

    try {
      const response = await API.post("/user/upload-photo", formDataFile, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.status === "success") {
        setMessage("✅ Foto profil berhasil diupdate");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("❌ Gagal mengupload foto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary">Profil Saya</h1>
        <div className="d-flex align-items-center gap-2">
          <span className="me-2">
            Halo, <strong>{user.nama_lengkap}</strong>
          </span>
          <span className="badge bg-secondary me-2">{user.role}</span>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => onNavigate("dashboard")}
          >
            Dashboard
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`alert ${message.includes("✅") ? "alert-success" : "alert-danger"} mb-3`}
        >
          {message}
        </div>
      )}

      <div className="row">
        {/* Kolom Kiri: Foto Profil */}
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Foto Profil</h5>
            </div>
            <div className="card-body text-center">
              <div className="mb-3">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="rounded-circle border"
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto"
                    style={{ width: "150px", height: "150px" }}
                  >
                    <span className="text-white" style={{ fontSize: "48px" }}>
                      👤
                    </span>
                  </div>
                )}
              </div>
              <form onSubmit={updatePhoto}>
                <input
                  type="file"
                  className="form-control mb-2"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm w-100"
                  disabled={!photoFile || isLoading}
                >
                  {isLoading ? "Mengupload..." : "Upload Foto"}
                </button>
              </form>
              <small className="text-muted">Format: JPG, PNG. Max 1MB</small>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Data Diri */}
        <div className="col-md-8 mb-4">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Data Diri</h5>
              <button
                className="btn btn-light btn-sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Batal" : "Edit"}
              </button>
            </div>
            <div className="card-body">
              {isEditing ? (
                <form onSubmit={updateProfile}>
                  <div className="mb-3">
                    <label className="form-label">Nama Lengkap</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nama_lengkap"
                      value={formData.nama_lengkap}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">No. Handphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="no_hp"
                      value={formData.no_hp}
                      onChange={handleProfileChange}
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </form>
              ) : (
                <>
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <th style={{ width: "150px" }}>Nama Lengkap</th>
                        <td>{user.nama_lengkap}</td>
                      </tr>
                      <tr>
                        <th>Username</th>
                        <td>{user.username}</td>
                      </tr>
                      <tr>
                        <th>Email</th>
                        <td>{user.email}</td>
                      </tr>
                      <tr>
                        <th>No. Handphone</th>
                        <td>{user.no_hp || "-"}</td>
                      </tr>
                      <tr>
                        <th>Role</th>
                        <td>
                          <span className="badge bg-secondary">
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>

          {/* Ganti Password */}
          <div className="card mt-4">
            <div className="card-header bg-warning text-white">
              <h5 className="mb-0">Ganti Password</h5>
            </div>
            <div className="card-body">
              <form onSubmit={updatePassword}>
                <div className="mb-3">
                  <label className="form-label">Password Lama</label>
                  <input
                    type="password"
                    className="form-control"
                    name="old_password"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Password Baru (min. 6 karakter)
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    className="form-control"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Ganti Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profil;
