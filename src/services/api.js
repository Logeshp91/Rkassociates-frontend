import axios from 'axios';

const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

function getDefaultApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'https://rkassociates.onrender.com/api';
  }

  const { hostname } = window.location;
  const configuredApiUrl = (viteEnv.VITE_API_URL || '').trim();
  const isLocalConfiguredUrl = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(configuredApiUrl);

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return configuredApiUrl || 'http://localhost:5000/api';
  }

  if (configuredApiUrl && !isLocalConfiguredUrl) {
    return configuredApiUrl;
  }

  return 'https://rkassociates.onrender.com/api';
}

const api = axios.create({
  baseURL: getDefaultApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

export function requestPasswordReset(username) {
  return api.post('/auth/forgot-password', { username });
}

export function resetPassword({ username, otp, password, confirmPassword }) {
  return api.post('/auth/reset-password', {
    username,
    otp,
    password,
    confirmPassword
  });
}

export default api;
