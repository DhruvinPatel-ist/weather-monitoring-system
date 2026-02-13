// src/app/api/api.ts
import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Change to false if your API doesn't use cookies
});

// Add a request interceptor to attach token dynamically before each request
api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling unauthorized responses and logging
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("API Response:", response.status, response.data);
    }
    return response;
  },
  async (error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("API Error:", error.response?.status, error.response?.data);
    }

    // Check for unauthorized response (401)
    if (error.response?.status === 401) {
      // Unauthorized: token missing, invalid or expired
      console.log("Unauthorized request detected.");

      // Only dispatch the event in browser environment
      if (typeof window !== "undefined") {
        // Dispatch a custom event that can be listened to in client components
        window.dispatchEvent(new CustomEvent("unauthorizedError"));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
