import { useQuery } from '@tanstack/react-query';
import api from '../utils/axios';

export const useCategories = (shopId) => {
  return useQuery({
    queryKey: ['categories', shopId],
    queryFn: async () => {
      const { data } = await api.get(`/shops/${shopId}/categories`);
      return data.data;
    },
    enabled: !!shopId,
  });
};

