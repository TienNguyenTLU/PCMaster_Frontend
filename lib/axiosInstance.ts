import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});


axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);


axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const hadToken = !!localStorage.getItem("authToken");

      
      const { forceLogout } = await import("@/lib/store");
      forceLogout();

      if (hadToken) {
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 300);
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
