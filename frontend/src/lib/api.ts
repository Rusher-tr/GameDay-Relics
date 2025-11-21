import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true // This is important for handling cookies (accessToken and refreshToken)
});

// Add a response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract backend error message from APIError response
    if (error.response?.data) {
      const backendError = error.response.data;

      // Check if response is HTML (backend sent an HTML error page)
      const isHTMLResponse = typeof backendError === 'string' && backendError.trim().startsWith('<');

      if (isHTMLResponse) {
        // Backend returned HTML error page - extract message from it or use default
        const match = backendError.match(/Error:\s*([^<\n]+)/);
        if (match && match[1]) {
          error.userMessage = match[1].trim();
        } else {
          // Couldn't extract message from HTML, use status-based message
          error.userMessage = null; // Will be set below
        }
      } else if (typeof backendError === 'object' && backendError.message) {
        // Backend APIError sends: { statusCode, message, success, errors }
        error.userMessage = backendError.message;
      } else if (Array.isArray(backendError.errors) && backendError.errors.length > 0) {
        // If there are validation errors array
        error.userMessage = backendError.errors.join(', ');
      } else if (typeof backendError === 'string' && !isHTMLResponse) {
        // Plain string error (not HTML)
        error.userMessage = backendError;
      }
    }

    // Add default message if no backend message available
    if (!error.userMessage) {
      if (error.response?.status === 401) {
        error.userMessage = 'Authentication required. Please sign in.';
      } else if (error.response?.status === 403) {
        error.userMessage = 'You do not have permission to perform this action.';
      } else if (error.response?.status === 404) {
        error.userMessage = 'Resource not found.';
      } else if (error.response?.status >= 500) {
        error.userMessage = 'Server error. Please try again later.';
      } else if (error.request) {
        error.userMessage = 'Network error. Please check your connection.';
      } else {
        error.userMessage = 'An unexpected error occurred.';
      }
    }

    // Log error for debugging
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.userMessage,
      data: typeof error.response?.data === 'string' && error.response.data.length > 200
        ? error.response.data.substring(0, 200) + '...'
        : error.response?.data
    });

    return Promise.reject(error);
  }
);

export default api;