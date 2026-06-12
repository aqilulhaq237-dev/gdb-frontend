import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { swalSukses, swalError } from '../utils/swal';

function KonfirmasiTransaksi({ user, onLogout, onNavigate }) {
  const [pengajuan, setPengajuan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPengajuan();
  }, []);

  const fetchPengajuan = async () => {
    setLoading(true);
    try {
      const response = await API.get('/pengajuan/menunggu');
      if (response.data.status === 'success') {
        setPengajuan(response.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat pengajuan:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  const openSetujui = (item) => {
    setSelectedPengajuan(item);
    setCatatan('');
    setError('');
    setShowModal(true);
  };

  const openTolak = (item) => {
    setSelectedPengajuan({ ...item, action: 'tolak' });
    setCatatan('');
    setError('');
    setShowModal(true);
  };

  const handleKonfirmasi = async () => {
    if (selectedPengajuan.action === 'tolak' && !catatan.trim()) {
      setError('Catatan penolakan wajib diisi!');
      return;
    }

    setSaving(true);
    try {
      if (selectedPengajuan.action === 'tolak') {
        await API.post(`/pengajuan/${selectedPengajuan.id_pengajuan}/tolak`, { catatan });
        swalSukses('Berhasil!', 'Pengajuan berhasil ditolak');
      } else {
        await API.post(`/pengajuan/${selectedPengajuan.id_pengajuan}/setujui`);
        swalSukses('Berhasil!', 'Pengajuan berhasil disetujui');
      }
      setShowModal(false);
      fetchPengajuan();
    } catch (error) {
      swalError('Gagal!', 'Gagal memproses pengajuan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data pengajuan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">✅ Konfirmasi Transaksi</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">Halo, <strong>{user.nama_lengkap}</strong></span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate('dashboard')}>📊 Dashboard</button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header card-header-yellow py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">📋 Daftar Pengajuan Menunggu</h5>
          <span className="badge bg-light text-dark small">{pengajuan.length} pengajuan</span>
        </div>
        <div className="card-body p-2 p-md-3">
          {pengajuan.length === 0 ? (
            <div className="text-center py-5">
              <span className="fs-1">📭</span>
              <p className="text-muted mt-2">Tidak ada pengajuan yang menunggu konfirmasi</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0 small">
                <thead className="table-light text-center">
                  <tr>
                    <th>No</th>
                    <th>Program</th>
                    <th>Pengaju</th>
                    <th>Jenis</th>
                    <th>Nominal</th>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Bukti</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pengajuan.map((item, index) => (
                    <tr key={item.id_pengajuan}>
                      <td className="text-center">{index + 1}</td>
                      <td>{item.nama_program}</td>
                      <td>{item.nama_pengaju}</td>
                      <td className="text-center">
                        <span className={`badge ${item.jenis === 'Masuk' ? 'bg-success' : 'bg-danger'}`}>
                          {item.jenis}
                        </span>
                      </td>
                      <td className="text-end">{formatRupiah(item.nominal)}</td>
                      <td className="text-center">{item.tanggal}</td>
                      <td>{item.keterangan || '-'}</td>
                      <td className="text-center">
                        {item.bukti_file ? (
                          <a href={`https://gdb-backend-production-4dd1.up.railway.app/uploads/${item.bukti_file}`} target="_blank" rel="noreferrer" className="small">📎 Lihat</a>
                        ) : (
                          <span className="text-muted small">Tidak ada</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button className="btn btn-success btn-sm" onClick={() => openSetujui(item)}>✅ Setujui</button>
                          <button className="btn btn-danger btn-sm" onClick={() => openTolak(item)}>❌ Tolak</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h5 className="modal-title h6">
                  {selectedPengajuan?.action === 'tolak' ? '❌ Tolak Pengajuan' : '✅ Setujui Pengajuan'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="small mb-3">
                  {selectedPengajuan?.action === 'tolak'
                    ? 'Anda akan menolak pengajuan transaksi berikut:'
                    : 'Anda akan menyetujui pengajuan transaksi berikut:'}
                </p>
                <table className="table table-sm table-borderless small mb-3">
                  <tbody>
                    <tr><td style={{ width: '120px' }}>Program</td><td>: {selectedPengajuan?.nama_program}</td></tr>
                    <tr><td>Pengaju</td><td>: {selectedPengajuan?.nama_pengaju}</td></tr>
                    <tr><td>Jenis</td><td>: {selectedPengajuan?.jenis}</td></tr>
                    <tr><td>Nominal</td><td>: {formatRupiah(selectedPengajuan?.nominal)}</td></tr>
                    <tr><td>Tanggal</td><td>: {selectedPengajuan?.tanggal}</td></tr>
                  </tbody>
                </table>

                {selectedPengajuan?.action === 'tolak' && (
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Catatan Penolakan <span className="text-danger">*</span></label>
                    <textarea
                      className={`form-control form-control-sm ${error ? 'border-danger' : ''}`}
                      rows="3"
                      value={catatan}
                      onChange={(e) => { setCatatan(e.target.value); setError(''); }}
                      placeholder="Tulis alasan penolakan..."
                    />
                    {error && <small className="text-danger">{error}</small>}
                  </div>
                )}
              </div>
              <div className="modal-footer py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>❌ Batal</button>
                <button
                  type="button"
                  className={`btn btn-sm ${selectedPengajuan?.action === 'tolak' ? 'btn-danger' : 'btn-success'}`}
                  onClick={handleKonfirmasi}
                  disabled={saving}
                >
                  {saving ? '⏳ Memproses...' : selectedPengajuan?.action === 'tolak' ? '❌ Tolak' : '✅ Setujui'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KonfirmasiTransaksi;