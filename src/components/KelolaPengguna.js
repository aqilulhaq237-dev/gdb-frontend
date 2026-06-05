import React, { useEffect, useState } from 'react';
import API from '../services/api';

function KelolaPengguna({ user, onLogout, onNavigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    nama_lengkap: '',
    email: '',
    password: '',
    role: 'Anggota Umum'
  });
  const [message, setMessage] = useState('');

  // Ambil daftar pengguna
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await API.get('/users');
      if (response.data.status === 'success') {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data pengguna:', error);
      setMessage('❌ Gagal mengambil数据 pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      username: '',
      nama_lengkap: '',
      email: '',
      password: '',
      role: 'Anggota Umum'
    });
    setMessage('');
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (userData) => {
    setEditingId(userData.id_user);
    setFormData({
      username: userData.username,
      nama_lengkap: userData.nama_lengkap,
      email: userData.email,
      password: '',
      role: userData.role
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const updateData = {
          nama_lengkap: formData.nama_lengkap,
          email: formData.email,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        const response = await API.put(`/users/${editingId}`, updateData);
        if (response.data.status === 'success') {
          setMessage('✅ Pengguna berhasil diupdate');
          fetchUsers();
          setShowModal(false);
          resetForm();
        }
      } else {
        const response = await API.post('/users', {
          username: formData.username,
          nama_lengkap: formData.nama_lengkap,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
        if (response.data.status === 'success') {
          setMessage('✅ Pengguna berhasil ditambahkan');
          fetchUsers();
          setShowModal(false);
          resetForm();
        }
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || '❌ Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus pengguna ini?')) {
      try {
        const response = await API.delete(`/users/${id}`);
        if (response.data.status === 'success') {
          setMessage('✅ Pengguna berhasil dihapus');
          fetchUsers();
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        console.error(error);
        setMessage('❌ Gagal menghapus pengguna');
      }
    }
  };

  const handleResetPassword = async (id) => {
    if (window.confirm('Reset password pengguna ini menjadi "password123"?')) {
      try {
        const response = await API.post(`/users/${id}/reset-password`);
        if (response.data.status === 'success') {
          setMessage('✅ Password berhasil direset menjadi "password123"');
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        console.error(error);
        setMessage('❌ Gagal mereset password');
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin': return 'bg-danger';
      case 'Ketua': return 'bg-primary';
      case 'Bendahara': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" />
        <p>Memuat data pengguna...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary">Kelola Pengguna</h1>
        <div className="d-flex align-items-center gap-2">
          <span className="me-2">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary me-2">{user.role}</span>
          <button className="btn btn-outline-secondary me-2" onClick={() => onNavigate('dashboard')}>
            Dashboard
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} mb-3`}>
          {message}
        </div>
      )}

      <div className="mb-3">
        <button className="btn btn-success" onClick={openAddModal}>
          + Tambah Pengguna
        </button>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">📋 Daftar Pengguna</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>No</th>
                  <th>Username</th>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id_user}>
                    <td className="text-center">{index + 1}</td>
                    <td>{u.username}</td>
                    <td>{u.nama_lengkap}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-warning" onClick={() => openEditModal(u)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-sm btn-info" onClick={() => handleResetPassword(u.id_user)}>
                          🔄 Reset Password
                        </button>
                        {u.username !== 'admin' && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id_user)}>
                            🗑️ Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form Tambah/Edit */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{editingId ? 'Edit Pengguna' : 'Tambah Pengguna'}</h5>
                <button type="button" className="btn-close text-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!!editingId}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nama Lengkap *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nama_lengkap"
                      value={formData.nama_lengkap}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {!editingId && (
                    <div className="mb-3">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <small className="text-muted">Minimal 6 karakter</small>
                    </div>
                  )}
                  {editingId && (
                    <div className="mb-3">
                      <label className="form-label">Password Baru (kosongkan jika tidak diubah)</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Kosongkan jika tidak diubah"
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Role *</label>
                    <select className="form-select" name="role" value={formData.role} onChange={handleChange} required>
                      <option value="Admin">Admin</option>
                      <option value="Ketua">Ketua</option>
                      <option value="Bendahara">Bendahara</option>
                      <option value="Anggota Umum">Anggota Umum</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan'}
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