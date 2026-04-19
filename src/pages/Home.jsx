import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { ref, get } from 'firebase/database';
import { useCart } from '../context/CartContext';
import { useError } from '../context/ErrorContext';

// Helper function to calculate distance using Haversine formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;  
  const dLon = (lon2 - lon1) * Math.PI / 180; 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
};

const Home = () => {
  const [allStores, setAllStores] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [addressInput, setAddressInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const { cartItems, setIsCartOpen } = useCart();
  const { showError } = useError();
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesRef = ref(db, 'stores');
        const storesSnap = await get(storesRef);
        
        if (storesSnap.exists()) {
          const storesData = storesSnap.val();
          const storesList = Object.keys(storesData).map(key => ({
            id: key,
            ...storesData[key]
          }));
          setAllStores(storesList);
          setStores(storesList);
        } else {
          setAllStores([]);
          setStores([]);
        }
      } catch (err) {
        console.error("Error fetching stores:", err);
        showError("Failed to fetch stores. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  // Filter stores whenever userLocation changes
  useEffect(() => {
    if (userLocation) {
      const storesWithDistance = allStores.map(store => {
        const dist = getDistance(userLocation.lat, userLocation.lon, store.lat, store.lon);
        return { ...store, distance: dist };
      });
      // Sort by distance and filter out those without location or too far (e.g., > 50km)
      const nearbyStores = storesWithDistance
        .filter(store => store.distance !== null && store.distance <= 50)
        .sort((a, b) => a.distance - b.distance);
        
      setStores(nearbyStores);
    } else {
      setStores(allStores);
    }
  }, [userLocation, allStores]);

  const handleUseMyLocation = () => {
    setIsLocating(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        setIsLocating(false);
      },
      () => {
        setLocationError("Unable to retrieve your location.");
        setIsLocating(false);
      }
    );
  };

  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!addressInput) return;
    setIsLocating(true);
    setLocationError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setUserLocation({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
      } else {
        setLocationError("Address not found.");
      }
    } catch (err) {
      setLocationError("Failed to find address.");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm p-4 px-6 flex justify-between items-center transition-colors">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">VendToCust</h1>
        <Link 
          to="/login" 
          className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium"
        >
          Vendor Login
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-start text-center p-6 mt-8 md:mt-12">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
          Find What You Need, <span className="text-blue-600 dark:text-blue-400">Right Next Door.</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl leading-relaxed">
          Check real-time inventory from your favorite local shops. Guarantee your items are ready for pickup before you even leave the house.
        </p>

        {/* Location Section */}
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-transparent dark:border-gray-700 mb-12 transition-colors">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Find Stores Near You</h3>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <button 
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="bg-green-600 dark:bg-green-500 text-white px-6 py-3 rounded-2xl hover:bg-green-700 dark:hover:bg-green-600 transition font-bold shadow-sm w-full md:w-auto"
            >
              {isLocating ? 'Locating...' : '📍 Use My Location'}
            </button>
            <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-sm">OR</span>
            <form onSubmit={handleAddressSearch} className="flex w-full md:w-auto shadow-sm rounded-2xl overflow-hidden">
              <input 
                type="text" 
                placeholder="Enter city or zip code..." 
                className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-0 w-full md:w-64 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={addressInput}
                onChange={e => setAddressInput(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 hover:bg-blue-700 dark:hover:bg-blue-600 font-bold transition">Search</button>
            </form>
          </div>
          {locationError && <p className="text-red-500 dark:text-red-400 mt-4 font-medium">{locationError}</p>}
          {userLocation && !locationError && <p className="text-green-600 dark:text-green-400 mt-4 font-bold">Showing stores within 50km radius.</p>}
        </div>

        {/* Dynamic Stores List */}
        <div className="w-full max-w-4xl">
          <h3 className="text-2xl font-bold mb-8 text-left text-gray-900 dark:text-white">{userLocation ? 'Nearby Stores' : 'All Stores'}</h3>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse"></div>)}
            </div>
          ) : stores.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-left bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm text-lg">No stores found. Be the first to register as a vendor!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {stores.map(store => (
                <Link 
                  key={store.id} 
                  to={`/store/${store.id}`}
                  className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 block group"
                >
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{store.name}</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 leading-relaxed">{store.description}</p>
                  {store.distance !== undefined && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-bold mt-3 bg-green-50 dark:bg-green-900/30 inline-block px-3 py-1 rounded-lg">📍 {store.distance.toFixed(1)} km away</p>
                  )}
                  <div className="mt-5 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center">
                    View Store <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

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

export default Home;