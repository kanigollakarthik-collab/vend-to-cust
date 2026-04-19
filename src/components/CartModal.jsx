import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useError } from '../context/ErrorContext';
import { db } from '../services/firebase';
import { ref, runTransaction } from 'firebase/database';

const CartModal = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen } = useCart();
  const { showError } = useError();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  if (!isCartOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    let allSuccessful = true;
    
    // Process each item in a transaction
    for (const item of cartItems) {
      const itemRef = ref(db, `inventory/${item.storeId}/${item.id}/stock`);
      
      try {
        const result = await runTransaction(itemRef, (currentStock) => {
          if (currentStock === null) return currentStock; // Item doesn't exist
          if (currentStock >= item.quantity) {
            return currentStock - item.quantity;
          } else {
            return; // Abort transaction if insufficient stock
          }
        });

        if (!result.committed) {
          allSuccessful = false;
          showError(`Insufficient stock for ${item.name}. Checkout aborted for remaining items.`);
          break;
        }
      } catch (err) {
        console.error("Transaction failed: ", err);
        allSuccessful = false;
        showError(`Network error while checking out ${item.name}.`);
        break;
      }
    }

    setIsCheckingOut(false);
    
    if (allSuccessful) {
      setCheckoutSuccess(true);
      clearCart();
      setTimeout(() => {
        setCheckoutSuccess(false);
        setIsCartOpen(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* Cart Drawer */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col transition-colors border-l border-transparent dark:border-gray-700">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Cart</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {checkoutSuccess ? (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-6 rounded-2xl text-center font-bold text-lg shadow-sm">
              🎉 Order placed successfully!
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center mt-10 font-medium text-lg">Your cart is empty.</div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div key={`${item.storeId}-${item.id}`} className="flex justify-between items-center border-b dark:border-gray-700 pb-5">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{item.storeName}</p>
                    <p className="text-blue-600 dark:text-blue-400 font-bold">₹{item.price}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, item.storeId, item.quantity - 1)}
                        className="px-4 py-1 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-gray-700 dark:text-gray-200 transition-colors"
                      >-</button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.storeId, item.quantity + 1)}
                        className="px-4 py-1 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-gray-700 dark:text-gray-200 transition-colors"
                      >+</button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id, item.storeId)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium hover:underline transition-colors"
                    >Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && !checkoutSuccess && (
          <div className="p-8 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-colors">
            <div className="flex justify-between font-bold text-xl mb-6 text-gray-900 dark:text-white">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition shadow-lg text-lg"
            >
              {isCheckingOut ? 'Processing...' : 'Checkout & Pay'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
