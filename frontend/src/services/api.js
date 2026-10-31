import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alnoor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login, clear token
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('alnoor_token');
        localStorage.removeItem('alnoor_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

