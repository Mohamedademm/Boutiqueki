import axios from 'axios';

// In dev, '/api' is proxied to the backend by Vite. In production, set
// VITE_API_URL to the deployed backend origin (e.g. https://api.example.com/api).
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Request interceptor to add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for catching 401 errors and refreshing tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops if refresh token endpoint itself fails with 401
    if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/logout') {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token using the httpOnly cookie
        const res = await axios.post(`${API_BASE}/auth/refresh`, {}, {
          withCredentials: true
        });

        const newToken = res.data?.data?.token || res.data?.token;
        
        if (newToken) {
          // Update the token in localStorage
          localStorage.setItem('token', newToken);
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          
          // Update the failed request's auth header and retry it
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear everything and force logout
        localStorage.removeItem('token');
        // We trigger a custom event so the store can listen to it and update the state
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
