import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';

export const useStock = (shopId) => {
  return useQuery({
    queryKey: ['stock', shopId],
    queryFn: async () => {
      const { data } = await api.get(`/shops/${shopId}/stock`);
      return data.data;
    },
    enabled: !!shopId,
  });
};

export const useStockAlerts = (shopId) => {
  return useQuery({
    queryKey: ['stock', shopId, 'alerts'],
    queryFn: async () => {
      const { data } = await api.get(`/shops/${shopId}/stock/alerts`);
      return data.data;
    },
    enabled: !!shopId,
  });
};

export const useCreateStockMovement = (shopId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movementData) => {
      const { data } = await api.post(`/shops/${shopId}/stock/movement`, movementData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', shopId] });
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: ['product', shopId] }); // invalidate all product details
    },
  });
};

export const useStockHistory = (shopId, productId) => {
  return useQuery({
    queryKey: ['stock', shopId, productId, 'history'],
    queryFn: async () => {
      const { data } = await api.get(`/shops/${shopId}/stock/${productId}/history`);
      return data.data;
    },
    enabled: !!shopId && !!productId,
  });
};
