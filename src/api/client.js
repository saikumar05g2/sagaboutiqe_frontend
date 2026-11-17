import axios from "axios";

const API_HOST = window.location.hostname || "localhost";
const BASE_URL = import.meta.env.VITE_API_URL || `http://${API_HOST}:5000/api`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("saga_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
