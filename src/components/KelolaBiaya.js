import React, { useEffect, useState } from 'react';
import API from '../services/api';

function KelolaBiaya({ user, onLogout, onNavigate }) {
  const [biayaList, setBiayaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama_biaya: '',
    biaya_minimal: '',
    biaya_maksimal: '',
    deskripsi_biaya: ''
  });
  const [message, setMessage] = useState('');

  // Ambil data katalog biaya
  const fetchBiaya = async () => {
    setLoading(true);
    try {
      const response = await API.get('/katalog-biaya');
      if (response.data.status === 'success') {
        setBiayaList(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiaya();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/katalog-biaya/${editingId}`, formData);
        setMessage('✅ Biaya berhasil diupdate');
      } else {
        await API.post('/katalog-biaya', formData);
        setMessage('✅ Biaya berhasil ditambahkan');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ nama_biaya: '', biaya_minimal: '', biaya_maksimal: '', deskripsi_biaya: '' });
      fetchBiaya();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('❌ Gagal menyimpan data');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus biaya ini?')) {
      try {
        await API.delete(`/katalog-biaya/${id}`);
        setMessage('✅ Biaya berhasil dihapus');
        fetchBiaya();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error(error);
        setMessage('❌ Gagal menghapus biaya');
      }
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ nama_biaya: '', biaya_minimal: '', biaya_maksimal: '', deskripsi_biaya: '' });
    setShowModal(true);
  };

  const openEditModal = (biaya) => {
    setEditingId(biaya.id_biaya);
    setFormData({
      nama_biaya: biaya.nama_biaya,
      biaya_minimal: biaya.biaya_minimal,
      biaya_maksimal: biaya.biaya_maksimal,
      deskripsi_biaya: biaya.deskripsi_biaya || ''
    });
    setShowModal(true);
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka);
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" />
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary">Kelola Daftar Biaya (Katalog)</h1>
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
          + Tambah Biaya
        </button>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">📋 Daftar Biaya</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
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
                {biayaList.map((item, index) => (
                  <tr key={item.id_biaya}>
                    <td>{index + 1}</td>
                    <td>{item.nama_biaya}</td>
                    <td className="text-success">{formatRupiah(item.biaya_minimal)}</td>
                    <td className="text-danger">{formatRupiah(item.biaya_maksimal)}</td>
                    <td>{item.deskripsi_biaya || '-'}</td>
                    <td>
                      <button className="btn btn-sm btn-warning me-2" onClick={() => openEditModal(item)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id_biaya)}>
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{editingId ? 'Edit Biaya' : 'Tambah Biaya'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nama Biaya *</label>
                    <input type="text" className="form-control" name="nama_biaya" value={formData.nama_biaya} onChange={handleChange} required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Biaya Minimal</label>
                      <input type="number" className="form-control" name="biaya_minimal" value={formData.biaya_minimal} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Biaya Maksimal</label>
                      <input type="number" className="form-control" name="biaya_maksimal" value={formData.biaya_maksimal} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Deskripsi</label>
                    <textarea className="form-control" name="deskripsi_biaya" rows="3" value={formData.deskripsi_biaya} onChange={handleChange} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan</button>
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