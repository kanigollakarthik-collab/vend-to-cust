import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { ref, get, set, push, update, remove, onValue } from 'firebase/database';
import { useError } from '../context/ErrorContext';

const VendorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [storeProfile, setStoreProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  
  // Profile creation state
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [vendorLat, setVendorLat] = useState(null);
  const [vendorLon, setVendorLon] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  
  // Item addition state
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  
  const { showError } = useError();

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribe;

    const fetchStoreData = async () => {
      setLoading(true);
      setDbError(null);
      
      // Setup a timeout to catch hanging RTDB connections
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setDbError("Connection to database timed out. Please check your network and Firebase status.");
      }, 8000);

      try {
        const storeRef = ref(db, `stores/${currentUser.uid}`);
        const storeSnap = await get(storeRef);
        
        clearTimeout(timeoutId);
        
        if (storeSnap.exists()) {
          setStoreProfile({ id: currentUser.uid, ...storeSnap.val() });
          
          // Setup listener for inventory items
          const itemsRef = ref(db, `inventory/${currentUser.uid}`);
          unsubscribe = onValue(itemsRef, (snapshot) => {
            const itemsData = snapshot.val();
            if (itemsData) {
              const itemsList = Object.keys(itemsData).map(key => ({
                id: key,
                ...itemsData[key]
              }));
              setInventory(itemsList);
            } else {
              setInventory([]);
            }
          }, (error) => {
             console.error("Snapshot error:", error);
             showError(error.message);
          });
        } else {
          setStoreProfile(null);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("Error fetching store data:", err);
        showError(err.message);
        setDbError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setIsCreatingProfile(true);
    
    // Geocode address using Nominatim API if they didn't use the geolocation button
    let lat = vendorLat;
    let lon = vendorLon;
    
    if (!lat || !lon) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(storeAddress)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        } else {
          showError("Warning: Could not find exact location for that address/pincode. Store might not appear in local searches.");
        }
      } catch (err) {
        console.error("Geocoding failed", err);
        showError("Geocoding failed. Using default location behavior.");
      }
    }

    try {
      const storeRef = ref(db, `stores/${currentUser.uid}`);
      const newProfile = {
        name: storeName,
        description: storeDescription,
        address: storeAddress,
        lat: lat,
        lon: lon,
        createdAt: new Date().toISOString()
      };
      await set(storeRef, newProfile);
      setStoreProfile({ id: currentUser.uid, ...newProfile });
      
      // Initialize listener since profile was just created
      const itemsRef = ref(db, `inventory/${currentUser.uid}`);
      onValue(itemsRef, (snapshot) => {
        const itemsData = snapshot.val();
        if (itemsData) {
          const itemsList = Object.keys(itemsData).map(key => ({
            id: key,
            ...itemsData[key]
          }));
          setInventory(itemsList);
        } else {
          setInventory([]);
        }
      });
    } catch (err) {
      console.error("Error creating store profile:", err);
      showError("Failed to create profile. Check database rules.");
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !newItemStock) return;
    
    const itemsRef = ref(db, `inventory/${currentUser.uid}`);
    const newItemRef = push(itemsRef);
    set(newItemRef, {
      name: newItemName,
      price: parseFloat(newItemPrice),
      stock: parseInt(newItemStock, 10)
    }).catch(err => {
      console.error("Error adding item:", err);
      showError("Failed to add item");
    });
    
    // Clear form instantly for optimistic UI
    setNewItemName('');
    setNewItemPrice('');
    setNewItemStock('');
    setShowAddItemForm(false);
  };

  const handleUpdateStock = (itemId, currentStock, increment) => {
    const newStock = Math.max(0, currentStock + increment);
    const itemRef = ref(db, `inventory/${currentUser.uid}/${itemId}`);
    update(itemRef, { stock: newStock }).catch(err => {
      console.error("Error updating stock:", err);
      showError("Failed to update stock");
    });
  };

  const handleDeleteItem = (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    const itemRef = ref(db, `inventory/${currentUser.uid}/${itemId}`);
    remove(itemRef).catch(err => {
      console.error("Error deleting item:", err);
      showError("Failed to delete item");
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
      showError("Failed to log out.");
    }
  };

  const handleUseMyLocation = () => {
    setIsLocating(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setVendorLat(lat);
        setVendorLon(lon);
        
        // Reverse geocode to get a readable address
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.display_name) {
            setStoreAddress(data.display_name);
          } else {
            setStoreAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          }
        } catch (err) {
          setStoreAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
        setIsLocating(false);
      },
      () => {
        setLocationError("Unable to retrieve your location. Please type it manually.");
        setIsLocating(false);
      }
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 transition-colors">Loading dashboard... (Connecting to database)</div>;
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Database Error</h2>
        <p className="text-gray-700 dark:text-gray-300 max-w-md bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800/30">{dbError}</p>
        <button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition">Retry</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-transparent dark:border-gray-700 mb-8 transition-colors">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Vendor Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Logged in as: {currentUser?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold border-2 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-6 py-2.5 rounded-xl transition"
          >
            Log Out
          </button>
        </div>

        {/* Profile Creation / Main Dashboard */}
        {!storeProfile ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-transparent dark:border-gray-700 p-8 max-w-lg mx-auto transition-colors">
            <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Set up your Store</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">Create a profile so customers can easily find you locally.</p>
            <form onSubmit={handleCreateProfile}>
              <div className="mb-5">
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Store Name</label>
                <input 
                  type="text" required
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  value={storeName} onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div className="mb-5">
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Location (Address or Pincode)</label>
                <div className="flex flex-col gap-3">
                  <button 
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition w-full md:w-auto self-start font-bold border border-gray-200 dark:border-gray-600"
                  >
                    {isLocating ? 'Locating...' : '📍 Use My Current Location'}
                  </button>
                  {locationError && <p className="text-red-500 dark:text-red-400 text-sm font-medium">{locationError}</p>}
                  
                  <input 
                    type="text" required
                    placeholder="Or type address/pincode (e.g. 123 Main St, or 10001)"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    value={storeAddress} 
                    onChange={(e) => {
                      setStoreAddress(e.target.value);
                      setVendorLat(null);
                      setVendorLon(null);
                    }}
                  />
                </div>
              </div>
              <div className="mb-8">
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Description</label>
                <textarea 
                  required rows="3"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)}
                ></textarea>
              </div>
              <button 
                disabled={isCreatingProfile}
                type="submit" 
                className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 text-lg shadow-md hover:shadow-lg"
              >
                {isCreatingProfile ? 'Creating...' : 'Create Store'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-transparent dark:border-gray-700 p-8 transition-colors">
            <div className="mb-8 pb-8 border-b dark:border-gray-700">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{storeProfile.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">{storeProfile.description}</p>
            </div>

            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Active Inventory</h2>
              <button 
                onClick={() => setShowAddItemForm(!showAddItemForm)}
                className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-sm"
              >
                {showAddItemForm ? 'Cancel' : '+ Add Item'}
              </button>
            </div>

            {showAddItemForm && (
              <form onSubmit={handleAddItem} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl mb-8 border border-gray-200 dark:border-gray-700 transition-colors shadow-inner">
                <h3 className="font-bold text-lg mb-5 text-gray-900 dark:text-white">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Name</label>
                    <input type="text" required className="w-full p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Price (₹)</label>
                    <input type="number" required min="0" step="0.01" className="w-full p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Initial Stock</label>
                    <input type="number" required min="0" className="w-full p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={newItemStock} onChange={e => setNewItemStock(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="bg-green-600 dark:bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 dark:hover:bg-green-600 transition shadow-sm">Save Item</button>
              </form>
            )}

            {inventory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-12 text-lg">Your inventory is empty. Add items to start selling.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr className="border-b dark:border-gray-700">
                      <th className="py-4 px-6 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-sm">Item Name</th>
                      <th className="py-4 px-6 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-sm">Price (₹)</th>
                      <th className="py-4 px-6 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-sm">Stock Status</th>
                      <th className="py-4 px-6 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">{item.name}</td>
                        <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">₹{item.price}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                              item.stock > 0 ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400'
                            }`}>
                              {item.stock > 0 ? `${item.stock} in stock` : 'Out of Stock'}
                            </span>
                            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm">
                              <button onClick={() => handleUpdateStock(item.id, item.stock, -1)} className="px-3 py-1 font-bold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">-</button>
                              <button onClick={() => handleUpdateStock(item.id, item.stock, 1)} className="px-3 py-1 font-bold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">+</button>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold hover:underline transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default VendorDashboard;