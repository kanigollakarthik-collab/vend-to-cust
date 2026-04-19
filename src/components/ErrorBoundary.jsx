import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-lg w-full border dark:border-gray-700">
            <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Something went wrong.</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              An unexpected error occurred in the application. Please try refreshing the page.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-left overflow-auto max-h-48 mb-6 border border-red-100 dark:border-red-800/30">
              <code className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                {this.state.error && this.state.error.toString()}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition w-full"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
