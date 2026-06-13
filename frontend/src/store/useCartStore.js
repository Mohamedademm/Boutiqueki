import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      shopId: null, // Track which shop's cart this is

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, quantity = 1, variants = {}, variantId = null) => {
        set((state) => {
          // If adding from a different shop, clear cart or warn (we'll auto-clear for simplicity)
          let currentItems = state.items;
          let currentShopId = state.shopId;

          if (currentShopId && currentShopId !== product.shopId) {
            currentItems = []; // clear cart
          }
          currentShopId = product.shopId;

          const existingItemIndex = currentItems.findIndex(
            (item) =>
              item.id === product.id &&
              (item.variantId || null) === (variantId || null)
          );

          if (existingItemIndex !== -1) {
            // Update quantity
            const newItems = [...currentItems];
            newItems[existingItemIndex].quantity += quantity;
            return { items: newItems, shopId: currentShopId, isOpen: true };
          } else {
            // Add new item
            return {
              items: [...currentItems, { ...product, quantity, selectedVariants: variants, variantId }],
              shopId: currentShopId,
              isOpen: true
            };
          }
        });
      },

      removeItem: (index) => {
        set((state) => {
          const newItems = [...state.items];
          newItems.splice(index, 1);
          return { items: newItems, shopId: newItems.length === 0 ? null : state.shopId };
        });
      },

      updateQuantity: (index, newQuantity) => {
        set((state) => {
          if (newQuantity < 1) return state;
          const newItems = [...state.items];
          newItems[index].quantity = newQuantity;
          return { items: newItems };
        });
      },

      clearCart: () => set({ items: [], shopId: null }),

      getCartTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getCartCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'boutiqueki-cart',
    }
  )
);

export default useCartStore;
