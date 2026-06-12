import axios from 'axios';

const API = axios.create({
  baseURL: 'https://gdb-backend-production-4dd1.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.request.use((config) => {
  const userData = localStorage.getItem('user');
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      
      if (['post', 'put'].includes(config.method.toLowerCase()) && user.id_user) {
        if (config.data instanceof FormData) {
          config.data.append('id_pengguna', user.id_user);
        } else if (typeof config.data === 'object' && config.data !== null) {
          config.data.id_pengguna = user.id_user;
        } else if (!config.data) {
          config.data = { id_pengguna: user.id_user };
        }
      }
      
      // ✅ Kirim id_pengguna via query params untuk DELETE
      if (config.method.toLowerCase() === 'delete') {
        if (!config.params) config.params = {};
        config.params.id_pengguna = user.id_user;
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