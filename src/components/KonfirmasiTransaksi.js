import React, { useState, useEffect } from "react";
import API from "../services/api";

function KonfirmasiTransaksi({ user, onLogout, onNavigate }) {
  const [pengajuanList, setPengajuanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [actionType, setActionType] = useState(""); // "setujui" atau "tolak"
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchPengajuan();
  }, []);

  const fetchPengajuan = async () => {
    try {
      setLoading(true);
      const response = await API.get("/pengajuan/menunggu");
      if (response.data.status === "success") {
        setPengajuanList(response.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat pengajuan:", err);
      setError("Gagal memuat data pengajuan.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (actionType === "tolak" && !catatan.trim()) {
      errors.catatan = "Catatan penolakan wajib diisi!";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openConfirmModal = (pengajuan, action) => {
    setSelectedPengajuan(pengajuan);
    setActionType(action);
    setCatatan("");
    setFormErrors({});
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (actionType === "setujui") {
        await API.post(`/pengajuan/${selectedPengajuan.id_pengajuan}/setujui`);
        setSuccessMessage("✅ Pengajuan berhasil disetujui!");
      } else {
        await API.post(`/pengajuan/${selectedPengajuan.id_pengajuan}/tolak`, {
          catatan: catatan,
        });
        setSuccessMessage("❌ Pengajuan ditolak!");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      setShowModal(false);
      setSelectedPengajuan(null);
      setCatatan("");
      fetchPengajuan();
    } catch (err) {
      console.error("Gagal konfirmasi:", err);
      setError("❌ Gagal memproses konfirmasi.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
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
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate("dashboard")}>📊 Dashboard</button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {successMessage && <div className="alert alert-success py-2 mb-3">{successMessage}</div>}
      {error && <div className="alert alert-danger py-2 mb-3 d-flex align-items-center justify-content-between"><span>{error}</span><button className="btn-close" onClick={() => setError("")}></button></div>}

      <div className="mb-3">
        <span className="badge bg-warning text-dark">⏳ {pengajuanList.length} pengajuan menunggu</span>
      </div>

      {pengajuanList.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5 text-muted">
            <p className="fs-3 mb-2">✅</p>
            <p>Tidak ada pengajuan yang menunggu konfirmasi</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {pengajuanList.map((p) => (
            <div className="col-12 col-md-6 col-lg-4" key={p.id_pengajuan}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className={`badge ${p.jenis === "Masuk" ? "bg-success" : "bg-danger"}`}>
                      {p.jenis === "Masuk" ? "💰 Masuk" : "📤 Keluar"}
                    </span>
                    <small className="text-muted">{formatDate(p.tanggal)}</small>
                  </div>

                  <h5 className="card-title mb-2">{formatRupiah(p.nominal)}</h5>
                  <p className="card-text small mb-1"><strong>Program:</strong> {p.nama_program}</p>
                  <p className="card-text small mb-1"><strong>Kategori:</strong> {p.kategori || "-"}</p>
                  <p className="card-text small mb-1"><strong>Keterangan:</strong> {p.keterangan || "-"}</p>
                  <p className="card-text small mb-3"><strong>Pengaju:</strong> {p.nama_pengaju}</p>

                  {p.bukti_file && (
                    <div className="mb-3">
                      <a
                        href={`https://gdb-backend-production-4dd1.up.railway.app/uploads/${p.bukti_file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        📎 Lihat Bukti
                      </a>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-danger btn-sm flex-fill"
                      onClick={() => openConfirmModal(p, "tolak")}
                    >
                      ❌ Tolak
                    </button>
                    <button
                      className="btn btn-success btn-sm flex-fill"
                      onClick={() => openConfirmModal(p, "setujui")}
                    >
                      ✅ Setujui
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Konfirmasi */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className={`modal-header py-2 ${actionType === "setujui" ? "bg-success" : "bg-danger"} text-white`}>
                <h5 className="modal-title h6">
                  {actionType === "setujui" ? "✅ Setujui Transaksi" : "❌ Tolak Transaksi"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="bg-light rounded p-3 mb-3">
                  <p className="mb-1 small"><strong>Transaksi:</strong> {formatRupiah(selectedPengajuan?.nominal)}</p>
                  <p className="mb-0 small"><strong>Program:</strong> {selectedPengajuan?.nama_program}</p>
                </div>

                {actionType === "tolak" && (
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Catatan Penolakan <span className="text-danger">*</span></label>
                    <textarea
                      className={`form-control form-control-sm ${formErrors.catatan ? "border-danger" : ""}`}
                      rows="3"
                      value={catatan}
                      onChange={(e) => {
                        setCatatan(e.target.value);
                        if (formErrors.catatan) setFormErrors({ ...formErrors, catatan: "" });
                      }}
                      placeholder="Jelaskan alasan penolakan..."
                    ></textarea>
                    {formErrors.catatan ? <small className="text-danger">❌ {formErrors.catatan}</small> : <small className="text-muted">✍️ Wajib diisi saat menolak transaksi</small>}
                  </div>
                )}
              </div>
              <div className="modal-footer py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>❌ Batal</button>
                <button
                  type="button"
                  className={`btn btn-sm ${actionType === "setujui" ? "btn-success" : "btn-danger"}`}
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? "⏳ Memproses..." : actionType === "setujui" ? "✅ Setujui" : "❌ Tolak"}
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