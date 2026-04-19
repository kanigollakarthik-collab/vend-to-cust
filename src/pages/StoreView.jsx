import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { ref, get } from 'firebase/database';
import { useCart } from '../context/CartContext';
import { useError } from '../context/ErrorContext';

const StoreView = () => {
  const { storeId } = useParams();
  
  const [storeData, setStoreData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { addToCart, cartItems, setIsCartOpen } = useCart();
  const { showError } = useError();
  
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const storeRef = ref(db, `stores/${storeId}`);
        const storeSnap = await get(storeRef);
        
        if (storeSnap.exists()) {
          setStoreData(storeSnap.val());
          
          const itemsRef = ref(db, `inventory/${storeId}`);
          const itemsSnap = await get(itemsRef);
          
          if (itemsSnap.exists()) {
            const itemsData = itemsSnap.val();
            const itemsList = Object.keys(itemsData).map(key => ({
              id: key,
              ...itemsData[key]
            }));
            setItems(itemsList);
          } else {
            setItems([]);
          }
        } else {
          setError("Store not found.");
        }
      } catch (err) {
        console.error("Error fetching store:", err);
        showError("Failed to load store data.");
        setError("Failed to load store data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 transition-colors">Loading store details...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">{error}</h2>
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
          &larr; Return to nearby stores
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors">
      <div className="max-w-4xl mx-auto mt-8">
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold mb-6 inline-block transition-colors">
          &larr; Back to nearby stores
        </Link>
        
        {/* Store Header */}
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-lg border border-transparent dark:border-gray-700 mb-10 flex justify-between items-start transition-colors">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">{storeData.name}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">{storeData.description}</p>
          </div>
        </div>

        {/* Consumer Inventory View */}
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Available Items</h2>
        
        {items.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-transparent dark:border-gray-700 text-center text-lg transition-colors">This store hasn't added any items yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">₹{item.price}</p>
                </div>
                <div>
                  {item.stock > 0 ? (
                    <button 
                      onClick={() => addToCart(item, storeId, storeData.name)}
                      className="bg-green-600 dark:bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 dark:hover:bg-green-600 transition shadow-sm hover:scale-105"
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/30 px-4 py-2 rounded-xl">Out of Stock</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-2xl shadow-xl hover:bg-blue-700 dark:hover:bg-blue-600 hover:scale-105 transition flex items-center justify-center z-40"
      >
        <span className="mr-2 font-bold">Cart</span>
        {cartItemCount > 0 && (
          <span className="bg-white text-blue-600 dark:bg-gray-900 dark:text-blue-400 rounded-xl w-6 h-6 flex items-center justify-center font-bold text-xs">
            {cartItemCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default StoreView;