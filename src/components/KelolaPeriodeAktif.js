import React, { useEffect, useState, useRef } from 'react';
import API from '../services/api';

function KelolaPeriodeAktif({ user, onLogout, onNavigate }) {
  const [tahunList, setTahunList] = useState([]);
  const [selectedTahun, setSelectedTahun] = useState([]);
  const [newTahun, setNewTahun] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const currentYear = new Date().getFullYear();

  const suggestionYears = [
    `${currentYear + 2}/${currentYear + 3}`,
    `${currentYear + 2}`,
    `${currentYear + 1}/${currentYear + 2}`,
    `${currentYear + 1}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear}`,
    `${currentYear - 1}/${currentYear}`,
    `${currentYear - 1}`,
    `${currentYear - 2}/${currentYear - 1}`,
    `${currentYear - 2}`,
  ];

  const filteredSuggestions = suggestionYears.filter(
    year => 
      !tahunList.includes(year) && 
      year.toLowerCase().includes(newTahun.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tahunResponse = await API.get('/periode/tahun-list');
      if (tahunResponse.data.status === 'success') {
        setTahunList(tahunResponse.data.data);
      }

      const aktifResponse = await API.get('/periode/aktif');
      if (aktifResponse.data.status === 'success') {
        setSelectedTahun(aktifResponse.data.data || []);
      }
    } catch (error) {
      console.error('Gagal memuat data:', error);
      const cy = new Date().getFullYear();
      setTahunList([
        `${cy}/${cy + 1}`,
        `${cy}`,
        `${cy - 1}/${cy}`,
        `${cy - 1}`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (tahun) => {
    setSelectedTahun(prev => {
      if (prev.includes(tahun)) {
        return prev.filter(t => t !== tahun);
      } else {
        if (prev.length >= 2) {
          setMessage('⚠️ Maksimal hanya dapat memilih 2 tahun!');
          setTimeout(() => setMessage(''), 3000);
          return prev;
        }
        return [...prev, tahun];
      }
    });
  };

  const handleTambahTahun = async (tahunInput = null) => {
    const tahun = tahunInput || newTahun.trim();
    
    if (!tahun) {
      setMessage('⚠️ Masukkan atau pilih tahun!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (tahunList.includes(tahun)) {
      setMessage('⚠️ Tahun sudah ada dalam daftar!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await API.post('/periode/tahun', { tahun });
      if (response.data.status === 'success') {
        setNewTahun('');
        setShowDropdown(false);
        setMessage('✅ Tahun berhasil ditambahkan!');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      }
    } catch (error) {
      console.error('Gagal menambah tahun:', error);
      setTahunList(prev => {
        const updated = [...prev, tahun];
        return updated.sort((a, b) => {
          const yearA = parseInt(a.split('/')[0]);
          const yearB = parseInt(b.split('/')[0]);
          return yearB - yearA;
        });
      });
      setNewTahun('');
      setShowDropdown(false);
      setMessage('✅ Tahun berhasil ditambahkan!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSimpan = async () => {
    if (selectedTahun.length === 0) {
      setMessage('⚠️ Pilih minimal 1 tahun!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSaving(true);
    try {
      const response = await API.post('/periode/aktif', { 
        tahun_list: selectedTahun 
      });
      if (response.data.status === 'success') {
        setMessage('✅ Periode aktif berhasil disimpan!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Gagal menyimpan:', error);
      setMessage('❌ Gagal menyimpan. Coba lagi.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleHapusTahun = async (tahun) => {
    if (!window.confirm(`Hapus tahun "${tahun}"?`)) return;

    if (selectedTahun.includes(tahun)) {
      setSelectedTahun(prev => prev.filter(t => t !== tahun));
    }

    try {
      await API.delete(`/periode/tahun/${encodeURIComponent(tahun)}`);
      setMessage('✅ Tahun berhasil dihapus!');
      setTimeout(() => setMessage(''), 3000);
      fetchData();
    } catch (error) {
      setTahunList(prev => prev.filter(t => t !== tahun));
      setMessage('✅ Tahun berhasil dihapus!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const sortedTahunList = [...tahunList].sort((a, b) => {
    const yearA = parseInt(a.split('/')[0]);
    const yearB = parseInt(b.split('/')[0]);
    return yearB - yearA;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 text-muted">Memuat data periode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">📅 Kelola Periode Aktif</h1>
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

      {/* Pesan */}
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-warning'} alert-dismissible fade show py-2 small`}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Info Periode Aktif */}
      <div className="alert alert-info py-2 small mb-3">
        <span className="me-2">📌</span>
        <strong>Periode Aktif Saat Ini:</strong>{' '}
        {selectedTahun.length > 0 ? (
          selectedTahun.map((t, i) => (
            <span key={i} className="badge bg-success me-1">{t}</span>
          ))
        ) : (
          <span className="text-muted">Belum dipilih</span>
        )}
      </div>

      {/* Card Tabel */}
      <div className="card shadow-sm w-100">
        <div className="card-header bg-primary text-white d-flex flex-wrap justify-content-between align-items-center py-2 gap-2">
          <h5 className="mb-0 h6">📋 Daftar Tahun - Pilih Periode Aktif</h5>
          <span className={`badge ${selectedTahun.length >= 2 ? 'bg-danger' : 'bg-light text-dark'}`}>
            Terpilih: {selectedTahun.length}/2
          </span>
        </div>
        <div className="card-body p-2 p-md-3">
          <table className="table table-bordered table-hover align-middle mb-0 w-100">
            <thead className="table-light text-center">
              <tr>
                <th style={{ width: '12%' }}>Pilih</th>
                <th style={{ width: '43%' }}>Tahun</th>
                <th style={{ width: '25%' }}>Status</th>
                <th style={{ width: '20%' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedTahunList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted small">
                    📭 Belum ada tahun tersedia. Silakan tambahkan di bawah.
                  </td>
                </tr>
              ) : (
                sortedTahunList.map((tahun, index) => {
                  const isSelected = selectedTahun.includes(tahun);
                  const isDisabled = !isSelected && selectedTahun.length >= 2;
                  
                  return (
                    <tr key={index} className={isSelected ? 'table-success' : ''}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? '0.4' : '1'
                          }}
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(tahun)}
                          disabled={isDisabled}
                        />
                      </td>
                      <td><strong className="small">{tahun}</strong></td>
                      <td className="text-center">
                        {isSelected ? (
                          <span className="badge bg-success small px-2">✅ Aktif</span>
                        ) : isDisabled ? (
                          <span className="badge bg-secondary small px-2">🔒 Maks. 2</span>
                        ) : (
                          <span className="badge bg-light text-dark border small px-2">⬜ Tidak Aktif</span>
                        )}
                      </td>
                      <td className="text-center">
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleHapusTahun(tahun)}
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Baris Input Tambah Tahun */}
              <tr className="table-active">
                <td></td>
                <td>
                  <div className="position-relative" ref={dropdownRef}>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white border-end-0 ps-2 pe-1">➕</span>
                      <input
                        ref={inputRef}
                        type="text"
                        className="form-control border-start-0 border-end-0"
                        placeholder="Ketik atau pilih tahun..."
                        value={newTahun}
                        onChange={(e) => {
                          setNewTahun(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleTambahTahun();
                          }
                        }}
                      />
                      <button 
                        className="btn btn-outline-secondary px-2" 
                        type="button"
                        onClick={() => {
                          setShowDropdown(!showDropdown);
                          if (!showDropdown) inputRef.current?.focus();
                        }}
                      >
                        ▼
                      </button>
                    </div>

                    {showDropdown && (
                      <ul 
                        className="list-group position-absolute shadow"
                        style={{ 
                          zIndex: 1050, 
                          maxHeight: '180px', 
                          overflowY: 'auto',
                          width: '100%',
                          top: '100%',
                          left: 0,
                          minWidth: '200px'
                        }}
                      >
                        {filteredSuggestions.length > 0 ? (
                          filteredSuggestions.map((year, i) => (
                            <li
                              key={i}
                              className="list-group-item list-group-item-action py-1 px-3 small"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleTambahTahun(year)}
                            >
                              {year}
                            </li>
                          ))
                        ) : newTahun.trim() ? (
                          <li
                            className="list-group-item list-group-item-action py-1 px-3 text-primary small"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleTambahTahun(newTahun.trim())}
                          >
                            ➕ Tambah "{newTahun.trim()}" (baru)
                          </li>
                        ) : (
                          <li className="list-group-item py-1 px-3 text-muted" style={{ fontSize: '12px' }}>
                            Ketik untuk mencari...
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </td>
                <td></td>
                <td className="text-center">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleTambahTahun()}
                  >
                    ➕ Tambah
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="card-footer d-flex flex-wrap justify-content-between align-items-center py-2 gap-2">
          <small className="text-muted">
            💡 Maksimal memilih <strong>2 tahun</strong>
          </small>
          <button 
            className="btn btn-primary"
            onClick={handleSimpan}
            disabled={selectedTahun.length === 0 || saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" style={{ width: '14px', height: '14px' }}></span>
                Menyimpan...
              </>
            ) : (
              <>💾 Simpan Periode Aktif</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default KelolaPeriodeAktif;