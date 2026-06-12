import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { swalSukses, swalError, swalHapus } from '../utils/swal';

function KelolaPengguna({ user, onLogout, onNavigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama_lengkap: '',
    email: '',
    role: 'Anggota Umum',
    no_hp: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await API.get('/users');
      if (response.data.status === 'success') {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat user:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) newErrors.username = 'Username wajib diisi';
    if (!editingUser && !formData.password.trim()) newErrors.password = 'Password wajib diisi';
    if (!formData.nama_lengkap.trim()) newErrors.nama_lengkap = 'Nama lengkap wajib diisi';
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Format email tidak valid';
    if (formData.no_hp && !/^[0-9]{10,13}$/.test(formData.no_hp.replace(/[-\s]/g, ''))) newErrors.no_hp = 'Format no HP tidak valid';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      nama_lengkap: '',
      email: '',
      role: 'Anggota Umum',
      no_hp: ''
    });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      password: '',
      nama_lengkap: u.nama_lengkap,
      email: u.email,
      role: u.role,
      no_hp: u.no_hp || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingUser) {
        await API.put(`/users/${editingUser.id_user}`, formData);
        swalSukses('Berhasil!', 'User berhasil diupdate');
      } else {
        await API.post('/users', formData);
        swalSukses('Berhasil!', 'User berhasil ditambahkan');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      swalError('Gagal!', error.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (id_user) => {
    try {
      await API.post(`/users/${id_user}/reset-password`);
      swalSukses('Berhasil!', 'Password direset menjadi password123');
    } catch (error) {
      swalError('Gagal!', 'Gagal mereset password');
    }
  };

  const handleDelete = async (u) => {
    const result = await swalHapus(`User "${u.nama_lengkap}" akan dinonaktifkan.`);
    if (result.isConfirmed) {
      try {
        await API.delete(`/users/${u.id_user}`);
        swalSukses('Berhasil!', 'User berhasil dinonaktifkan');
        fetchUsers();
      } catch (error) {
        swalError('Gagal!', error.response?.data?.message || 'Gagal menghapus user');
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">👥 Kelola Pengguna</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate('dashboard')}>📊 Dashboard</button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header card-header-purple py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">📋 Daftar Pengguna</h5>
          <button className="btn btn-light btn-sm" onClick={openAddModal}>➕ Tambah User</button>
        </div>
        <div className="card-body p-2 p-md-3">
          {users.length === 0 ? (
            <div className="text-center py-4 text-muted">Belum ada pengguna</div>
          ) : (
            <table className="table table-bordered table-hover align-middle mb-0 small">
              <thead className="table-light text-center">
                <tr>
                  <th>Username</th>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>No. HP</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id_user}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.nama_lengkap}</td>
                    <td>{u.email}</td>
                    <td className="text-center"><span className="badge bg-info">{u.role}</span></td>
                    <td>{u.no_hp || '-'}</td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center flex-wrap">
                        <button className="btn btn-warning btn-sm" onClick={() => openEditModal(u)}>✏️</button>
                        <button className="btn btn-info btn-sm" onClick={() => handleResetPassword(u.id_user)}>🔑</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h5 className="modal-title h6">{editingUser ? '✏️ Edit User' : '➕ Tambah User'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small">Username <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control form-control-sm ${errors.username ? 'border-danger' : ''}`} name="username" value={formData.username} onChange={handleChange} disabled={editingUser} />
                    {errors.username && <small className="text-danger">{errors.username}</small>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Password {!editingUser && <span className="text-danger">*</span>}</label>
                    <input type="password" className={`form-control form-control-sm ${errors.password ? 'border-danger' : ''}`} name="password" value={formData.password} onChange={handleChange} placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah' : ''} />
                    {errors.password && <small className="text-danger">{errors.password}</small>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Nama Lengkap <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control form-control-sm ${errors.nama_lengkap ? 'border-danger' : ''}`} name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} />
                    {errors.nama_lengkap && <small className="text-danger">{errors.nama_lengkap}</small>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Email <span className="text-danger">*</span></label>
                    <input type="email" className={`form-control form-control-sm ${errors.email ? 'border-danger' : ''}`} name="email" value={formData.email} onChange={handleChange} />
                    {errors.email && <small className="text-danger">{errors.email}</small>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Role</label>
                    <select className="form-select form-select-sm" name="role" value={formData.role} onChange={handleChange}>
                      <option value="Admin">Admin</option>
                      <option value="Ketua">Ketua</option>
                      <option value="Bendahara">Bendahara</option>
                      <option value="Anggota Umum">Anggota Umum</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">No. HP</label>
                    <input type="text" className={`form-control form-control-sm ${errors.no_hp ? 'border-danger' : ''}`} name="no_hp" value={formData.no_hp} onChange={handleChange} />
                    {errors.no_hp && <small className="text-danger">{errors.no_hp}</small>}
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>❌ Batal</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? '⏳ Menyimpan...' : '💾 Simpan'}
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