import { createApp } from "vue";

import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";
import { useUserStore } from "@/stores/user";

import "./assets/main.css";
const app = createApp(App);

app.use(createPinia());

// 注册全局权限指令 v-hasPerm
app.directive("hasPerm", {
  mounted(el, binding) {
    const userStore = useUserStore();
    const { value } = binding;
    if (value && (typeof value === "string" || Array.isArray(value))) {
      const hasPermission = userStore.hasPermission(value);
      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    } else {
      throw new Error(
        `need permissions! Like v-hasPerm="'user:view'" or v-hasPerm="['admin:manage']"`,
      );
    }
  },
});

// 注册全局权限判断方法
app.config.globalProperties.$hasPerm = (permission) => {
  const userStore = useUserStore();
  return userStore.hasPermission(permission);
};

app.use(router);
app.use(ElementPlus);
app.mount("#app");
