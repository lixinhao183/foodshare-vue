import { defineStore } from "pinia";
import { ref } from "vue";
import { login as loginApi, logout as logoutApi, getUserInfo as getUserInfoApi } from "@/api/user";

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
      const res = await loginApi(loginForm);
      //res 直接包含 token
      //API 文档显示 ResponseResult<Map>
      //token 键名为 'token'
      if (res && res.token) {
        setToken(res.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      return false;
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

  const getUserInfo = async () => {
    try {
      const res = await getUserInfoApi();
      if (res) {
        userInfo.value = res;
        return res;
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    token,
    userInfo,
    setToken,
    clearToken,
    login,
    logout,
    getUserInfo,
  };
});
