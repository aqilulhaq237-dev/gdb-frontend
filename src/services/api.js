import axios from 'axios';

const API = axios.create({
  baseURL: 'https://gdb-backend-production-4dd1.up.railway.app',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default API;