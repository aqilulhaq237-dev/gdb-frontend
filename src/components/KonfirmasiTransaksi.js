import React, { useEffect, useState } from "react";
import API from "../services/api";

function KonfirmasiTransaksi({ user, onLogout, onNavigate }) {
  const [pengajuanList, setPengajuanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [catatanTolak, setCatatanTolak] = useState("");

  // Ambil daftar pengajuan transaksi yang menunggu konfirmasi
  const fetchPengajuan = async () => {
    setLoading(true);
    try {
      const response = await API.get("/pengajuan/menunggu");
      if (response.data.status === "success") {
        setPengajuanList(response.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data pengajuan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengajuan();
    // Refresh setiap 10 detik
    const interval = setInterval(fetchPengajuan, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle konfirmasi setujui
  const handleSetujui = async (id_pengajuan) => {
    if (!window.confirm("Setujui pengajuan ini?")) return;

    try {
      const response = await API.post(`/pengajuan/${id_pengajuan}/setujui`);
      if (response.data.status === "success") {
        alert("✅ Pengajuan disetujui!");
        fetchPengajuan(); // Refresh data
      }
    } catch (error) {
      console.error("Gagal menyetujui:", error);
      alert("❌ Gagal menyetujui pengajuan");
    }
  };

  // Handle konfirmasi tolak
  const handleTolak = async (id_pengajuan) => {
    try {
      const response = await API.post(`/pengajuan/${id_pengajuan}/tolak`, {
        catatan: catatanTolak,
      });
      if (response.data.status === "success") {
        alert("✅ Pengajuan ditolak!");
        setShowModal(false);
        setCatatanTolak("");
        fetchPengajuan();
      }
    } catch (error) {
      console.error("Gagal menolak:", error);
      alert("❌ Gagal menolak pengajuan");
    }
  };

  // Format Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka);
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-3">Memuat data pengajuan...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary">Konfirmasi Transaksi Lain-lain</h1>
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

     

      {/* Info Notifikasi */}
      {pengajuanList.length > 0 && (
        <div className="alert alert-warning">
          <strong>ℹ️ NOTIFIKASI:</strong> Ada {pengajuanList.length} pengajuan
          transaksi yang menunggu konfirmasi
        </div>
      )}

      {/* Tabel Pengajuan */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">📋 Daftar Pengajuan Transaksi</h5>
        </div>
        <div className="card-body">
          {pengajuanList.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">
                ✅ Tidak ada pengajuan yang menunggu konfirmasi
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Program Kerja</th>
                    <th>Kategori</th>
                    <th>Nominal</th>
                    <th>Pengaju</th>
                    <th>Alasan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pengajuanList.map((item, index) => (
                    <tr key={item.id_pengajuan}>
                      <td>{index + 1}</td>
                      <td>{item.tanggal || "-"}</td>
                      <td>{item.nama_program || "-"}</td>
                      <td>{item.kategori || "-"}</td>
                      <td className="text-danger">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td>{item.nama_pengaju || "-"}</td>
                      <td>{item.alasan || "-"}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleSetujui(item.id_pengajuan)}
                          >
                            ✅ Setujui
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              setSelectedPengajuan(item);
                              setShowModal(true);
                            }}
                          >
                            ❌ Tolak
                          </button>
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

      {/* Modal Tolak */}
      {showModal && selectedPengajuan && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Tolak Pengajuan</h5>
                <button
                  type="button"
                  className="btn-close text-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Program:</strong> {selectedPengajuan.nama_program}
                </p>
                <p>
                  <strong>Nominal:</strong>{" "}
                  {formatRupiah(selectedPengajuan.nominal)}
                </p>
                <p>
                  <strong>Alasan Pengajuan:</strong> {selectedPengajuan.alasan}
                </p>
                <div className="mb-3">
                  <label className="form-label">Catatan Penolakan *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={catatanTolak}
                    onChange={(e) => setCatatanTolak(e.target.value)}
                    placeholder="Masukkan alasan penolakan..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (!catatanTolak) {
                      alert("⚠️ Isi catatan penolakan!");
                      return;
                    }
                    handleTolak(selectedPengajuan.id_pengajuan);
                  }}
                >
                  Konfirmasi Tolak
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
