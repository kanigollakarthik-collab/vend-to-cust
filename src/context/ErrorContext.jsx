import React, { createContext, useContext, useState, useCallback } from 'react';

const ErrorContext = createContext();

export const useError = () => useContext(ErrorContext);

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const showError = useCallback((message) => {
    setError(message);
    setTimeout(() => {
      setError(null);
    }, 5000); // Hide error after 5 seconds
  }, []);

  const clearError = () => setError(null);

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}
      {/* Global Error Toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] max-w-md w-[90vw] animate-bounce-short">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex justify-between items-center border-2 border-red-700/50">
            <span className="font-semibold text-sm mr-4">{error}</span>
            <button 
              onClick={clearError}
              className="text-red-200 hover:text-white transition font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  );
};
