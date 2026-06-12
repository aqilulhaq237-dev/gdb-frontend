import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { swalSukses, swalError, swalHapus } from '../utils/swal';

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
  const [displayMin, setDisplayMin] = useState('');
  const [displayMax, setDisplayMax] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBiaya();
  }, []);

  const fetchBiaya = async () => {
    setLoading(true);
    try {
      const response = await API.get('/katalog-biaya');
      if (response.data.status === 'success') {
        setBiayaList(response.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat biaya:', error);
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

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nama_biaya.trim()) newErrors.nama_biaya = 'Nama biaya wajib diisi';
    if (!formData.biaya_minimal || formData.biaya_minimal <= 0) newErrors.biaya_minimal = 'Biaya minimal wajib diisi';
    if (!formData.biaya_maksimal || formData.biaya_maksimal <= 0) newErrors.biaya_maksimal = 'Biaya maksimal wajib diisi';
    if (parseFloat(formData.biaya_minimal) > parseFloat(formData.biaya_maksimal)) {
      newErrors.biaya_maksimal = 'Biaya maksimal harus lebih besar dari minimal';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'biaya_minimal') {
      const raw = value.replace(/\./g, "").replace(/\D/g, "");
      const num = parseInt(raw) || 0;
      setFormData({ ...formData, biaya_minimal: num });
      setDisplayMin(raw === "" ? "" : formatNominal(raw));
    } else if (name === 'biaya_maksimal') {
      const raw = value.replace(/\./g, "").replace(/\D/g, "");
      const num = parseInt(raw) || 0;
      setFormData({ ...formData, biaya_maksimal: num });
      setDisplayMax(raw === "" ? "" : formatNominal(raw));
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ nama_biaya: '', biaya_minimal: '', biaya_maksimal: '', deskripsi_biaya: '' });
    setDisplayMin('');
    setDisplayMax('');
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id_biaya);
    setFormData({
      nama_biaya: item.nama_biaya,
      biaya_minimal: item.biaya_minimal,
      biaya_maksimal: item.biaya_maksimal,
      deskripsi_biaya: item.deskripsi_biaya || ''
    });
    setDisplayMin(formatNominal(item.biaya_minimal));
    setDisplayMax(formatNominal(item.biaya_maksimal));
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingId) {
        await API.put(`/katalog-biaya/${editingId}`, formData);
        swalSukses('Berhasil!', 'Biaya berhasil diupdate');
      } else {
        await API.post('/katalog-biaya', formData);
        swalSukses('Berhasil!', 'Biaya berhasil ditambahkan');
      }
      setShowModal(false);
      fetchBiaya();
    } catch (error) {
      swalError('Gagal!', error.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await swalHapus(`Biaya "${item.nama_biaya}" akan dihapus permanen.`);
    if (result.isConfirmed) {
      try {
        await API.delete(`/katalog-biaya/${item.id_biaya}`);
        swalSukses('Berhasil!', 'Biaya berhasil dihapus');
        fetchBiaya();
      } catch (error) {
        swalError('Gagal!', 'Gagal menghapus biaya');
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
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
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate('dashboard')}>📊 Dashboard</button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header card-header-teal py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">📋 Katalog Biaya</h5>
          <button className="btn btn-light btn-sm" onClick={openAddModal}>➕ Tambah Biaya</button>
        </div>
        <div className="card-body p-2 p-md-3">
          {biayaList.length === 0 ? (
            <div className="text-center py-4 text-muted">Belum ada data biaya</div>
          ) : (
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
                {biayaList.map((item, index) => (
                  <tr key={item.id_biaya}>
                    <td className="text-center">{index + 1}</td>
                    <td><strong>{item.nama_biaya}</strong></td>
                    <td className="text-end">{formatRupiah(item.biaya_minimal)}</td>
                    <td className="text-end">{formatRupiah(item.biaya_maksimal)}</td>
                    <td>{item.deskripsi_biaya || '-'}</td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-warning btn-sm" onClick={() => openEditModal(item)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>🗑️</button>
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
                <h5 className="modal-title h6">{editingId ? '✏️ Edit Biaya' : '➕ Tambah Biaya'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small">Nama Biaya <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control form-control-sm ${errors.nama_biaya ? 'border-danger' : ''}`} name="nama_biaya" value={formData.nama_biaya} onChange={handleChange} />
                    {errors.nama_biaya && <small className="text-danger">{errors.nama_biaya}</small>}
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label small">Biaya Minimal (Rp) <span className="text-danger">*</span></label>
                      <input type="text" className={`form-control form-control-sm ${errors.biaya_minimal ? 'border-danger' : ''}`} name="biaya_minimal" value={displayMin} onChange={handleChange}
                        onKeyDown={(e) => { const allowed = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","0","1","2","3","4","5","6","7","8","9"]; if (!allowed.includes(e.key) && !e.ctrlKey) e.preventDefault(); }}
                        placeholder="Titik otomatis" inputMode="numeric" autoComplete="off" />
                      {errors.biaya_minimal && <small className="text-danger">{errors.biaya_minimal}</small>}
                    </div>
                    <div className="col-6">
                      <label className="form-label small">Biaya Maksimal (Rp) <span className="text-danger">*</span></label>
                      <input type="text" className={`form-control form-control-sm ${errors.biaya_maksimal ? 'border-danger' : ''}`} name="biaya_maksimal" value={displayMax} onChange={handleChange}
                        onKeyDown={(e) => { const allowed = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","0","1","2","3","4","5","6","7","8","9"]; if (!allowed.includes(e.key) && !e.ctrlKey) e.preventDefault(); }}
                        placeholder="Titik otomatis" inputMode="numeric" autoComplete="off" />
                      {errors.biaya_maksimal && <small className="text-danger">{errors.biaya_maksimal}</small>}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Deskripsi</label>
                    <textarea className="form-control form-control-sm" name="deskripsi_biaya" rows="2" value={formData.deskripsi_biaya} onChange={handleChange} />
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

export default KelolaBiaya;