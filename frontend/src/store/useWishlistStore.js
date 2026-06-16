import { create } from 'zustand';
import axios from '../utils/axios';

const useWishlistStore = create((set, get) => ({
  items: [],
  productIds: new Set(),
  isLoaded: false,

  loadWishlist: async () => {
    try {
      const res = await axios.get('/wishlist');
      const items = res.data.data || [];
      set({
        items,
        productIds: new Set(items.map(i => i.productId)),
        isLoaded: true,
      });
    } catch {
      set({ items: [], productIds: new Set(), isLoaded: true });
    }
  },

  toggleWishlist: async (productId) => {
    try {
      const res = await axios.post(`/wishlist/${productId}`);
      const { wishlisted } = res.data.data;
      const state = get();

      if (wishlisted) {
        const newIds = new Set(state.productIds);
        newIds.add(productId);
        set({ productIds: newIds });
      } else {
        const newIds = new Set(state.productIds);
        newIds.delete(productId);
        set({
          productIds: newIds,
          items: state.items.filter(i => i.productId !== productId),
        });
      }

      // Reload full list to keep items in sync
      get().loadWishlist();
    } catch {
      // silent
    }
  },

  isWishlisted: (productId) => get().productIds.has(productId),

  clearWishlist: () => set({ items: [], productIds: new Set(), isLoaded: false }),
}));

export default useWishlistStore;
