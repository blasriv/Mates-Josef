import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const exists = state.find(item => item.id === action.payload.id);
      if (exists) {
        if (exists.quantity >= action.payload.stock) {
          return state; // No hacer nada si ya se alcanzó el stock máximo.
        }
        return state.map(item => item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...state, { ...action.payload, quantity: 1 }];
    }
    case 'REMOVE_ONE': {
      const exists = state.find(item => item.id === action.payload);
      if (exists.quantity === 1) {
        return state.filter(item => item.id !== action.payload);
      }
      return state.map(item => item.id === action.payload ? { ...item, quantity: item.quantity - 1 } : item);
    }
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, [], () => {
    const localData = localStorage.getItem('cart');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => dispatch({ type: 'ADD_TO_CART', payload: product });
  const removeOne = (id) => dispatch({ type: 'REMOVE_ONE', payload: id });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider value={{ cart, addToCart, removeOne, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}