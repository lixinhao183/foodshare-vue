<template>
  <div class="profile-container">
    <div class="profile-header">
       <div class="header-bg"></div>
       <div class="user-card">
           <el-upload
                v-if="isCurrentUser"
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :http-request="handleAvatarUpload"
            >
                <div class="avatar-wrapper">
                     <el-avatar :size="100" :src="userInfo.image || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" class="user-avatar" />
                     <div class="avatar-mask"><el-icon><Camera /></el-icon></div>
                </div>
            </el-upload>
            <div class="avatar-wrapper" v-else>
                 <el-avatar :size="100" :src="userInfo.image || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" class="user-avatar" />
            </div>

            <div class="user-details">
                <h1 class="username">{{ userInfo.username }}</h1>
                <p class="user-id">ID: {{ userInfo.userId }}</p>
                <p class="user-bio">{{ userInfo.bio || '这个人很懒，什么都没有写~' }}</p>

                <div class="user-stats">
                     <div class="stat-item">
                         <span class="stat-num">{{ userInfo.followCount ?? 0 }}</span>
                         <span class="stat-label">关注</span>
                     </div>
                     <div class="stat-item">
                         <span class="stat-num">{{ userInfo.fansCount ?? 0 }}</span>
                         <span class="stat-label">粉丝</span>
                     </div>
                     <div class="stat-item">
                         <span class="stat-num">{{ postsTotal || posts.length || 0 }}</span>
                         <span class="stat-label">帖子</span>
                     </div>
                </div>

                <div class="action-buttons">
                    <el-button v-if="isCurrentUser" type="primary" round @click="openEditDialog">编辑资料</el-button>
                </div>
            </div>
       </div>
    </div>

    <div class="content-section">
        <el-tabs v-model="activeTab" class="custom-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="我的帖子" name="posts">
            <el-empty v-if="posts.length === 0" description="暂无帖子">
              <el-button v-if="isCurrentUser" type="primary" :icon="Plus" @click="router.push({ name: 'publish' })">去发布</el-button>
            </el-empty>
            <div class="post-grid" v-else>
            <!-- 帖子列表组件 -->
            <div v-for="post in posts" :key="post.postId" class="profile-post-card" @click="router.push({name: 'post-detail', params: {id: post.postId}})">
                <div class="post-cover">
                    <img :src="post.images && post.images[0] ? post.images[0] : 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'" loading="lazy" />
                </div>
                <div class="post-info">
                    <h3 class="post-title">{{ post.title }}</h3>
                    <div class="post-footer">
                        <span class="post-time">{{ post.createTime.split(' ')[0] }}</span>
                        <el-button v-if="isCurrentUser" type="text" class="delete-btn" @click.stop="handleDeletePost(post.postId)">删除</el-button>
                    </div>
                </div>
            </div>
            </div>
            <el-pagination
              v-if="postsTotal > postsPageSize"
              background
              layout="prev, pager, next"
              :total="postsTotal"
              :page-size="postsPageSize"
              :current-page="postsPage"
              @current-change="fetchPosts"
            />
        </el-tab-pane>
        <el-tab-pane v-if="isCurrentUser" label="收藏" name="favourite">
             <div class="post-grid">
                <div v-for="post in favourites" :key="post.postId" class="profile-post-card" @click="router.push({name: 'post-detail', params: {id: post.postId}})">
                     <div class="post-cover">
                        <img :src="post.images && post.images[0] ? post.images[0] : 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'" loading="lazy" />
                    </div>
                    <div class="post-info">
                        <h3 class="post-title">{{ post.title }}</h3>
                        <div class="post-footer">
                          <span class="post-time">{{ post.createTime ? post.createTime.split(' ')[0] : '' }}</span>
                          <el-button type="text" class="delete-btn" :loading="Boolean(favouriteActionLoading[post.postId])" @click.stop="handleUnfavourite(post.postId)">取消收藏</el-button>
                        </div>
                    </div>
                </div>
             </div>
        </el-tab-pane>
        <el-tab-pane v-if="isCurrentUser" label="关注" name="follows">
            <div class="user-list">
                 <div
                   v-for="user in follows"
                   :key="user.userId"
                   class="user-item"
                   @click="router.push({ name: 'me', query: { userId: user.userId } })"
                 >
                     <el-avatar :size="40" :src="user.image || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
                     <span class="user-name">{{ user.username }}</span>
                     <el-button size="small" round :loading="Boolean(followActionLoading[user.userId])" @click.stop="handleUnfollow(user.userId)">取消关注</el-button>
                 </div>
            </div>
        </el-tab-pane>
        <el-tab-pane v-if="isCurrentUser" label="粉丝" name="fans">
             <div class="user-list">
                 <div
                   v-for="user in fans"
                   :key="user.userId"
                   class="user-item"
                   @click="router.push({ name: 'me', query: { userId: user.userId } })"
                 >
                     <el-avatar :size="40" :src="user.image || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
                     <span class="user-name">{{ user.username }}</span>
                     <el-button type="primary" size="small" round :loading="Boolean(followActionLoading[user.userId])" @click.stop="handleFollow(user.userId)">回关</el-button>
                 </div>
            </div>
        </el-tab-pane>
        <el-tab-pane v-if="isCurrentUser" label="浏览记录" name="history">
             <div class="post-list-simple">
                 <div v-for="post in history" :key="post.postId" class="simple-post-item" @click="router.push({name: 'post-detail', params: {id: post.postId}})">
                     <span class="simple-title">{{ post.title }}</span>
                     <span class="simple-time">{{ post.createTime }}</span>
                 </div>
             </div>
        </el-tab-pane>
        </el-tabs>
    </div>

    <el-dialog v-model="editDialogVisible" title="编辑资料" width="500px" center destroy-on-close>
      <el-form :model="editForm" label-position="top">
        <el-form-item label="简介">
          <el-input v-model="editForm.bio" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="性别">
            <el-radio-group v-model="editForm.gender">
                <el-radio :label="1">男</el-radio>
                <el-radio :label="2">女</el-radio>
                <el-radio :label="0">保密</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateProfile">保存修改</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getUserInfo,
  getUserPosts,
  getFollows,
  getFans,
  getFavouritePosts,
  getViewHistory,
  updateUserInfo,
  deleteUserPost,
  followUser,
  unfollowUser,
  unfavouritePost,
} from '@/api/user'
import { uploadFile } from '@/api/common'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Plus, Camera } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const userInfo = ref({})
const activeTab = ref('posts')
const posts = ref([])
const postsPage = ref(1)
const postsPageSize = ref(10)
const postsTotal = ref(0)
const follows = ref([])
const fans = ref([])
const favourites = ref([])
const history = ref([])
const editDialogVisible = ref(false)
const editForm = ref({})
const followActionLoading = ref({})
const favouriteActionLoading = ref({})

const isCurrentUser = computed(() => {
  const routeUserId = route.query.userId
  if (routeUserId === undefined || routeUserId === null || routeUserId === '') return true
  const currentId = userStore.userInfo && userStore.userInfo.userId
  if (currentId === undefined || currentId === null || currentId === '') return false
  return String(routeUserId) === String(currentId)
})

const fetchUserInfo = async () => {
  try {
    const userId = route.query.userId
    const res = await getUserInfo(userId)
    userInfo.value = res || {}

    // Only update store if it's the current user
    if (isCurrentUser.value) {
        userStore.userInfo = userInfo.value
    }

    editForm.value = {
        userId: userInfo.value.userId,
        username: userInfo.value.username,
        bio: userInfo.value.bio,
        gender: userInfo.value.gender,
        image: userInfo.value.image,
        phone: userInfo.value.phone,
        email: userInfo.value.email
    }
  } catch (error) {
    console.error(error)
  }
}

const fetchPosts = async (page = postsPage.value) => {
  if (!userInfo.value.userId) return
  try {
    postsPage.value = page
    const res = await getUserPosts({
      userId: userInfo.value.userId,
      page: postsPage.value,
      pageSize: postsPageSize.value
    })
    posts.value = res.records || []
    postsTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  }
}

const fetchFollows = async () => {
  try {
    const res = await getFollows({ page: 1, pageSize: 10 })
    follows.value = res.records || []
  } catch (error) {
    console.error(error)
  }
}

const fetchFans = async () => {
  try {
    const res = await getFans({ page: 1, pageSize: 10 })
    fans.value = res.records || []
  } catch (error) {
    console.error(error)
  }
}

const handleFollow = async (userId) => {
  if (!userId) return
  if (followActionLoading.value[userId]) return
  try {
    followActionLoading.value = { ...followActionLoading.value, [userId]: true }
    await followUser(userId)
    ElMessage.success('关注成功')
    fetchUserInfo()
    fetchFollows()
    fetchFans()
  } catch (error) {
    console.error(error)
  } finally {
    const { [userId]: _, ...rest } = followActionLoading.value
    followActionLoading.value = rest
  }
}

const handleUnfollow = async (userId) => {
  if (!userId) return
  if (followActionLoading.value[userId]) return
  try {
    followActionLoading.value = { ...followActionLoading.value, [userId]: true }
    await unfollowUser(userId)
    ElMessage.success('已取消关注')
    fetchUserInfo()
    fetchFollows()
    fetchFans()
  } catch (error) {
    console.error(error)
  } finally {
    const { [userId]: _, ...rest } = followActionLoading.value
    followActionLoading.value = rest
  }
}

const fetchFavourites = async () => {
  try {
    const res = await getFavouritePosts({ page: 1, pageSize: 10 })
    favourites.value = res.records || []
  } catch (error) {
    console.error(error)
  }
}

const handleUnfavourite = async (postId) => {
  if (!postId) return
  if (favouriteActionLoading.value[postId]) return
  try {
    favouriteActionLoading.value = { ...favouriteActionLoading.value, [postId]: true }
    await unfavouritePost(postId)
    ElMessage.success('已取消收藏')
    fetchFavourites()
  } catch (error) {
    console.error(error)
  } finally {
    const { [postId]: _, ...rest } = favouriteActionLoading.value
    favouriteActionLoading.value = rest
  }
}

const fetchHistory = async () => {
  try {
    const res = await getViewHistory({ page: 1, pageSize: 10 })
    history.value = res.records || []
  } catch (error) {
    console.error(error)
  }
}

watch(() => route.query.userId, async (newId) => {
    posts.value = []
    follows.value = []
    fans.value = []
    favourites.value = []
    history.value = []
    activeTab.value = 'posts'
    await fetchUserInfo()
    fetchPosts()
    if (isCurrentUser.value) {
      fetchFollows()
      fetchFans()
    }
})

const handleTabClick = (tab) => {
  if (tab.props.name === 'posts') fetchPosts(1)
  if (tab.props.name === 'follows') fetchFollows()
  if (tab.props.name === 'fans') fetchFans()
  if (tab.props.name === 'favourite') fetchFavourites()
  if (tab.props.name === 'history') fetchHistory()
}

const openEditDialog = () => {
  editDialogVisible.value = true
}

const handleUpdateProfile = async () => {
  try {
    await updateUserInfo(editForm.value)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    fetchUserInfo()
  } catch (error) {
    console.error(error)
  }
}

const handleAvatarUpload = async (options) => {
    const { file } = options
    try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await uploadFile(formData)
        // 更新用户头像
        await updateUserInfo({ ...editForm.value, image: res })
        ElMessage.success('头像更新成功')
        fetchUserInfo()
    } catch (err) {
        console.error(err)
        ElMessage.error('上传失败')
    }
}

const handleDeletePost = async (postId) => {
    try {
        await deleteUserPost(postId)
        ElMessage.success('删除成功')
        fetchPosts(postsPage.value)
    } catch (error) {
        console.error(error)
    }
}

onMounted(async () => {
  await fetchUserInfo()
  fetchPosts()
  if (isCurrentUser.value) {
    fetchFollows()
    fetchFans()
  }
})
</script>

<style scoped>
.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
}

.profile-header {
    background: #fff;
    margin-bottom: 20px;
    position: relative;
}

.header-bg {
    height: 160px;
    background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
    border-radius: 0 0 20px 20px;
}

.user-card {
    display: flex;
    padding: 0 40px 30px;
    margin-top: -40px;
    gap: 30px;
}

.avatar-wrapper {
    position: relative;
    border-radius: 50%;
    border: 4px solid #fff;
    cursor: pointer;
    overflow: hidden;
}

.avatar-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-size: 24px;
    opacity: 0;
    transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-mask {
    opacity: 1;
}

.user-details {
    padding-top: 50px;
    flex: 1;
}

.username {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
}

.user-id {
    font-size: 14px;
    color: #999;
    margin-bottom: 12px;
}

.user-bio {
    font-size: 14px;
    color: #555;
    margin-bottom: 20px;
    line-height: 1.5;
}

.user-stats {
    display: flex;
    gap: 40px;
    margin-bottom: 20px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.stat-num {
    font-size: 18px;
    font-weight: 700;
    color: #333;
}

.stat-label {
    font-size: 12px;
    color: #999;
}

.content-section {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    min-height: 500px;
}

.custom-tabs :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: #f0f0f0;
}

.custom-tabs :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 500;
}

.post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
}

.profile-post-card {
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s;
}

.profile-post-card:hover {
    transform: translateY(-2px);
}

.post-cover {
    width: 100%;
    aspect-ratio: 1;
    background: #f8f8f8;
}

.post-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.post-info {
    padding: 8px 4px;
}

.post-title {
    font-size: 14px;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.post-time {
    font-size: 12px;
    color: #999;
}

.delete-btn {
    color: #ff4d4f;
    padding: 0;
    font-size: 12px;
}

.user-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-bottom: 1px solid #f9f9f9;
    cursor: pointer;
}

.user-item:hover {
    background: #f9f9f9;
}

.user-name {
    flex: 1;
    font-weight: 500;
}

.simple-post-item {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
}

.simple-post-item:hover {
    background: #f9f9f9;
}

.simple-title {
    color: #333;
}

.simple-time {
    color: #999;
    font-size: 12px;
}
</style>
