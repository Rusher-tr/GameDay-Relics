import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true // This is important for handling cookies (accessToken and refreshToken)
});

// Add a response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 - let components handle auth errors
    // The auth is handled via httpOnly cookies, not localStorage
    return Promise.reject(error);
  }
);

export default api;