import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ErrorProvider } from './context/ErrorContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import CartModal from './components/CartModal';

// Page Imports
import Login from './pages/Login';
import Home from './pages/Home';
import VendorDashboard from './pages/VendorDashboard';
import StoreView from './pages/StoreView'; // The dynamic store page

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      className="fixed bottom-6 left-6 z-50 p-3 rounded-full shadow-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:scale-110 transition-transform"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ErrorProvider>
          <AuthProvider>
            <CartProvider>
              <Router>
                <ThemeToggle />
                <CartModal />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  
                  {/* Dynamic Public Route for individual stores */}
                  <Route path="/store/:storeId" element={<StoreView />} />

                  {/* Protected Vendor Routes */}
                  <Route 
                    path="/vendor/dashboard" 
                    element={
                      <ProtectedRoute>
                        <VendorDashboard />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </Router>
            </CartProvider>
          </AuthProvider>
        </ErrorProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;