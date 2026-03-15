import axios from "axios";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";

const resolveTimeoutMs = () => {
  const raw = import.meta.env.VITE_API_TIMEOUT;
  const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
};

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api", // 如果未设置，默认为 /api
  timeout: resolveTimeoutMs(),
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.token) {
      // 检查 token 是否已经包含 Bearer 前缀，如果没有则添加
      const token = userStore.token.startsWith("Bearer ")
        ? userStore.token
        : `Bearer ${userStore.token}`;
      config.headers["Authorization"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res && Object.prototype.hasOwnProperty.call(res, "code")) {
      if (res.code === 200 || res.code === 0 || res.code === 1) {
        return res.data ?? res.msg;
      }

      ElMessage({
        message: res.msg || "Error",
        type: "error",
        duration: 5 * 1000,
      });
      return Promise.reject(new Error(res.msg || "Error"));
    }

    return res;
  },
  (error) => {
    const message =
      error?.code === "ECONNABORTED" || String(error?.message || "").includes("timeout")
        ? "请求超时：请检查后端服务是否启动、代理地址是否正确"
        : error?.message || "请求失败";
    ElMessage({
      message,
      type: "error",
      duration: 5 * 1000,
    });
    return Promise.reject(error);
  },
);

export default service;
