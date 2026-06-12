import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { swalSukses, swalError } from '../utils/swal';

function Profil({ user, onLogout, onNavigate, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    email: '',
    no_hp: '',
    password: '',
    password_baru: '',
    konfirmasi_password: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [foto, setFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState('');

  useEffect(() => {
    setFormData({
      nama_lengkap: user.nama_lengkap || '',
      username: user.username || '',
      email: user.email || '',
      no_hp: user.no_hp || '',
      password: '',
      password_baru: '',
      konfirmasi_password: '',
    });
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nama_lengkap.trim()) newErrors.nama_lengkap = 'Nama lengkap wajib diisi';
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Format email tidak valid';
    if (formData.no_hp && !/^[0-9]{10,13}$/.test(formData.no_hp.replace(/[-\s]/g, ''))) newErrors.no_hp = 'Format no HP tidak valid (10-13 digit)';
    
    if (formData.password_baru) {
      if (!formData.password) newErrors.password = 'Password lama wajib diisi untuk mengubah password';
      if (formData.password_baru.length < 6) newErrors.password_baru = 'Password minimal 6 karakter';
      if (formData.password_baru !== formData.konfirmasi_password) newErrors.konfirmasi_password = 'Konfirmasi password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const dataToSend = {
        nama_lengkap: formData.nama_lengkap,
        email: formData.email,
        no_hp: formData.no_hp,
      };

      if (formData.password_baru) {
        dataToSend.password = formData.password_baru;
      }

      await API.put(`/users/${user.id_user}`, dataToSend);

      // Upload foto jika ada
      if (foto) {
        const fotoForm = new FormData();
        fotoForm.append('photo', foto);
        await API.post(`/users/${user.id_user}/upload-photo`, fotoForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const updatedUser = {
        ...user,
        nama_lengkap: formData.nama_lengkap,
        email: formData.email,
        no_hp: formData.no_hp,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (onProfileUpdate) onProfileUpdate(updatedUser);

      swalSukses('Berhasil!', 'Profil berhasil diupdate!');
    } catch (error) {
      swalError('Gagal!', error.response?.data?.message || 'Gagal mengupdate profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">👤 Profil Saya</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate('dashboard')}>📊 Dashboard</button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header card-header-purple py-2">
          <h5 className="mb-0 h6">✏️ Edit Profil</h5>
        </div>
        <div className="card-body py-3">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-3 text-center mb-3">
                <div className="mb-2">
                  {previewFoto ? (
                    <img src={previewFoto} alt="Preview" className="rounded-circle" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                  ) : (
                    <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px', fontSize: '3rem' }}>
                      🧑
                    </div>
                  )}
                </div>
                <input type="file" className="form-control form-control-sm" accept="image/*" onChange={handleFotoChange} />
                <small className="text-muted">Max 500KB</small>
              </div>
              <div className="col-md-9">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Nama Lengkap <span className="text-danger">*</span></label>
                  <input type="text" className={`form-control form-control-sm ${errors.nama_lengkap ? 'border-danger' : ''}`} name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} />
                  {errors.nama_lengkap && <small className="text-danger">{errors.nama_lengkap}</small>}
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Username</label>
                  <input type="text" className="form-control form-control-sm bg-light" value={formData.username} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Email <span className="text-danger">*</span></label>
                  <input type="email" className={`form-control form-control-sm ${errors.email ? 'border-danger' : ''}`} name="email" value={formData.email} onChange={handleChange} />
                  {errors.email && <small className="text-danger">{errors.email}</small>}
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">No. HP</label>
                  <input type="text" className={`form-control form-control-sm ${errors.no_hp ? 'border-danger' : ''}`} name="no_hp" value={formData.no_hp} onChange={handleChange} />
                  {errors.no_hp && <small className="text-danger">{errors.no_hp}</small>}
                </div>
              </div>
            </div>

            <hr />
            <h6 className="mb-3">🔒 Ubah Password (Opsional)</h6>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label small fw-bold">Password Lama</label>
                <input type="password" className={`form-control form-control-sm ${errors.password ? 'border-danger' : ''}`} name="password" value={formData.password} onChange={handleChange} />
                {errors.password && <small className="text-danger">{errors.password}</small>}
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label small fw-bold">Password Baru</label>
                <input type="password" className={`form-control form-control-sm ${errors.password_baru ? 'border-danger' : ''}`} name="password_baru" value={formData.password_baru} onChange={handleChange} />
                {errors.password_baru && <small className="text-danger">{errors.password_baru}</small>}
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label small fw-bold">Konfirmasi Password</label>
                <input type="password" className={`form-control form-control-sm ${errors.konfirmasi_password ? 'border-danger' : ''}`} name="konfirmasi_password" value={formData.konfirmasi_password} onChange={handleChange} />
                {errors.konfirmasi_password && <small className="text-danger">{errors.konfirmasi_password}</small>}
              </div>
            </div>

            <div className="text-end">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profil;