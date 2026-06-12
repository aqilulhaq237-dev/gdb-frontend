import axios from 'axios';

const API = axios.create({
  baseURL: 'https://gdb-backend-production-4dd1.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==================== INTERCEPTOR: OTOMATIS TAMBAH ID_PENGGUNA ====================

API.interceptors.request.use((config) => {
  // Ambil data user dari localStorage
  const userData = localStorage.getItem('user');
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      
      // Hanya untuk metode POST, PUT, DELETE
      if (['post', 'put', 'delete'].includes(config.method.toLowerCase()) && user.id_user) {
        
        // ✅ POST & PUT: tambahkan ke body/data
        if (['post', 'put'].includes(config.method.toLowerCase())) {
          if (config.data instanceof FormData) {
            // Jika FormData (upload file)
            config.data.append('id_pengguna', user.id_user);
          } else if (typeof config.data === 'object' && config.data !== null) {
            // Jika JSON
            config.data.id_pengguna = user.id_user;
          } else if (!config.data) {
            // Jika tidak ada data
            config.data = { id_pengguna: user.id_user };
          }
        }
        
        // ✅ DELETE: tambahkan ke params atau data
        if (config.method.toLowerCase() === 'delete') {
          // Kirim sebagai query params
          if (!config.params) config.params = {};
          config.params.id_pengguna = user.id_user;
        }
      }
    } catch (e) {
      console.warn('Gagal parse user dari localStorage:', e);
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;