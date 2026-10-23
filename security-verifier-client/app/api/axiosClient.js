import axios from "axios";
import { getApiUrl } from "../utils/apiUrl";

/* ================= CONFIG ================= */

const BASE_URL = getApiUrl();

/* ================= CLIENT ================= */

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */

axiosClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        // Never trigger reload if already on login or root
        if (currentPath !== "/login" && currentPath !== "/") {
          console.warn("Unauthorized - redirecting to login");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
