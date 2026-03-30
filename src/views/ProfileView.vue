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
                :before-upload="beforeAvatarUpload"
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
                    <template v-else>
                        <el-button
                            :type="userInfo.isFollowed === 1 ? 'info' : 'primary'"
                            round
                            :loading="followActionLoading[userInfo.userId]"
                            @click="userInfo.isFollowed === 1 ? handleUnfollow(userInfo.userId) : handleFollow(userInfo.userId)"
                        >
                            {{ userInfo.isFollowed === 1 ? '已关注' : '关注' }}
                        </el-button>
                        <el-button round @click="openReport(1, userInfo.userId)">举报</el-button>
                    </template>
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
                        <span class="post-time">{{ formatDate(post.createTime, 'YYYY-MM-DD') }}</span>
                        <el-button v-if="isCurrentUser || userStore.hasPermission('admin:manage')" type="text" class="delete-btn" @click.stop="handleDeletePost(post.postId)">删除</el-button>
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
                          <span class="post-time">{{ formatDate(post.createTime, 'YYYY-MM-DD') }}</span>
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
                     <el-button
                       :type="user.isFollowed === 1 ? 'info' : 'primary'"
                       size="small"
                       round
                       :loading="Boolean(followActionLoading[user.userId])"
                       @click.stop="user.isFollowed === 1 ? handleUnfollow(user.userId) : handleFollow(user.userId)"
                     >
                       {{ user.isFollowed === 1 ? '已关注' : '回关' }}
                     </el-button>
                 </div>
            </div>
        </el-tab-pane>
        <el-tab-pane v-if="isCurrentUser" label="浏览记录" name="history">
             <div class="history-header" v-if="history.length > 0">
                <el-button @click="fetchHistory(1)" size="small">刷新</el-button>
                <el-button type="danger" text size="small" @click="handleClearHistory">清空足迹</el-button>
              </div>
             <el-empty v-if="history.length === 0" description="暂无足迹">
               <el-button type="primary" @click="router.push('/')">去首页看看</el-button>
             </el-empty>
             <div class="history-grid" v-else>
                <div v-for="post in history" :key="post.postId" class="food-card" @click="router.push({name: 'post-detail', params: {id: post.postId}})">
                    <div class="card-image-wrapper">
                        <img :src="post.images && post.images[0] ? post.images[0] : 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'" loading="lazy" />
                        <div class="card-overlay" v-if="post.price">
                            <span class="price-tag">¥ {{ post.price }}</span>
                        </div>
                        <div class="card-delete-overlay" @click.stop="handleDeleteHistory(post.postId)">
                             <el-icon><Close /></el-icon>
                         </div>
                    </div>

                    <div class="card-content">
                        <h3 class="card-title">{{ post.title }}</h3>

                        <div class="card-tags" v-if="post.tags && post.tags.length">
                            <span v-for="tag in post.tags.slice(0, 2)" :key="tag" class="tag-item">#{{ tag }}</span>
                        </div>

                        <div class="card-footer">
                            <div class="author-info">
                                <el-avatar :size="20" :src="post.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'"></el-avatar>
                                <span class="author-name">{{ post.username }}</span>
                            </div>
                            <div class="card-stats">
                                <span class="stat-item"><el-icon><Monitor /></el-icon> {{ post.viewCount || 0 }}</span>
                                <span class="stat-item"><el-icon><Star /></el-icon> {{ post.likeCount || 0 }}</span>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
             <el-pagination
                v-if="historyTotal > historyPageSize"
                background
                layout="prev, pager, next"
                :total="historyTotal"
                :page-size="historyPageSize"
                :current-page="historyPage"
                @current-change="fetchHistory"
                class="history-pagination"
              />
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

    <el-dialog v-model="reportDialogVisible" title="举报" width="640px" center destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="举报对象">
          <el-input :model-value="reportTargetLabel" disabled />
        </el-form-item>
        <el-form-item label="原因" required>
          <el-input v-model="reportForm.reasonText" type="textarea" :rows="4" placeholder="请填写举报原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="reportSubmitting" @click="submitReport">提交</el-button>
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
  deleteViewHistory,
  clearViewHistory,
  reportUser,
} from '@/api/user'
import { deleteAdminPost } from '@/api/admin'
import { uploadFile } from '@/api/common'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Camera, Monitor, Star, Close } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatDate'

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
const historyPage = ref(1)
const historyPageSize = ref(10)
const historyTotal = ref(0)
const editDialogVisible = ref(false)
const editForm = ref({})
const followActionLoading = ref({})
const favouriteActionLoading = ref({})

const reportDialogVisible = ref(false)
const reportSubmitting = ref(false)
const reportForm = ref({
  targetId: undefined,
  targetType: undefined,
  reasonText: '',
})

const reportTargetLabel = computed(() => {
  const type = reportForm.value.targetType
  if (type === 0) return `帖子（ID: ${reportForm.value.targetId ?? ''}）`
  if (type === 1) return `用户（ID: ${reportForm.value.targetId ?? ''}）`
  if (type === 2) return `评论（ID: ${reportForm.value.targetId ?? ''}）`
  return ''
})

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
  if (!ensureLoggedIn('请先登录后再关注')) return
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
    const next = { ...followActionLoading.value }
    delete next[userId]
    followActionLoading.value = next
  }
}

const handleUnfollow = async (userId) => {
  if (!userId) return
  if (!ensureLoggedIn('请先登录后再取消关注')) return
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
    const next = { ...followActionLoading.value }
    delete next[userId]
    followActionLoading.value = next
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
    const next = { ...favouriteActionLoading.value }
    delete next[postId]
    favouriteActionLoading.value = next
  }
}

const fetchHistory = async (page = historyPage.value) => {
  try {
    historyPage.value = page
    const res = await getViewHistory({
      page: historyPage.value,
      pageSize: historyPageSize.value
    })
    history.value = res.records || []
    historyTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  }
}

const handleDeleteHistory = async (postId) => {
    if (!postId) return
    try {
        await ElMessageBox.confirm('确定要删除这条足迹吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
        await deleteViewHistory(postId)
        ElMessage.success('删除成功')
        fetchHistory()
    } catch (error) {
        if (error !== 'cancel') {
            console.error(error)
        }
    }
}

const handleClearHistory = async () => {
    try {
        await ElMessageBox.confirm('确定要清空所有足迹吗？此操作不可恢复！', '警告', {
            confirmButtonText: '清空',
            cancelButtonText: '取消',
            confirmButtonClass: 'el-button--danger',
            type: 'warning'
        })
        await clearViewHistory()
        ElMessage.success('已清空足迹')
        fetchHistory(1)
    } catch (error) {
        if (error !== 'cancel') {
            console.error(error)
        }
    }
}

watch(() => route.query.userId, async () => {
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
  if (tab.props.name === 'history') fetchHistory(1)
}

const openEditDialog = () => {
  editDialogVisible.value = true
}

const ensureLoggedIn = (message = '请先登录后再操作') => {
  if (userStore.token) return true
  ElMessage.warning(message)
  router.push({ name: 'login' })
  return false
}

const openReport = (targetType, targetId) => {
  if (!ensureLoggedIn('请先登录后再举报')) return
  reportForm.value = {
    targetId,
    targetType,
    reasonText: '',
  }
  reportDialogVisible.value = true
}

const submitReport = async () => {
  const payload = reportForm.value
  if (!payload.targetId && payload.targetId !== 0) return
  if (payload.targetType === undefined || payload.targetType === null) return
  const reason = String(payload.reasonText || '').trim()
  if (!reason) {
    ElMessage.warning('请填写举报原因')
    return
  }
  if (reportSubmitting.value) return
  try {
    reportSubmitting.value = true
    await reportUser({
      targetId: payload.targetId,
      targetType: payload.targetType,
      reasonText: reason,
    })
    ElMessage.success('举报已提交')
    reportDialogVisible.value = false
  } catch (error) {
    console.error(error)
  } finally {
    reportSubmitting.value = false
  }
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

const beforeAvatarUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  if (!isJPGorPNG) {
    ElMessage.error('上传图片只能是 JPG/PNG/WebP 格式!')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('上传头像大小不能超过 2MB!')
    return false
  }
  return true
}

const handleDeletePost = async (postId) => {
    try {
        await ElMessageBox.confirm('确定要删除这篇帖子吗？', '提示', { type: 'warning' })
        // 如果是当前用户自己的帖子，使用 deleteUserPost，否则如果是管理员，使用 deleteAdminPost
        if (isCurrentUser.value) {
          await deleteUserPost(postId)
        } else if (userStore.hasPermission('admin:manage')) {
          await deleteAdminPost(postId)
        }
        ElMessage.success('删除成功')
        fetchPosts(postsPage.value)
    } catch (error) {
        if (error !== 'cancel') console.error(error)
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

.action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 10px;
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

.history-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    padding: 10px 0;
}

.food-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    display: flex;
    flex-direction: column;
    position: relative;
    border: 1px solid #f0f0f0;
}

.food-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.06);
}

.card-image-wrapper {
    width: 100%;
    aspect-ratio: 4 / 5;
    position: relative;
    background-color: #f8f8f8;
    overflow: hidden;
}

.card-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.card-overlay {
    position: absolute;
    bottom: 8px;
    right: 8px;
}

.price-tag {
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 2px 8px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: bold;
    backdrop-filter: blur(4px);
}

.card-delete-overlay {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.2s;
    cursor: pointer;
    z-index: 2;
}

.food-card:hover .card-delete-overlay {
    opacity: 1;
}

.card-delete-overlay:hover {
    background: #ff4d4f;
}

.card-content {
    padding: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.card-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    color: #333;
    margin: 0 0 8px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-tags {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
}

.tag-item {
    font-size: 11px;
    color: #999;
    background: #f5f5f5;
    padding: 1px 6px;
    border-radius: 4px;
}

.card-footer {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #999;
}

.author-info {
    display: flex;
    align-items: center;
    gap: 4px;
}

.author-name {
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-stats {
    display: flex;
    gap: 8px;
}

.history-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 15px;
}

.history-pagination {
    margin-top: 30px;
    display: flex;
    justify-content: center;
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
    aspect-ratio: 4 / 5;
    background: #f8f8f8;
    overflow: hidden;
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
