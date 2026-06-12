import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ProgramKerja from "./components/ProgramKerja";
import KelolaRABDinamis from "./components/KelolaRABDinamis";
import TransaksiKas from "./components/TransaksiKas";
import UpdateStatusProgram from "./components/UpdateStatusProgram";
import KonfirmasiTransaksi from "./components/KonfirmasiTransaksi";
import KelolaPeriodeAktif from "./components/KelolaPeriodeAktif";
import KelolaBiaya from "./components/KelolaBiaya";
import Profil from "./components/Profil";
import RiwayatPelaksanaan from "./components/RiwayatPelaksanaan";
import LihatLaporan from "./components/LihatLaporan";
import KelolaPengguna from "./components/KelolaPengguna";
import KelolaKategori from "./components/KelolaKategori";
import MonitorLog from "./components/MonitorLog";

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setCurrentPage("dashboard");
  };

  const handleSidebarToggle = (isOpen) => {
    setIsSidebarOpen(isOpen);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const pages = {
    dashboard: (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "program-kerja": (
      <ProgramKerja
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "kelola-rab": (
      <KelolaRABDinamis
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    transaksi: (
      <TransaksiKas
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "update-status": (
      <UpdateStatusProgram
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "konfirmasi-transaksi": (
      <KonfirmasiTransaksi
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "periode-aktif": (
      <KelolaPeriodeAktif
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "kelola-biaya": (
      <KelolaBiaya
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    profil: (
      <Profil
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
        onProfileUpdate={setUser}
      />
    ),
    riwayat: (
      <RiwayatPelaksanaan
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "lihat-laporan": (
      <LihatLaporan
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "kelola-user": (
      <KelolaPengguna
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "kelola-kategori": (
      <KelolaKategori
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "cetak-laporan": (
      <LihatLaporan
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
    "monitor-log": (
      <MonitorLog
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
    ),
  };

  const Content = pages[currentPage] || pages["dashboard"];
  const sidebarWidth = isSidebarOpen ? 280 : 70;

  return (
    <div className="d-flex">
      <Sidebar
        activeMenu={currentPage}
        onNavigate={setCurrentPage}
        user={user}
        onLogout={handleLogout}
        onToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className="flex-grow-1"
        style={{
          marginLeft: `${sidebarWidth}px`,
          padding: "20px",
          minHeight: "100vh",
          backgroundColor: "transparent",
          transition: "margin-left 0.3s ease",
        }}
      >
        {Content}
      </div>
    </div>
  );
}

export default App;
