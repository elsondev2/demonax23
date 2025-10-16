import axios from "axios";

// Use environment variable for API URL or fallback to localhost
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

console.log("API Base URL:", BASE_URL); // For debugging

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // this is required for authentication cookies
});

// Add a request interceptor to add Authorization header and handle errors
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage and add to Authorization header
    const token = localStorage.getItem('jwt-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log("Request error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle network errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      // Network error
      console.log("Network error - server may be down or unreachable");
    }
    return Promise.reject(error);
  }
);