import React, { useEffect, useState } from "react";
import API from "../services/api";
import { swalSukses, swalError } from '../utils/swal';

function KelolaRABDinamis({ user, onLogout, onNavigate }) {
  const [rabList, setRabList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [katalogBiaya, setKatalogBiaya] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id_program: "",
    id_biaya: "",
    nama_item: "",
    biaya_minimal: 0,
    biaya_maksimal: 0,
    harga_claim: 0,
    keterangan: "",
  });
  const [displayHargaClaim, setDisplayHargaClaim] = useState("");
  const [claimError, setClaimError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const savedProgram = localStorage.getItem("selectedProgramRAB");
    if (savedProgram) {
      try {
        const program = JSON.parse(savedProgram);
        setSelectedProgram(program.id_program);
        localStorage.removeItem("selectedProgramRAB");
      } catch (error) {
        console.error("Gagal parse:", error);
      }
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProgramList(), fetchKatalogBiaya()]);
    } catch (error) {
      console.error("Gagal memuat data awal:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramList = async () => {
    try {
      const periodeRes = await API.get("/periode/aktif");
      const periodeAktif = periodeRes.data.data || [];
      const response = await API.get("/program-kerja");
      if (response.data.status === "success") {
        let programs = response.data.data;
        if (periodeAktif.length > 0) {
          programs = programs.filter(
            (prog) =>
              prog.status_program !== "Selesai" &&
              periodeAktif.includes(prog.periode?.toString()),
          );
        } else {
          programs = programs.filter(
            (prog) => prog.status_program !== "Selesai",
          );
        }
        setProgramList(programs);
      }
    } catch (error) {
      console.error("Gagal memuat program:", error);
    }
  };

  const fetchKatalogBiaya = async () => {
    try {
      const response = await API.get("/katalog-biaya");
      if (response.data.status === "success") {
        const sortedData = response.data.data.sort((a, b) => {
          return (a.nama_biaya || "").localeCompare(b.nama_biaya || "", "id");
        });
        setKatalogBiaya(sortedData);
      }
    } catch (error) {
      console.error("Gagal memuat katalog biaya:", error);
    }
  };

  const fetchRABList = async () => {
    try {
      const response = await API.get("/rab");
      if (response.data.status === "success") {
        setRabList(response.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat RAB:", error);
    }
  };

  useEffect(() => {
    if (selectedProgram) {
      fetchRABList();
    }
  }, [selectedProgram]);

  const filteredRAB = selectedProgram
    ? rabList
        .filter((r) => r.id_program == selectedProgram)
        .sort((a, b) =>
          (a.nama_item || "").localeCompare(b.nama_item || "", "id"),
        )
    : [];

  const formatNominal = (value) => {
    if (!value && value !== 0) return "";
    const strValue = value.toString().replace(/\D/g, "");
    if (strValue === "") return "";
    return strValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.id_biaya && !formData.nama_item) {
      errors.id_biaya = "Pilih item biaya terlebih dahulu!";
    }

    if (!formData.harga_claim || formData.harga_claim <= 0) {
      errors.harga_claim = "Harga claim harus diisi dengan angka!";
    } else if (formData.harga_claim < formData.biaya_minimal) {
      errors.harga_claim = `Harga claim terlalu rendah! Minimal: Rp ${formatRupiah(formData.biaya_minimal)}`;
    } else if (formData.harga_claim > formData.biaya_maksimal) {
      errors.harga_claim = `Harga claim melebihi batas! Maksimal: Rp ${formatRupiah(formData.biaya_maksimal)}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "id_biaya") {
      const selectedBiaya = katalogBiaya.find((k) => k.id_biaya == value);
      if (selectedBiaya) {
        setFormData({
          ...formData,
          id_biaya: value,
          nama_item: selectedBiaya.nama_biaya,
          biaya_minimal: parseFloat(selectedBiaya.biaya_minimal),
          biaya_maksimal: parseFloat(selectedBiaya.biaya_maksimal),
        });
        setClaimError("");
      }
    } else if (name === "harga_claim") {
      const rawValue = value.replace(/\./g, "").replace(/\D/g, "");
      const claimValue = parseInt(rawValue) || 0;
      const formatted = rawValue === "" ? "" : formatNominal(rawValue);
      setFormData({ ...formData, harga_claim: claimValue });
      setDisplayHargaClaim(formatted);

      if (claimValue > 0) {
        if (formData.biaya_minimal > 0 && claimValue < formData.biaya_minimal) {
          setClaimError(
            `⚠️ Harga claim terlalu rendah! Minimal: Rp ${formatRupiah(formData.biaya_minimal)}`,
          );
        } else if (
          formData.biaya_maksimal > 0 &&
          claimValue > formData.biaya_maksimal
        ) {
          setClaimError(
            `⚠️ Harga claim melebihi batas! Maksimal: Rp ${formatRupiah(formData.biaya_maksimal)}`,
          );
        } else {
          setClaimError("");
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (claimError) {
      return;
    }

    try {
      const dataToSend = {
        id_program: selectedProgram || formData.id_program,
        nama_item: formData.nama_item,
        jumlah: 1,
        harga_satuan: formData.harga_claim,
        keterangan: formData.keterangan,
      };

      if (editingId) {
        await API.put(`/rab/${editingId}`, dataToSend);
        swalSukses("Berhasil!", "Item RAB berhasil diubah");
      } else {
        await API.post("/rab", dataToSend);
        swalSukses("Berhasil!", "Item RAB berhasil ditambahkan");
      }

      setShowModal(false);
      resetForm();
      fetchRABList();
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      swalError("Gagal!", "Gagal menghapus data. Silakan coba lagi.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus item RAB ini?")) {
      try {
        await API.delete(`/rab/${id}`);
        swalSukses("Berhasil!", "Item RAB berhasil dihapus");
        fetchRABList();
      } catch (error) {
        console.error("Gagal menghapus:", error);
        swalError("Gagal!", "Gagal menghapus data. Silakan coba lagi.");
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      id_program: "",
      id_biaya: "",
      nama_item: "",
      biaya_minimal: 0,
      biaya_maksimal: 0,
      harga_claim: 0,
      keterangan: "",
    });
    setDisplayHargaClaim("");
    setClaimError("");
    setFormErrors({});
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (rab) => {
    setEditingId(rab.id_rab);
    setFormData({
      id_program: rab.id_program,
      id_biaya: "",
      nama_item: rab.nama_item,
      biaya_minimal: 0,
      biaya_maksimal: 0,
      harga_claim: parseFloat(rab.harga_satuan),
      keterangan: rab.keterangan || "",
    });
    setDisplayHargaClaim(formatNominal(parseFloat(rab.harga_satuan)));
    setClaimError("");
    setFormErrors({});
    setShowModal(true);
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  const totalRAB = filteredRAB.reduce((sum, item) => {
    return sum + (parseFloat(item.harga_satuan) || 0);
  }, 0);

  const getNamaProgram = (id) => {
    return (
      programList.find((p) => p.id_program == id)?.nama_program ||
      "Tidak Diketahui"
    );
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Memuat data RAB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 px-md-4 py-3 w-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h1 className="text-primary h4 mb-0">💰 Kelola RAB Program Kerja</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-nowrap small">
            Halo, <strong>{user.nama_lengkap}</strong>
          </span>
          <span className="badge bg-secondary small">{user.role}</span>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className="btn btn-outline-warning btn-sm"
            onClick={() => onNavigate("program-kerja")}
          >
            📋 Program Kerja
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body py-2 px-3">
          <div className="row align-items-end g-2">
            <div className="col-md-8">
              <label className="form-label small fw-bold mb-1">
                Filter Program Kerja
              </label>
              <select
                className="form-select form-select-sm"
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
              >
                <option value="">-- Pilih Program --</option>
                {programList.map((prog) => (
                  <option key={prog.id_program} value={prog.id_program}>
                    {prog.nama_program} ({prog.periode || "-"}) -{" "}
                    {prog.status_program || "?"}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 text-end">
              <button
                className="btn btn-success btn-sm w-100"
                onClick={openAddModal}
                disabled={!selectedProgram}
              >
                ➕ Tambah Item RAB
              </button>
            </div>
          </div>
          {selectedProgram && (
            <small className="text-muted">
              📂 {getNamaProgram(selectedProgram)} | Periode:{" "}
              {programList.find((p) => p.id_program == selectedProgram)
                ?.periode || "-"}
            </small>
          )}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 h6">
            📋 Daftar RAB{" "}
            {selectedProgram ? `- ${getNamaProgram(selectedProgram)}` : ""}
          </h5>
          <span className="badge bg-light text-dark small">
            {filteredRAB.length} item
          </span>
        </div>
        <div className="card-body p-2 p-md-3">
          {!selectedProgram ? (
            <div className="text-center py-4 text-muted small">
              👆 Pilih program kerja terlebih dahulu untuk melihat RAB
            </div>
          ) : filteredRAB.length === 0 ? (
            <div className="text-center py-4">
              <span className="fs-3">📭</span>
              <p className="text-muted small mt-2">
                Belum ada item RAB untuk program ini
              </p>
              <button className="btn btn-success btn-sm" onClick={openAddModal}>
                ➕ Tambah Item RAB
              </button>
            </div>
          ) : (
            <>
              {/* ✅ TABEL DENGAN KOLOM KETERANGAN */}
              <table className="table table-bordered table-hover align-middle mb-0 w-100">
                <thead className="table-light text-center small">
                  <tr>
                    <th style={{ width: "4%" }}>No</th>
                    <th style={{ width: "18%" }}>Item Biaya</th>
                    <th style={{ width: "13%" }}>Harga Minimal</th>
                    <th style={{ width: "13%" }}>Harga Maksimal</th>
                    <th style={{ width: "13%" }}>Harga Claim</th>
                    <th style={{ width: "8%" }}>Status</th>
                    <th style={{ width: "18%" }}>Keterangan</th>
                    <th style={{ width: "13%" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRAB.map((rab, index) => {
                    const biayaInfo = katalogBiaya.find(
                      (k) => k.nama_biaya === rab.nama_item,
                    );
                    const minimal = biayaInfo
                      ? parseFloat(biayaInfo.biaya_minimal)
                      : 0;
                    const maksimal = biayaInfo
                      ? parseFloat(biayaInfo.biaya_maksimal)
                      : 0;
                    const claim = parseFloat(rab.harga_satuan) || 0;
                    const isValid =
                      !biayaInfo || (claim >= minimal && claim <= maksimal);

                    return (
                      <tr
                        key={rab.id_rab}
                        className={!isValid ? "table-warning" : ""}
                      >
                        <td className="text-center small">{index + 1}</td>
                        <td>
                          <strong className="small">{rab.nama_item}</strong>
                        </td>
                        <td className="text-end small">
                          {formatRupiah(minimal)}
                        </td>
                        <td className="text-end small">
                          {formatRupiah(maksimal)}
                        </td>
                        <td className="text-end small">
                          {formatRupiah(claim)}
                        </td>
                        <td className="text-center">
                          {biayaInfo ? (
                            isValid ? (
                              <span className="badge bg-success small">
                                ✅ Valid
                              </span>
                            ) : (
                              <span className="badge bg-warning text-dark small">
                                ⚠️ Tidak Valid
                              </span>
                            )
                          ) : (
                            <span className="badge bg-secondary small">
                              Manual
                            </span>
                          )}
                        </td>
                        {/* ✅ Kolom Keterangan BARU */}
                        <td className="small">
                          {rab.keterangan ? (
                            <span title={rab.keterangan}>
                              {rab.keterangan.length > 40
                                ? rab.keterangan.substring(0, 40) + "..."
                                : rab.keterangan}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => openEditModal(rab)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(rab.id_rab)}
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="4" className="text-end fw-bold small">
                      Total RAB:
                    </td>
                    <td className="text-end fw-bold small">
                      {formatRupiah(totalRAB)}
                    </td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title h6">
                  {editingId ? "✏️ Edit Item RAB" : "➕ Tambah Item RAB"}
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
                    <label className="form-label small fw-bold">
                      Program Kerja
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light"
                      value={getNamaProgram(selectedProgram)}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Pilih Item Biaya <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-sm ${formErrors.id_biaya ? "border-danger" : ""} ${editingId ? "bg-light" : ""}`}
                      name="id_biaya"
                      value={formData.id_biaya}
                      onChange={handleChange}
                      required
                      disabled={editingId !== null}
                    >
                      <option value="">
                        {editingId
                          ? formData.nama_item || "Item biaya"
                          : "-- Pilih dari Katalog Biaya --"}
                      </option>
                      {katalogBiaya.map((biaya) => (
                        <option key={biaya.id_biaya} value={biaya.id_biaya}>
                          {biaya.nama_biaya}
                        </option>
                      ))}
                    </select>
                    {editingId && (
                      <small className="text-muted">
                        🔒 Item biaya tidak dapat diubah saat edit
                      </small>
                    )}
                    {formErrors.id_biaya && (
                      <small className="text-danger">
                        ❌ {formErrors.id_biaya}
                      </small>
                    )}
                    {formErrors.id_biaya && (
                      <small className="text-danger">
                        ❌ {formErrors.id_biaya}
                      </small>
                    )}
                  </div>

                  {formData.id_biaya && (
                    <div className="row mb-3">
                      <div className="col-6">
                        <div className="card bg-light border-success">
                          <div className="card-body py-2 px-3 text-center">
                            <small className="text-muted d-block">
                              📌 Biaya Minimal
                            </small>
                            <strong className="text-success">
                              {formatRupiah(formData.biaya_minimal)}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="card bg-light border-danger">
                          <div className="card-body py-2 px-3 text-center">
                            <small className="text-muted d-block">
                              📌 Biaya Maksimal
                            </small>
                            <strong className="text-danger">
                              {formatRupiah(formData.biaya_maksimal)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Harga Claim (Rp) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${claimError || formErrors.harga_claim ? "border-danger" : formData.harga_claim > 0 && !claimError ? "border-success" : ""}`}
                      name="harga_claim"
                      value={displayHargaClaim}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        const allowedKeys = [
                          "Backspace",
                          "Delete",
                          "ArrowLeft",
                          "ArrowRight",
                          "Tab",
                          "Home",
                          "End",
                          "0",
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                        ];
                        if (
                          !allowedKeys.includes(e.key) &&
                          !e.ctrlKey &&
                          !e.metaKey
                        )
                          e.preventDefault();
                      }}
                      required
                      placeholder="Masukkan harga claim, titik muncul otomatis"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    {claimError ? (
                      <small className="text-danger">{claimError}</small>
                    ) : formErrors.harga_claim ? (
                      <small className="text-danger">
                        ❌ {formErrors.harga_claim}
                      </small>
                    ) : (
                      <small className="text-muted">
                        ✍️ Ketik angka, titik muncul otomatis
                      </small>
                    )}
                    {!claimError &&
                      formData.harga_claim > 0 &&
                      formData.biaya_minimal > 0 && (
                        <small className="text-success">
                          ✅ Harga claim dalam rentang yang diizinkan
                        </small>
                      )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Keterangan
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      name="keterangan"
                      rows="2"
                      value={formData.keterangan}
                      onChange={handleChange}
                      placeholder="Keterangan tambahan (opsional)"
                    />
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowModal(false)}
                  >
                    ❌ Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!!claimError}
                  >
                    {editingId ? "💾 Simpan Perubahan" : "💾 Tambah Item"}
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

export default KelolaRABDinamis;
