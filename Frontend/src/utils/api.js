import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8519/api",
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("adminToken") || sessionStorage.getItem("userToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const wasAdmin = !!sessionStorage.getItem("adminToken");
      sessionStorage.clear();
      window.location.href = wasAdmin ? "/admin/login" : "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
