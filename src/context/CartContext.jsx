import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (item, storeId, storeName) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.storeId === storeId);
      if (existing) {
        // Check if we exceed stock (optional client-side check)
        if (existing.quantity >= item.stock) {
          alert('Cannot add more than available stock!');
          return prev;
        }
        return prev.map(i => 
          (i.id === item.id && i.storeId === storeId) 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      return [...prev, { ...item, storeId, storeName, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId, storeId) => {
    setCartItems(prev => prev.filter(i => !(i.id === itemId && i.storeId === storeId)));
  };

  const updateQuantity = (itemId, storeId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, storeId);
      return;
    }
    setCartItems(prev => prev.map(i => 
      (i.id === itemId && i.storeId === storeId) 
        ? { ...i, quantity: newQuantity } 
        : i
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
