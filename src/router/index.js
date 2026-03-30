import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import FoodList from "../views/FoodList.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import PublishPostView from "../views/PublishPostView.vue";
import ProfileView from "../views/ProfileView.vue";
import PostDetailView from "../views/PostDetailView.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import NotificationView from "../views/NotificationView.vue";
import { useUserStore } from "@/stores/user";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
    },
    {
      path: "/",
      component: HomeView,
      children: [
        {
          path: "", // 默认子路由
          name: "food-list",
          component: FoodList,
        },
        {
          path: "publish",
          name: "publish",
          component: PublishPostView,
          meta: { permissions: ["post:create"] },
        },
        {
          path: "post/:id",
          name: "post-detail",
          component: PostDetailView,
        },
        {
          path: "notification",
          name: "notification",
          component: NotificationView,
          meta: { permissions: ["user:view"] },
        },
        {
          path: "me",
          name: "me",
          component: ProfileView,
          meta: { permissions: ["user:view"] },
        },
        {
          path: "manage",
          name: "manage",
          component: AdminDashboard,
          meta: { permissions: ["admin:manage", "permission:manage"] },
        },
      ],
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // 如果没有 token 但访问需要权限的页面
  if (to.meta.permissions && !userStore.token) {
    return next({ name: "login" });
  }

  // 如果有 token 但没有用户信息，尝试获取用户信息
  if (userStore.token && (!userStore.userInfo || userStore.userInfo.role === undefined)) {
    try {
      await userStore.getUserInfo();
    } catch (error) {
      // 获取失败可能是 token 过期或无权限
      // 如果目标页面需要权限，则必须跳转到登录页
      if (to.meta.permissions) {
        return next({ name: "login" });
      }
      // 如果目标页面是公开的，则允许继续访问（userStore.getUserInfo 内部已处理 clearToken）
    }
  }

  // 检查权限
  if (to.meta.permissions) {
    // 超级管理员(role=1)拥有所有权限
    if (userStore.userInfo?.role === 1) {
      return next();
    }

    const hasPerm = userStore.hasPermission(to.meta.permissions);
    if (hasPerm) {
      next();
    } else {
      // 无权限
      if (userStore.token) {
        // 已登录但无权限，跳转首页
        next({ name: "food-list" });
      } else {
        // 未登录跳转登录
        next({ name: "login" });
      }
    }
  } else {
    next();
  }
});

export default router;
