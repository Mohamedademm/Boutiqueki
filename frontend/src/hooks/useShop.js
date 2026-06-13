import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';

export const useShop = () => {
  return useQuery({
    queryKey: ['shop', 'me'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/shops/me');
        return data.data;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });
};

export const useCreateShop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopData) => {
      const { data } = await api.post('/shops', shopData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'me'] });
    },
  });
};

export const useUpdateShop = (shopId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopData) => {
      const { data } = await api.put(`/shops/${shopId}`, shopData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'me'] });
    },
  });
};
