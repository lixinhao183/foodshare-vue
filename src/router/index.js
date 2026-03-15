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
          meta: { requiresAuth: true }
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
          meta: { requiresAuth: true }
        },
        {
          path: "me",
          name: "me",
          component: ProfileView,
          meta: { requiresAuth: true }
        },
        {
          path: "manage",
          name: "manage",
          component: AdminDashboard,
          meta: { requiresAuth: true, requiresAdmin: true }
        },
      ],
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // 如果需要认证且没有 token，跳转到登录页
  if (to.meta.requiresAuth && !userStore.token) {
    return next({ name: 'login' });
  }

  // 如果有 token 但没有用户信息，尝试获取用户信息
  if (userStore.token && (!userStore.userInfo || !userStore.userInfo.role)) {
    await userStore.getUserInfo();
  }

  // 如果需要管理员权限
  if (to.meta.requiresAdmin) {
    const role = userStore.userInfo.role;
    // 角色（0, 1管理员 2登录用户 3游客）
    if (role === 0 || role === 1) {
      next();
    } else {
      // 非管理员跳转到首页或显示无权限（这里暂定跳转到首页）
      next({ name: 'food-list' });
    }
  } else {
    next();
  }
});

export default router;
