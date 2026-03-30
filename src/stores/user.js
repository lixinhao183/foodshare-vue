import { defineStore } from "pinia";
import { ref } from "vue";
import {
  login as loginApi,
  logout as logoutApi,
  getUserInfo as getUserInfoApi,
  guestLogin as guestLoginApi,
} from "@/api/user";

export const useUserStore = defineStore("user", () => {
  const token = ref(localStorage.getItem("token") || "");
  const userInfo = ref({});

  const setToken = (newToken) => {
    token.value = newToken;
    localStorage.setItem("token", newToken);
  };

  const clearToken = () => {
    token.value = "";
    localStorage.removeItem("token");
    userInfo.value = {};
  };

  const login = async (loginForm) => {
    try {
      // 在尝试新登录前，先清理当前会话
      clearToken();

      const res = await loginApi(loginForm);

      // 检查响应结构，兼容不同的API响应格式
      let tokenFromResponse = null;
      if (typeof res === "string") {
        // 如果直接返回token字符串
        tokenFromResponse = res;
      } else if (res && typeof res === "object") {
        // 如果返回对象，检查不同可能的键名
        tokenFromResponse = res.token || res.data?.token || res.access_token;
      }

      if (tokenFromResponse) {
        setToken(tokenFromResponse);
        // 登录成功后获取用户信息
        await getUserInfo();
        return true;
      } else {
        console.error("登录失败：未获取到有效的token");
        return false;
      }
    } catch (error) {
      console.error("登录错误:", error);
      // 将错误信息重新抛出，便于上层处理
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error(error);
    } finally {
      clearToken();
    }
  };

  const guestLogin = async () => {
    try {
      clearToken();
      const res = await guestLoginApi();
      let tokenFromResponse = null;
      if (typeof res === "string") {
        tokenFromResponse = res;
      } else if (res && typeof res === "object") {
        tokenFromResponse = res.token || res.data?.token || res.access_token;
      }
      if (tokenFromResponse) {
        setToken(tokenFromResponse);
        await getUserInfo();
        return true;
      } else {
        console.error("游客登录失败：未获取到有效的token");
        return false;
      }
    } catch (error) {
      console.error("游客登录错误:", error);
      throw error;
    }
  };

  const getUserInfo = async () => {
    try {
      const res = await getUserInfoApi();
      if (res) {
        userInfo.value = res;
        return res;
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
      // 如果获取用户信息失败，可能是token无效或无权限，清空本地存储并引导重新登录
      const status = error.response?.status;
      if (status === 401 || status === 403 || error.message === "Access Denied") {
        clearToken();
      }
      throw error; // 抛出错误供上层处理
    }
  };

  const hasPermission = (permission) => {
    // 角色类型：1超级管理员 2管理员 3用户 4游客
    const role = userInfo.value?.role;

    // 1. 超级管理员拥有所有权限
    if (role === 1) return true;

    // 2. 游客没有任何操作权限
    if (!role || role === 4) return false;

    // 3. 构建当前角色的权限集
    const permissionSet = new Set();

    // 管理员权限 (role=2)
    if (role === 2) {
      permissionSet.add("admin:manage");
      permissionSet.add("post:create");
      permissionSet.add("user:view");
    }

    // 普通用户权限 (role=3)
    if (role === 3) {
      permissionSet.add("post:create");
      permissionSet.add("user:view");
    }

    // 4. 检查是否包含请求的权限
    if (Array.isArray(permission)) {
      return permission.some((p) => permissionSet.has(p));
    }
    return permissionSet.has(permission);
  };

  return {
    token,
    userInfo,
    setToken,
    clearToken,
    login,
    guestLogin,
    logout,
    getUserInfo,
    hasPermission,
  };
});
