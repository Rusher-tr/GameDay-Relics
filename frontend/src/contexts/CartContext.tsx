import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => 'added' | 'already_in_cart';
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'gameday_relics_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  // Load cart from localStorage on mount
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [items]);

  const addToCart = (product: Product): 'added' | 'already_in_cart' => {
    const existing = items.find((item) => item._id === product._id);

    if (existing) {
      // Product already in cart, don't add duplicate
      return 'already_in_cart';
    }

    // Add new product with quantity of 1 (no duplicates allowed)
    setItems((prev) => [...prev, { ...product, quantity: 1 }]);
    return 'added';
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item._id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, clearCart, getTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
