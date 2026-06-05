import React, { useEffect, useState } from 'react';
import API from '../services/api';

function UpdateStatusProgram({ user, onLogout, onNavigate }) {
  const [programs, setPrograms] = useState([]);
  const [periodeAktif, setPeriodeAktif] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil periode aktif
      const periodeRes = await API.get('/periode/aktif');
      const periodeAktifData = periodeRes.data.data || [];
      setPeriodeAktif(periodeAktifData);

      // Ambil semua program
      const response = await API.get('/program-kerja');
      
      if (response.data.status === 'success') {
        let filteredPrograms = response.data.data;
        
        // Filter: sembunyikan yang status Selesai
        filteredPrograms = filteredPrograms.filter(
          prog => prog.status_program !== 'Selesai'
        );
        
        // Filter: hanya yang sesuai periode aktif
        if (periodeAktifData.length > 0) {
          filteredPrograms = filteredPrograms.filter(prog =>
            periodeAktifData.some(p => prog.periode?.toString() === p.toString())
          );
        }
        
        setPrograms(filteredPrograms);
      }
    } catch (error) {
      console.error('Gagal memuat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (program) => {
    setSelectedProgram(program);
    setNewStatus(program.status_program);
    setMessage('');
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      setMessage('⚠️ Pilih status terlebih dahulu!');
      return;
    }

    if (newStatus === selectedProgram.status_program) {
      setMessage('⚠️ Status tidak berubah!');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await API.put(`/program-kerja/${selectedProgram.id_program}`, {
        ...selectedProgram,
        status: newStatus
      });

      if (response.data.status === 'success') {
        setMessage('✅ Status berhasil diupdate!');
        setTimeout(() => {
          setShowModal(false);
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error('Gagal update:', error);
      setMessage('❌ Gagal mengupdate status');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Selesai': return '✅';
      case 'Berjalan': return '▶️';
      case 'Batal': return '❌';
      default: return '📝';
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
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">🔄 Update Status Program Kerja</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate('dashboard')}>
            📊 Dashboard
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Info Periode Aktif */}
      <div className="alert alert-info mb-3 py-2 small">
        <span className="me-2">📅</span>
        <strong>Periode Aktif:</strong>{' '}
        {periodeAktif.length > 0 ? (
          periodeAktif.map((t, i) => (
            <span key={i} className="badge bg-success me-1">{t}</span>
          ))
        ) : (
          <span className="text-muted">Semua periode</span>
        )}
        <span className="ms-2 text-muted">| Hanya program dengan status Rencana & Berjalan</span>
      </div>

      {/* Tabel Program */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">📋 Daftar Program Kerja</h5>
          <span className="badge bg-light text-dark small">{programs.length} program</span>
        </div>
        <div className="card-body p-2 p-md-3">
          {programs.length === 0 ? (
            <div className="text-center py-5">
              <span className="fs-1">📭</span>
              <p className="text-muted mt-2">Tidak ada program yang perlu diupdate</p>
              <small className="text-muted">
                Program selesai tidak ditampilkan. Sesuaikan periode aktif jika perlu.
              </small>
            </div>
          ) : (
            <table className="table table-bordered table-hover align-middle mb-0 w-100">
              <thead className="table-light text-center small">
                <tr>
                  <th style={{ width: '5%' }}>No</th>
                  <th style={{ width: '35%' }}>Program Kerja</th>
                  <th style={{ width: '15%' }}>Tahun</th>
                  <th style={{ width: '15%' }}>Kategori</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '15%' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program, index) => (
                  <tr key={program.id_program}>
                    <td className="text-center small">{index + 1}</td>
                    <td>
                      <strong className="small">{program.nama_program}</strong>
                      {program.deskripsi_program && (
                        <small className="text-muted d-block">
                          {program.deskripsi_program?.substring(0, 60)}
                          {program.deskripsi_program?.length > 60 ? '...' : ''}
                        </small>
                      )}
                    </td>
                    <td className="text-center small">{program.periode || '-'}</td>
                    <td className="text-center small">
                      {program.kategori ? (
                        <span className="badge bg-info text-dark small">{program.kategori}</span>
                      ) : '-'}
                    </td>
                    <td className="text-center">
                      <span className={`badge ${getStatusBadge(program.status_program)} small`}>
                        {getStatusIcon(program.status_program)} {program.status_program || 'Rencana'}
                      </span>
                    </td>
                    <td className="text-center">
                      <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => openUpdateModal(program)}
                      >
                        🔄 Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Update Status */}
      {showModal && selectedProgram && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title h6">🔄 Update Status Program</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Info Program */}
                <div className="mb-3">
                  <label className="form-label small fw-bold">Program Kerja</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm bg-light" 
                    value={selectedProgram.nama_program}
                    disabled
                    readOnly
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold">Tahun</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm bg-light" 
                      value={selectedProgram.periode || '-'}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold">Status Saat Ini</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm bg-light" 
                      value={`${getStatusIcon(selectedProgram.status_program)} ${selectedProgram.status_program}`}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                {/* Pilih Status Baru */}
                <div className="mb-3">
                  <label className="form-label small fw-bold">
                    Ubah Status ke <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select form-select-sm"
                    value={newStatus}
                    onChange={(e) => {
                      setNewStatus(e.target.value);
                      setMessage('');
                    }}
                  >
                    <option value="Rencana">📝 Rencana</option>
                    <option value="Berjalan">▶️ Berjalan</option>
                    <option value="Selesai">✅ Selesai</option>
                    <option value="Batal">❌ Batal</option>
                  </select>
                </div>

                {/* Pesan */}
                {message && (
                  <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-warning'} py-2 small mb-0`}>
                    {message}
                  </div>
                )}
              </div>
              <div className="modal-footer py-2">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  ❌ Batal
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={handleUpdateStatus}
                  disabled={saving || newStatus === selectedProgram.status_program}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" style={{ width: '14px', height: '14px' }}></span>
                      Menyimpan...
                    </>
                  ) : (
                    <>💾 Simpan Perubahan</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateStatusProgram;