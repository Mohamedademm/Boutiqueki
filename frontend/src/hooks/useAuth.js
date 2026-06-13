import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';

export const useAuth = () => {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/auth/me');
        return data.data;
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials) => {
      const { data } = await api.post('/auth/login', credentials);
      if (data.data.token) {
        localStorage.setItem('boutiki_token', data.data.token);
      }
      return data.data.data;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['auth', 'user'], userData);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData) => {
      const { data } = await api.post('/auth/register', userData);
      if (data.data.token) {
        localStorage.setItem('boutiki_token', data.data.token);
      }
      return data.data.data;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['auth', 'user'], userData);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
      localStorage.removeItem('boutiki_token');
    },
    onSettled: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
      window.location.href = '/login';
    },
  });
};
