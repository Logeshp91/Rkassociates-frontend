import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://rkassociates.onrender.com/api',
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
