import React, { useEffect, useState } from "react";
import API from "../services/api";

function ProgramKerja({ user, onLogout, onNavigate }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama_program: "",
    deskripsi_program: "",
    periode: new Date().getFullYear().toString(),
    kategori: "",
    status: "Rencana",
  });
  const [periodeAktif, setPeriodeAktif] = useState([]);
  // ========== REVISI 4: Filter program berdasarkan periode aktif & sembunyikan yang Selesai ==========
  const fetchPrograms = async () => {
    setLoading(true);
    try {
      // Ambil periode aktif dari endpoint baru
      const periodeResponse = await API.get("/periode/aktif");
      let periodeAktif = [];

      if (periodeResponse.data.status === "success") {
        periodeAktif = periodeResponse.data.data || [];
        setPeriodeAktif(periodeAktif);
      }

      // Ambil semua program kerja
      const response = await API.get("/program-kerja");

      if (response.data.status === "success") {
        let filteredPrograms = response.data.data;

        // Filter: sembunyikan yang status Selesai
        filteredPrograms = filteredPrograms.filter(
          (prog) => prog.status_program !== "Selesai",
        );

        // Filter: hanya tampilkan yang sesuai periode aktif
        if (periodeAktif.length > 0) {
          filteredPrograms = filteredPrograms.filter((prog) => {
            // Cek apakah periode program ada dalam daftar periode aktif
            return periodeAktif.some((periode) => {
              return prog.periode?.toString() === periode.toString();
            });
          });
        }

        setPrograms(filteredPrograms);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      // Fallback: ambil tanpa filter
      try {
        const response = await API.get("/program-kerja");
        if (response.data.status === "success") {
          const filtered = response.data.data.filter(
            (prog) => prog.status_program !== "Selesai",
          );
          setPrograms(filtered);
        }
      } catch (err) {
        console.error("Gagal fallback:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/program-kerja/${editingId}`, formData);
        alert("✅ Program kerja berhasil diubah");
      } else {
        // REVISI 2: Status otomatis "Rencana" untuk program baru
        const dataToSend = {
          ...formData,
          status: "Rencana", // Pastikan status selalu Rencana saat tambah baru
        };
        await API.post("/program-kerja", dataToSend);
        alert("✅ Program kerja berhasil ditambahkan");
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        nama_program: "",
        deskripsi_program: "",
        periode: new Date().getFullYear().toString(),
        kategori: "",
        status: "Rencana",
      });
      fetchPrograms();
    } catch (error) {
      console.error(error);
      alert("❌ Gagal menyimpan data");
    }
  };

  const handleDelete = async (id, status) => {
    if (status === "Selesai") {
      alert("⚠️ Program kerja yang sudah selesai tidak dapat dihapus!");
      return;
    }
    if (window.confirm("Yakin ingin menghapus program kerja ini?")) {
      try {
        await API.delete(`/program-kerja/${id}`);
        alert("✅ Program kerja berhasil dihapus");
        fetchPrograms();
      } catch (error) {
        console.error(error);
        alert("❌ Gagal menghapus program kerja");
      }
    }
  };

  // ========== REVISI 1: Fungsi untuk navigasi ke Isi RAB ==========
  const handleIsiRAB = (program) => {
    // Simpan data program yang dipilih ke localStorage
    localStorage.setItem(
      "selectedProgramRAB",
      JSON.stringify({
        id_program: program.id_program,
        nama_program: program.nama_program,
        periode: program.periode,
      }),
    );
    // Navigasi ke halaman Kelola RAB
    onNavigate("kelola-rab");
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      nama_program: "",
      deskripsi_program: "",
      periode: new Date().getFullYear().toString(),
      kategori: "",
      status: "Rencana",
    });
    setShowModal(true);
  };

  const openEditModal = (program) => {
    if (program.status_program === "Selesai") {
      alert("⚠️ Program kerja yang sudah selesai tidak dapat diedit!");
      return;
    }
    setEditingId(program.id_program);
    setFormData({
      nama_program: program.nama_program,
      deskripsi_program: program.deskripsi_program || "",
      periode: program.periode || new Date().getFullYear().toString(),
      kategori: program.kategori || "",
      status: program.status_program,
    });
    setShowModal(true);
  };

  const kategoriList = [
    "Workshop & Mentoring",
    "Game Jam & Hackathon",
    "Feedback & Review",
    "Open Course & Event",
    "Roadshow",
    "Bootcamp",
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Selesai":
        return "bg-success";
      case "Berjalan":
        return "bg-primary";
      case "Batal":
        return "bg-danger";
      default:
        return "bg-warning";
    }
  };

  // ========== Format periode untuk tampilan ==========
  const formatPeriode = (periode) => {
    if (!periode) return "-";
    return periode.toString();
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-3">Memuat data program kerja...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary">📋 Kelola Program Kerja</h1>
        <div className="d-flex align-items-center gap-2">
          <span className="me-2">
            Halo, <strong>{user.nama_lengkap}</strong>
          </span>
          <span className="badge bg-secondary me-2">{user.role}</span>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => onNavigate("dashboard")}
          >
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
        <strong>Periode Aktif:</strong>{" "}
        {periodeAktif.length > 0 ? (
          periodeAktif.map((t, i) => (
            <span key={i} className="badge bg-success me-1">
              {t}
            </span>
          ))
        ) : (
          <span className="text-muted">Semua periode</span>
        )}
        <span className="ms-2 text-muted">
          | Program selesai tidak ditampilkan
        </span>
      </div>

      <div className="alert alert-info mb-3">
        <small>
          📅 <strong>Periode Aktif:</strong> Hanya menampilkan program yang
          belum selesai sesuai periode aktif.
        </small>
      </div>

      <div className="mb-3">
        <button className="btn btn-success" onClick={openAddModal}>
          ➕ Tambah Program Kerja
        </button>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">📋 Daftar Program Kerja Aktif</h5>
        </div>
        <div className="card-body">
          {programs.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">📭 Belum ada program kerja aktif</p>
              <small className="text-muted">
                Program yang sudah selesai tidak ditampilkan di sini. Lihat menu{" "}
                <strong>Riwayat</strong> untuk program yang sudah selesai.
              </small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>No</th>
                    <th>Nama Program</th>
                    <th>Deskripsi</th>
                    <th>Periode</th>
                    <th>Kategori</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((program, index) => (
                    <tr key={program.id_program}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{program.nama_program}</strong>
                      </td>
                      <td>
                        <small>{program.deskripsi_program || "-"}</small>
                      </td>
                      <td>{formatPeriode(program.periode)}</td>
                      <td>
                        {program.kategori ? (
                          <span className="badge bg-info text-dark">
                            {program.kategori}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(program.status_program)}`}
                        >
                          {program.status_program || "Rencana"}
                        </span>
                      </td>
                      <td>
                        {program.status_program !== "Selesai" ? (
                          <div className="d-flex gap-1 flex-wrap">
                            {/* Tombol Edit */}
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => openEditModal(program)}
                              title="Edit Program"
                            >
                              ✏️ Edit
                            </button>

                            {/* Tombol Isi RAB - hanya untuk role Ketua */}
                            {user.role === "Ketua" && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleIsiRAB(program)}
                                title="Isi RAB Program"
                              >
                                💰 Isi RAB
                              </button>
                            )}

                            {/* Tombol Hapus */}
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() =>
                                handleDelete(
                                  program.id_program,
                                  program.status_program,
                                )
                              }
                              title="Hapus Program"
                            >
                              🗑️ Hapus
                            </button>
                          </div>
                        ) : (
                          <span
                            className="text-muted"
                            style={{ fontSize: "12px" }}
                          >
                            🔒 Program Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========== Modal Form ========== */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {editingId
                    ? "✏️ Edit Program Kerja"
                    : "➕ Tambah Program Kerja"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Nama Program <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="nama_program"
                      value={formData.nama_program}
                      onChange={handleChange}
                      required
                      placeholder="Masukkan nama program kerja"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Deskripsi</label>
                    <textarea
                      className="form-control"
                      name="deskripsi_program"
                      rows="3"
                      value={formData.deskripsi_program}
                      onChange={handleChange}
                      placeholder="Deskripsi singkat program kerja"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Periode <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="periode"
                        value={formData.periode}
                        onChange={handleChange}
                        required
                      >
                        <option value={new Date().getFullYear().toString()}>
                          Tahun Sekarang ({new Date().getFullYear()})
                        </option>
                        <option
                          value={(new Date().getFullYear() + 1).toString()}
                        >
                          Tahun Depan ({new Date().getFullYear() + 1})
                        </option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Kategori</label>
                      <select
                        className="form-select"
                        name="kategori"
                        value={formData.kategori}
                        onChange={handleChange}
                      >
                        <option value="">-- Pilih Kategori --</option>
                        {kategoriList.map((kat, idx) => (
                          <option key={idx} value={kat}>
                            {kat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ========== REVISI 2: Status readonly saat tambah baru ========== */}
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    {editingId ? (
                      // Saat EDIT: status bisa diubah
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="Rencana">📝 Rencana</option>
                        <option value="Berjalan">▶️ Berjalan</option>
                        <option value="Selesai">✅ Selesai</option>
                        <option value="Batal">❌ Batal</option>
                      </select>
                    ) : (
                      // Saat TAMBAH: status readonly "Rencana"
                      <div>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value="📝 Rencana"
                          disabled
                          readOnly
                        />
                        <small className="text-muted">
                          ℹ️ Status otomatis <strong>"Rencana"</strong> untuk
                          program baru. Status dapat diubah melalui menu Edit
                          setelah disimpan.
                        </small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    ❌ Batal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    💾 {editingId ? "Simpan Perubahan" : "Tambah Program"}
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
