import { useQuery } from '@tanstack/react-query';
import api from '../utils/axios';

// Real aggregated order stats for the owner dashboard.
export const useShopStats = (shopId) => {
  return useQuery({
    queryKey: ['shop', shopId, 'stats'],
    enabled: !!shopId,
    queryFn: async () => {
      const { data } = await api.get(`/shops/${shopId}/stats`);
      return data.data;
    },
  });
};

// Rich analytics (revenue/orders time series, best-sellers, status breakdown).
export const useShopAnalytics = (shopId, period = 30) => {
  return useQuery({
    queryKey: ['shop', shopId, 'analytics', period],
    enabled: !!shopId,
    queryFn: async () => {
      const { data } = await api.get(`/shops/${shopId}/analytics?period=${period}`);
      return data.data;
    },
  });
};
