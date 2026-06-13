import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';

export const useProducts = (shopId, filters = {}) => {
  return useQuery({
    queryKey: ['products', shopId, filters],
    queryFn: async () => {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
      );
      const params = new URLSearchParams(cleanFilters).toString();
      const { data } = await api.get(`/shops/${shopId}/products${params ? `?${params}` : ''}`);
      return data.data;
    },
    enabled: !!shopId,
  });
};

export const useProduct = (shopId, productId) => {
  return useQuery({
    queryKey: ['product', shopId, productId],
    queryFn: async () => {
      const { data } = await api.get(`/shops/${shopId}/products/${productId}`);
      return data.data;
    },
    enabled: !!shopId && !!productId,
  });
};

export const useCreateProduct = (shopId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productData) => {
      const { data } = await api.post(`/shops/${shopId}/products`, productData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
    },
  });
};

export const useUpdateProduct = (shopId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...productData }) => {
      const { data } = await api.put(`/shops/${shopId}/products/${id}`, productData);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: ['product', shopId, variables.id] });
    },
  });
};

export const useDeleteProduct = (shopId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/shops/${shopId}/products/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
    },
  });
};
