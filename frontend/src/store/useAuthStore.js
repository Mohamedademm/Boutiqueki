import { create } from 'zustand';
import api from '../utils/axios';

const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem('token'));

const readAuthPayload = (response) => {
  const payload = response.data?.data || {};
  return {
    token: payload.token || response.data?.token,
    user: payload.data || payload.user || null,
  };
};

const useAuthStore = create((set) => ({
  user: null,
  token: getToken(),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Set loading state
  setLoading: (loading) => set({ isLoading: loading }),

  // Set user data
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Load user from token
  loadUser: async () => {
    const token = getToken();
    
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true });
      // Set auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const res = await api.get('/auth/me');
      
      set({
        isAuthenticated: true,
        token: getToken(),
        user: res.data.data,
        isLoading: false,
      });
    } catch (err) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      set({
        token: null,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: err.response?.data?.message || 'Session expired',
      });
    }
  },

  // Register user
  register: async (formData) => {
    try {
      set({ isLoading: true, error: null });
      
      const res = await api.post('/auth/register', formData);
      const { token, user } = readAuthPayload(res);
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({
        token,
        isAuthenticated: true,
        user,
        isLoading: false,
      });
      
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
      return false;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = readAuthPayload(res);
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({
        token,
        isAuthenticated: true,
        user,
        isLoading: false,
      });
      
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Invalid credentials',
        isLoading: false,
      });
      return false;
    }
  },

  // Login / register with a Google ID token (credential from @react-oauth/google)
  loginWithGoogle: async (credential) => {
    try {
      set({ isLoading: true, error: null });

      const res = await api.post('/auth/google', { credential });
      const { token, user } = readAuthPayload(res);

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        token,
        isAuthenticated: true,
        user,
        isLoading: false,
      });

      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Google authentication failed',
        isLoading: false,
      });
      return false;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Local logout should still happen even if the API session already expired.
    }
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({
      token: null,
      isAuthenticated: false,
      user: null,
      error: null,
    });
  },
  
  // Clear errors
  clearError: () => set({ error: null }),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}

export default useAuthStore;
