import React, { useState } from "react";
import API from "../services/api";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("⚠️ Username dan password harus diisi!");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/login", {
        username: username.trim(),
        password: password,
      });

      if (response.data.status === "success") {
        const userData = response.data.user;
        localStorage.setItem("user", JSON.stringify(userData));
        onLoginSuccess(userData);
      } else {
        setError("⚠️ " + (response.data.message || "Login gagal"));
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("⚠️ " + err.response.data.message);
      } else {
        setError("❌ Gagal terhubung ke server. Coba lagi nanti.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo & Judul */}
        <div className="text-center mb-4">
          <img 
            src="/Logo Game Developer Batam.png" 
            alt="Logo Game Developer Batam" 
            className="login-logo"
          />
          <h1 className="login-title">SISTEM MANAJEMEN KAS</h1>
          <p className="login-subtitle">GAME DEVELOPER BATAM</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-bold">
              <span className="me-1">👤</span> Username
            </label>
            <input
              type="text"
              className="form-control login-input"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">
              <span className="me-1">🔒</span> Password
            </label>
            <input
              type="password"
              className="form-control login-input"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn login-btn w-100 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Memproses...
              </>
            ) : (
              <>🔐 MASUK</>
            )}
          </button>
        </form>

        {error && (
          <div className="alert alert-danger mt-3 py-2 small text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;