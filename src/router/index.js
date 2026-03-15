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
          meta: { requiresAuth: true }
        },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  if (to.meta.requiresAuth && !userStore.token) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;
