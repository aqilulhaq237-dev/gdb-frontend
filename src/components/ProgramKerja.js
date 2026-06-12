import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { swalSukses, swalError } from '../utils/swal';

function ProgramKerja({ user, onLogout, onNavigate }) {
  const [programs, setPrograms] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [periodeAktif, setPeriodeAktif] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama_program: '',
    deskripsi_program: '',
    periode: '',
    kategori: '',
    status: 'Rencana'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const periodeRes = await API.get('/periode/aktif');
      const periodeData = periodeRes.data.data || [];
      setPeriodeAktif(periodeData);

      const progRes = await API.get('/program-kerja');
      if (progRes.data.status === 'success') {
        let allPrograms = progRes.data.data;
        if (periodeData.length > 0) {
          allPrograms = allPrograms.filter(prog =>
            periodeData.some(p => prog.periode?.toString() === p.toString())
          );
        }
        // ✅ Urutkan: terbaru di atas (id_program DESC)
        allPrograms.sort((a, b) => (b.id_program || 0) - (a.id_program || 0));
        setPrograms(allPrograms);
      }

      const katRes = await API.get('/kategori');
      if (katRes.data.status === 'success') {
        setKategoriList(katRes.data.data.filter(k => k.status === 'Aktif'));
      }
    } catch (error) {
      console.error('Gagal memuat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nama_program.trim()) newErrors.nama_program = 'Nama program wajib diisi';
    if (!formData.periode.trim()) newErrors.periode = 'Periode wajib diisi';
    if (!formData.kategori.trim()) newErrors.kategori = 'Kategori wajib dipilih';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ nama_program: '', deskripsi_program: '', periode: '', kategori: '', status: 'Rencana' });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (prog) => {
    setEditingId(prog.id_program);
    setFormData({
      nama_program: prog.nama_program,
      deskripsi_program: prog.deskripsi_program || '',
      periode: prog.periode || '',
      kategori: prog.kategori || '',
      status: prog.status_program || 'Rencana'
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingId) {
        await API.put(`/program-kerja/${editingId}`, formData);
        swalSukses('Berhasil!', 'Program kerja berhasil diupdate');
      } else {
        await API.post('/program-kerja', formData);
        swalSukses('Berhasil!', 'Program kerja berhasil ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      swalError('Gagal!', error.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai': return 'bg-success';
      case 'Berjalan': return 'bg-primary';
      case 'Batal': return 'bg-danger';
      default: return 'bg-warning';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data program...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">📋 Kelola Program Kerja</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate('dashboard')}>📊 Dashboard</button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className="alert alert-info py-2 small mb-3">
        📅 <strong>Periode Aktif:</strong>{' '}
        {periodeAktif.length > 0 ? periodeAktif.map((t, i) => <span key={i} className="badge bg-success me-1">{t}</span>) : <span className="text-muted">Semua</span>}
      </div>

      <div className="card shadow-sm">
        <div className="card-header card-header-green py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">📋 Daftar Program Kerja</h5>
          <button className="btn btn-light btn-sm" onClick={openAddModal}>➕ Tambah Program</button>
        </div>
        <div className="card-body p-2 p-md-3">
          {programs.length === 0 ? (
            <div className="text-center py-4 text-muted">Belum ada program kerja</div>
          ) : (
            <table className="table table-bordered table-hover align-middle mb-0 small">
              <thead className="table-light text-center">
                <tr>
                  <th>No</th>
                  <th>Nama Program</th>
                  <th>Periode</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((prog, index) => (
                  <tr key={prog.id_program}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <strong>{prog.nama_program}</strong>
                      {prog.deskripsi_program && <small className="text-muted d-block">{prog.deskripsi_program.substring(0, 60)}{prog.deskripsi_program.length > 60 ? '...' : ''}</small>}
                    </td>
                    <td className="text-center">{prog.periode || '-'}</td>
                    <td className="text-center">{prog.kategori || '-'}</td>
                    <td className="text-center">
                      <span className={`badge ${getStatusBadge(prog.status_program)}`}>{prog.status_program || 'Rencana'}</span>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-warning btn-sm" onClick={() => openEditModal(prog)}>✏️ Edit</button>
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
                <h5 className="modal-title h6">{editingId ? '✏️ Edit Program' : '➕ Tambah Program'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small">Nama Program <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control form-control-sm ${errors.nama_program ? 'border-danger' : ''}`} name="nama_program" value={formData.nama_program} onChange={handleChange} />
                    {errors.nama_program && <small className="text-danger">{errors.nama_program}</small>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Deskripsi</label>
                    <textarea className="form-control form-control-sm" name="deskripsi_program" rows="2" value={formData.deskripsi_program} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Periode <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control form-control-sm ${errors.periode ? 'border-danger' : ''}`} name="periode" value={formData.periode} onChange={handleChange} placeholder="Contoh: 2026/2027" />
                    {errors.periode && <small className="text-danger">{errors.periode}</small>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Kategori <span className="text-danger">*</span></label>
                    <select className={`form-select form-select-sm ${errors.kategori ? 'border-danger' : ''}`} name="kategori" value={formData.kategori} onChange={handleChange}>
                      <option value="">-- Pilih Kategori --</option>
                      {kategoriList.map(k => <option key={k.id_kategori} value={k.nama_kategori}>{k.nama_kategori}</option>)}
                    </select>
                    {errors.kategori && <small className="text-danger">{errors.kategori}</small>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Status</label>
                    <select className="form-select form-select-sm" name="status" value={formData.status} onChange={handleChange}>
                      <option value="Rencana">📝 Rencana</option>
                      <option value="Berjalan">▶️ Berjalan</option>
                    </select>
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

export default ProgramKerja;