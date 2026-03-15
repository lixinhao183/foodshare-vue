<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeFilled,
  Plus,
  Bell,
  User,
  Setting,
  MoreFilled,
  Search,
  SwitchButton,
  Menu as MenuIcon
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchText = ref(route.query.keyword || '')
const activeMenu = ref('home')
const isMobile = ref(window.innerWidth < 768)
const drawerVisible = ref(false)

const handleSearch = () => {
  router.push({
    name: 'food-list',
    query: {
      ...route.query,
      keyword: searchText.value
    }
  })
}

// 监听路由参数变化，同步搜索框内容
watch(() => route.query.keyword, (newKeyword) => {
  searchText.value = newKeyword || ''
})

const menuItems = [
  { id: 'home', label: '主页', icon: HomeFilled, routeName: 'food-list' },
  { id: 'publish', label: '发布', icon: Plus, routeName: 'publish' },
  { id: 'notification', label: '通知', icon: Bell, routeName: 'notification' },
  { id: 'me', label: '我的', icon: User, routeName: 'me' },
  { id: 'manage', label: '管理', icon: Setting, routeName: 'manage' },
]

const handleMenuClick = (item) => {
  activeMenu.value = item.id
  if (item.routeName) {
    if (router.hasRoute(item.routeName)) {
      router.push({ name: item.routeName })
    } else {
      console.warn(`Route ${item.routeName} not found`)
    }
  }
  if (isMobile.value) {
    drawerVisible.value = false
  }
}

const handleLogout = async () => {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 监听路由变化以更新 activeMenu
watch(() => route.name, (newRouteName) => {
  const item = menuItems.find(i => i.routeName === newRouteName)
  if (item) {
    activeMenu.value = item.id
  }
}, { immediate: true })

onMounted(() => {
  if (userStore.token && !userStore.userInfo.id) {
    userStore.getUserInfo()
  }
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

</script>

<template>
  <div class="common-layout">
    <el-container class="main-container">
      <!-- Sidebar (Desktop) -->
      <el-aside width="260px" class="sidebar hidden-sm-and-down" v-if="!isMobile">
        <div class="brand-area">
          <div class="logo-container" @click="$router.push('/')">
             <span class="logo-text">FoodShare</span>
          </div>
        </div>

        <div class="menu-area">
          <div
            v-for="item in menuItems"
            :key="item.id"
            class="menu-item"
            :class="{ active: activeMenu === item.id }"
            @click="handleMenuClick(item)"
          >
            <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
            <span class="menu-label">{{ item.label }}</span>
          </div>
        </div>

        <div class="bottom-area">
           <div class="menu-item">
            <el-icon class="menu-icon"><MoreFilled /></el-icon>
            <span class="menu-label">更多</span>
          </div>
        </div>
      </el-aside>

      <!-- Mobile Drawer Menu -->
      <el-drawer
        v-model="drawerVisible"
        direction="ltr"
        size="280px"
        :with-header="false"
        class="mobile-menu-drawer"
      >
        <div class="sidebar mobile-sidebar">
             <div class="brand-area">
              <div class="logo-container" @click="$router.push('/'); drawerVisible=false">
                 <span class="logo-text">FoodShare</span>
              </div>
            </div>
            <div class="menu-area">
              <div
                v-for="item in menuItems"
                :key="item.id"
                class="menu-item"
                :class="{ active: activeMenu === item.id }"
                @click="handleMenuClick(item)"
              >
                <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
                <span class="menu-label">{{ item.label }}</span>
              </div>
            </div>
        </div>
      </el-drawer>

      <el-container class="right-container">
        <!-- Header -->
        <el-header height="70px" class="header">
          <div class="mobile-menu-btn" v-if="isMobile" @click="drawerVisible = true">
             <el-icon><MenuIcon /></el-icon>
          </div>

          <div class="search-container">
            <el-input
              v-model="searchText"
              placeholder="搜索美食..."
              class="search-input"
              size="large"
              clearable
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon class="search-icon" @click="handleSearch" style="cursor: pointer"><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="header-actions">
            <el-button circle size="large" class="icon-btn">
              <el-icon><Bell /></el-icon>
            </el-button>
            <el-dropdown v-if="userStore.token" trigger="click">
              <span class="el-dropdown-link">
                <el-avatar class="user-avatar" :size="40" :src="userStore.userInfo.image || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'">头像</el-avatar>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push({ name: 'me' })">个人中心</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button v-else type="primary" round @click="$router.push('/login')">登录 / 注册</el-button>
          </div>
        </el-header>

        <!-- Router View for Right Content -->
        <el-main class="main-content">
          <RouterView v-slot="{ Component }">
             <transition name="fade" mode="out-in">
               <component :is="Component" />
             </transition>
          </RouterView>
        </el-main>
      </el-container>

    </el-container>
  </div>
</template>

<style scoped>
.common-layout {
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.main-container {
  width: 100%;
  height: 100%;
  background-color: #fff;
  max-width: 1440px;
  box-shadow: 0 0 40px rgba(0,0,0,0.02);
}

/* Sidebar Styles */
.sidebar {
  display: flex;
  flex-direction: column;
  padding: 30px 24px;
  background-color: #fff;
  border-right: 1px solid #f0f0f0;
  transition: width 0.3s;
}

.mobile-sidebar {
    height: 100%;
    border-right: none;
}

.brand-area {
  margin-bottom: 50px;
  padding: 0 12px;
}

.logo-container {
    cursor: pointer;
    display: flex;
    align-items: center;
}

.logo-text {
    font-size: 28px;
    font-weight: 800;
    background: linear-gradient(45deg, #FF6B6B, #FF8E53);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
}

.menu-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.2s ease;
  color: #666;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.menu-item:hover {
  background-color: #f8f9fa;
  color: #333;
  transform: translateX(4px);
}

.menu-item.active {
  background-color: #fff0f0;
  color: #FF6B6B;
}

.menu-icon {
  margin-right: 18px;
  font-size: 24px;
}

.bottom-area {
  margin-top: auto;
}

.right-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #fafafa;
}

/* Header Styles */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #f0f0f0;
  z-index: 10;
  position: sticky;
  top: 0;
}

.mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.search-container {
  flex: 1;
  max-width: 500px;
  margin-right: 40px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  background-color: #f5f7fa;
  box-shadow: none;
  padding: 10px 20px;
  transition: all 0.3s;
}

.search-input :deep(.el-input__wrapper):hover,
.search-input :deep(.el-input__wrapper).is-focus {
    background-color: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.search-input :deep(.el-input__inner) {
  font-size: 16px;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.icon-btn {
    border: none;
    background: transparent;
    color: #666;
    font-size: 20px;
    transition: background 0.2s;
}
.icon-btn:hover {
    background: #f0f0f0;
    color: #333;
}

.user-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}
.user-avatar:hover {
    transform: scale(1.05);
}

.main-content {
  padding: 0;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
    .header {
        padding: 0 20px;
    }

    .search-container {
        display: none; /* Hide search on mobile for simplicity, or make it an icon */
    }
}
</style>
