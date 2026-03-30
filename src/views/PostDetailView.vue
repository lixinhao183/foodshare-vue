<template>
  <div class="post-detail-container">
    <el-card class="detail-card">
      <div v-if="post">
        <!-- Header -->
        <div class="post-header">
            <h1 class="post-title">{{ post.title }}</h1>
            <div class="user-meta">
                <el-avatar
                  :size="40"
                  :src="post.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'"
                  @click="router.push({ name: 'me', query: { userId: post.userId } })"
                  style="cursor: pointer;"
                />
                <div class="user-info" @click="router.push({ name: 'me', query: { userId: post.userId } })" style="cursor: pointer;">
                    <span class="username">{{ post.username }}</span>
                    <span class="publish-time">{{ formatDate(post.createTime) }}</span>
                </div>
                <div class="post-actions">
                     <el-button
                       v-if="showFollowButton"
                       type="primary"
                       :plain="authorFollowed"
                       round
                       size="small"
                       :loading="followLoading"
                       @click="handleToggleFollow"
                     >
                       {{ authorFollowed ? '已关注' : '关注' }}
                     </el-button>

                     <el-dropdown trigger="click" @command="handlePostMenuCommand">
                       <el-button round size="small" plain>
                         更多
                         <el-icon style="margin-left: 6px"><MoreFilled /></el-icon>
                       </el-button>
                       <template #dropdown>
                         <el-dropdown-menu>
                           <el-dropdown-item command="report_post">举报帖子</el-dropdown-item>
                           <el-dropdown-item command="report_user">举报用户</el-dropdown-item>
                           <el-dropdown-item v-hasPerm="['admin:manage']" command="delete_post" style="color: #f56c6c">删除帖子 (管理员)</el-dropdown-item>
                         </el-dropdown-menu>
                       </template>
                     </el-dropdown>
                </div>
            </div>
        </div>

        <!-- Carousel / Images -->
        <div class="media-container" v-if="post.images && post.images.length">
            <el-carousel
              trigger="click"
              :autoplay="false"
              arrow="always"
              class="custom-carousel"
              :height="carouselHeight"
            >
                <el-carousel-item v-for="(img, index) in post.images" :key="index">
                    <el-image
                        :src="img"
                        :preview-src-list="post.images"
                        :initial-index="index"
                        preview-teleported
                        fit="cover"
                        class="carousel-image"
                    />
                </el-carousel-item>
            </el-carousel>
        </div>

        <!-- Info Bar -->
        <div class="info-bar">
            <div class="price-box" v-if="post.price">
                <span class="currency">¥</span>
                <span class="amount">{{ post.price }}</span>
            </div>
            <div class="location-box" v-if="post.localName">
                 <el-icon><Location /></el-icon>
                 <span>{{ post.localName }}</span>
            </div>
        </div>

        <!-- Content -->
        <div class="post-content">
          {{ post.content }}
        </div>

        <!-- Tags -->
        <div class="post-tags" v-if="post.tags && post.tags.length">
          <span v-for="tag in post.tags" :key="tag" class="tag-chip"># {{ tag }}</span>
        </div>

        <div class="interaction-bar">
            <div class="stat-item">
                <el-icon><View /></el-icon> {{ post.viewCount }}
            </div>
            <div class="stat-item action-btn" :class="{ active: postLiked }" @click="handleTogglePostLike">
                <el-icon><Star /></el-icon> {{ post.likeCount }}
            </div>
            <div class="stat-item action-btn" :class="{ active: postFavourited }" @click="handleTogglePostFavourite">
                 <el-icon><Collection /></el-icon> {{ post.favouriteCount }}
            </div>
        </div>

        <el-divider />

        <!-- Comment Section -->
        <div class="comment-section">
            <h3 class="section-title">评论 ({{ total || post.commentCount || 0 }})</h3>

            <div class="comment-input-area">
                <el-avatar :size="32" :src="currentUserAvatar" class="input-avatar" />
                <div class="input-wrapper">
                     <el-input
                        v-model="commentContent"
                        placeholder="说点什么..."
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 4 }"
                        resize="none"
                        class="comment-textarea"
                    />
                    <el-button type="primary" size="small" class="send-btn" @click="handlePublishComment" :loading="publishing" :disabled="publishing || !commentContent.trim()">发送</el-button>
                </div>
            </div>

            <div class="comment-list">
                <el-empty v-if="!commentLoading && comments.length === 0" description="暂无评论" :image-size="120" />

                <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
                    <el-avatar :size="36" :src="comment.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" class="comment-avatar" />
                    <div class="comment-body">
                        <div class="comment-header">
                            <span class="comment-user">{{ comment.username }}</span>
                            <span class="comment-time">{{ formatDate(comment.createTime, 'relative') }}</span>
                        </div>
                        <div class="comment-text">{{ comment.content }}</div>
                        <div class="comment-actions">
                             <el-button type="text" size="small" class="action-text" @click="startReply(comment)">回复</el-button>
                             <el-button type="text" size="small" class="action-text" @click="openReportComment(comment)">举报</el-button>
                             <el-button
                               type="text"
                               size="small"
                               class="action-text"
                               :class="{ active: comment.isLiked === 1 }"
                               :loading="Boolean(commentLikeLoading[comment.commentId])"
                               @click="toggleCommentLike(comment)"
                             >
                               赞 {{ comment.likeCount || 0 }}
                             </el-button>
                             <el-button v-if="isMyComment(comment)" type="text" size="small" class="action-text delete" @click="handleDeleteComment(comment.commentId)">删除</el-button>
                        </div>

                        <div v-if="isReplyingTo(comment)" class="reply-editor">
                          <el-input
                            v-model="replyContent"
                            :placeholder="replyPlaceholder"
                            type="textarea"
                            :autosize="{ minRows: 1, maxRows: 3 }"
                            resize="none"
                          />
                          <div class="reply-editor-actions">
                            <el-button size="small" @click="cancelReply">取消</el-button>
                            <el-button type="primary" size="small" :loading="replyPublishing" :disabled="replyPublishing || !replyContent.trim()" @click="handlePublishReply">发送</el-button>
                          </div>
                        </div>

                        <div v-if="comment.children && comment.children.length" class="reply-list">
                          <div v-for="child in comment.children" :key="child.commentId" class="reply-item">
                            <el-avatar :size="28" :src="child.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" class="reply-avatar" />
                            <div class="reply-body">
                              <div class="comment-header">
                                <span class="comment-user">{{ child.username }}</span>
                                <span class="comment-time">{{ formatDate(child.createTime, 'relative') }}</span>
                              </div>
                              <div class="comment-text">{{ child.content }}</div>
                              <div class="comment-actions">
                                <el-button type="text" size="small" class="action-text" @click="openReportComment(child)">举报</el-button>
                                <el-button
                                  type="text"
                                  size="small"
                                  class="action-text"
                                  :class="{ active: child.isLiked === 1 }"
                                  :loading="Boolean(commentLikeLoading[child.commentId])"
                                  @click="toggleCommentLike(child)"
                                >
                                  赞 {{ child.likeCount || 0 }}
                                </el-button>
                                <el-button v-if="isMyComment(child)" type="text" size="small" class="action-text delete" @click="handleDeleteComment(child.commentId)">删除</el-button>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>
                </div>
                <el-pagination
                    v-if="total > 0"
                    layout="prev, pager, next"
                    :total="total"
                    v-model:current-page="page"
                    :page-size="pageSize"
                    @current-change="fetchComments"
                    class="pagination"
                />
            </div>
        </div>
      </div>
      <el-empty v-else description="加载中..." />
    </el-card>

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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail } from '@/api/post'
import {
  publishComment,
  deleteComment,
  reportUser,
  followUser,
  unfollowUser,
  likePost,
  unlikePost,
  likeComment,
  unlikeComment,
  favouritePost,
  unfavouritePost,
} from '@/api/user'
import { deleteAdminPost } from '@/api/admin'
import { getCommentList } from '@/api/post'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, View, Star, Collection, MoreFilled } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatDate'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const post = ref(null)
const comments = ref([])
const commentContent = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const postId = route.params.id
const commentLoading = ref(false)
const publishing = ref(false)
const replyTarget = ref(null)
const replyContent = ref('')
const replyPublishing = ref(false)
const postLikeLoading = ref(false)
const postFavouriteLoading = ref(false)
const followLoading = ref(false)
const authorFollowed = ref(false)
const commentLikeLoading = ref({})

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

const currentUserAvatar = computed(() => {
  return (
    userStore.userInfo?.image ||
    userStore.userInfo?.avatar ||
    'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
  )
})

const replyPlaceholder = computed(() => {
  if (!replyTarget.value) return '回复...'
  const name = replyTarget.value.username || 'TA'
  return `回复 ${name}...`
})

// Carousel height logic
const windowWidth = ref(window.innerWidth)
const updateWidth = () => {
  windowWidth.value = window.innerWidth
}
const carouselHeight = computed(() => {
  if (windowWidth.value < 600) return '300px'
  if (windowWidth.value < 900) return '400px'
  return '500px'
})

const showFollowButton = computed(() => {
  if (!post.value) return false
  const currentUserId = userStore.userInfo?.userId
  if (!currentUserId) return true
  return String(currentUserId) !== String(post.value.userId)
})

const postLiked = computed(() => {
  return post.value?.isLiked === 1
})

const postFavourited = computed(() => {
  return post.value?.isFavourite === 1
})

const fetchPostDetail = async () => {
    try {
      const res = await getPostDetail(postId)
      post.value = res
      if (res && Object.prototype.hasOwnProperty.call(res, 'isFollowed')) {
        authorFollowed.value = res.isFollowed === 1
      }
    } catch (error) {
      console.error(error)
    }
}

const normalizeComments = (records) => {
  const list = Array.isArray(records) ? records : []
  const hasChildrenField = list.some(item => Array.isArray(item?.children) && item.children.length)
  const withChildren = list.map(item => {
    const children =
      (Array.isArray(item?.children) && item.children) ||
      (Array.isArray(item?.replyList) && item.replyList) ||
      (Array.isArray(item?.replies) && item.replies) ||
      []
    return { ...item, children }
  })
  if (hasChildrenField) return withChildren

  const parents = []
  const parentMap = new Map()
  const orphans = []
  for (const c of withChildren) {
    if (!c || c.parentId === undefined || c.parentId === null || Number(c.parentId) === 0) {
      parents.push({ ...c, children: [] })
      parentMap.set(c.commentId, parents[parents.length - 1])
    } else {
      orphans.push(c)
    }
  }
  for (const child of orphans) {
    const parent = parentMap.get(child.parentId)
    if (parent) parent.children.push(child)
    else parents.push({ ...child, children: child.children || [] })
  }
  return parents
}

const fetchComments = async (newPage = 1) => {
    page.value = newPage
    try {
        commentLoading.value = true
        const res = await getCommentList({ postId, page: page.value, pageSize: pageSize.value })
        comments.value = normalizeComments(res?.records)
        total.value = res?.total || 0
    } catch (error) {
        console.error(error)
    } finally {
        commentLoading.value = false
    }
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

const handlePostMenuCommand = async (command) => {
  if (!post.value) return
  if (command === 'report_post') {
    openReport(0, post.value.postId)
  }
  if (command === 'report_user') {
    openReport(1, post.value.userId)
  }
  if (command === 'delete_post') {
    try {
      await ElMessageBox.confirm(
        '确定要删除这篇帖子吗？此操作不可逆。',
        '管理操作确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      await deleteAdminPost(post.value.postId)
      ElMessage.success('帖子已成功删除')
      router.push('/')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Delete post failed:', error)
      }
    }
  }
}

const openReportComment = (comment) => {
  if (!comment?.commentId) return
  openReport(2, comment.commentId)
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

const handleToggleFollow = async () => {
  if (!post.value) return
  if (!ensureLoggedIn('请先登录后再关注')) return
  if (followLoading.value) return
  try {
    followLoading.value = true
    const userId = post.value.userId
    if (authorFollowed.value) {
      await unfollowUser(userId)
      authorFollowed.value = false
      ElMessage.success('已取消关注')
    } else {
      await followUser(userId)
      authorFollowed.value = true
      ElMessage.success('关注成功')
    }
  } catch (error) {
    console.error(error)
  } finally {
    followLoading.value = false
  }
}

const handleTogglePostLike = async () => {
  if (!post.value) return
  if (!ensureLoggedIn('请先登录后再点赞')) return
  if (postLikeLoading.value) return

  const previousLiked = post.value.isLiked === 1
  const delta = previousLiked ? -1 : 1
  post.value.isLiked = previousLiked ? 0 : 1
  post.value.likeCount = (post.value.likeCount || 0) + delta

  try {
    postLikeLoading.value = true
    if (previousLiked) await unlikePost(post.value.postId)
    else await likePost(post.value.postId)
  } catch (error) {
    post.value.isLiked = previousLiked ? 1 : 0
    post.value.likeCount = (post.value.likeCount || 0) - delta
    console.error(error)
  } finally {
    postLikeLoading.value = false
  }
}

const handleTogglePostFavourite = async () => {
  if (!post.value) return
  if (!ensureLoggedIn('请先登录后再收藏')) return
  if (postFavouriteLoading.value) return

  const previous = post.value.isFavourite === 1
  const delta = previous ? -1 : 1
  post.value.isFavourite = previous ? 0 : 1
  post.value.favouriteCount = (post.value.favouriteCount || 0) + delta

  try {
    postFavouriteLoading.value = true
    if (previous) await unfavouritePost(post.value.postId)
    else await favouritePost(post.value.postId)
  } catch (error) {
    post.value.isFavourite = previous ? 1 : 0
    post.value.favouriteCount = (post.value.favouriteCount || 0) - delta
    console.error(error)
  } finally {
    postFavouriteLoading.value = false
  }
}

const toggleCommentLike = async (comment) => {
  if (!comment) return
  if (!ensureLoggedIn('请先登录后再点赞')) return

  const commentId = comment.commentId
  if (!commentId) return
  if (commentLikeLoading.value[commentId]) return

  const previous = comment.isLiked === 1
  const delta = previous ? -1 : 1
  comment.isLiked = previous ? 0 : 1
  comment.likeCount = (comment.likeCount || 0) + delta

  try {
    commentLikeLoading.value = { ...commentLikeLoading.value, [commentId]: true }
    if (previous) await unlikeComment(commentId)
    else await likeComment(commentId)
  } catch (error) {
    comment.isLiked = previous ? 1 : 0
    comment.likeCount = (comment.likeCount || 0) - delta
    console.error(error)
  } finally {
    const next = { ...commentLikeLoading.value }
    delete next[commentId]
    commentLikeLoading.value = next
  }
}

const handlePublishComment = async () => {
    if (!commentContent.value.trim()) return
    if (!ensureLoggedIn()) return
    try {
        publishing.value = true
        await publishComment({ postId, parentId: 0, content: commentContent.value })
        ElMessage.success('评论成功')
        commentContent.value = ''
        fetchComments()
        fetchPostDetail() // Update comment count
    } catch (error) {
        console.error(error)
    } finally {
        publishing.value = false
    }
}

const startReply = (comment) => {
  if (!ensureLoggedIn()) return
  replyTarget.value = comment
  replyContent.value = ''
}

const cancelReply = () => {
  replyTarget.value = null
  replyContent.value = ''
}

const isReplyingTo = (comment) => {
  return replyTarget.value && replyTarget.value.commentId === comment.commentId
}

const getReplyParentId = (target) => {
  if (!target) return 0
  const parentId = Number(target.parentId || 0)
  if (parentId && parentId !== 0) return parentId
  return target.commentId
}

const handlePublishReply = async () => {
  if (!replyTarget.value) return
  if (!replyContent.value.trim()) return
  if (!ensureLoggedIn()) return

  try {
    replyPublishing.value = true
    await publishComment({
      postId,
      parentId: getReplyParentId(replyTarget.value),
      content: replyContent.value,
    })
    ElMessage.success('回复成功')
    cancelReply()
    fetchComments(page.value)
    fetchPostDetail()
  } catch (error) {
    console.error(error)
  } finally {
    replyPublishing.value = false
  }
}

const handleDeleteComment = async (commentId) => {
    try {
        await deleteComment(commentId)
        ElMessage.success('删除成功')
        if (replyTarget.value?.commentId === commentId) cancelReply()
        fetchComments(page.value)
        fetchPostDetail() // Update comment count
    } catch (error) {
        console.error(error)
    }
}

const isMyComment = (comment) => {
    if (!userStore.userInfo?.userId) return false
    return userStore.userInfo.userId === comment.userId
}

onMounted(() => {
  if (postId) {
    Promise.all([fetchPostDetail(), fetchComments()])
  }
  window.addEventListener('resize', updateWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
})
</script>

<style scoped>
.post-detail-container {
  padding: 30px;
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.detail-card {
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.05);
    overflow: hidden;
    border: none;
}

.post-header {
    margin-bottom: 24px;
    padding: 0 10px;
}

.post-title {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 20px;
    color: #1a1a1a;
    line-height: 1.3;
}

.user-meta {
    display: flex;
    align-items: center;
    gap: 14px;
}

.user-info {
    display: flex;
    flex-direction: column;
}

.username {
    font-weight: 700;
    font-size: 16px;
    color: #333;
}

.publish-time {
    font-size: 13px;
    color: #999;
    margin-top: 2px;
}

.post-actions {
    margin-left: auto;
}

.media-container {
    margin: 0 -20px 30px -20px;
    background: #000;
}

.custom-carousel {
    background: #f8f8f8;
}

.carousel-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.info-bar {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    padding: 0 10px 20px;
    border-bottom: 1px solid #f5f5f5;
}

.price-box {
    color: #ff4d4f;
    font-weight: 800;
}

.currency {
    font-size: 16px;
    margin-right: 2px;
}

.amount {
    font-size: 28px;
}

.location-box {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #555;
    font-size: 14px;
    background: #f0f2f5;
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: 500;
}

.post-content {
    font-size: 17px;
    line-height: 1.8;
    color: #2c3e50;
    margin-bottom: 30px;
    white-space: pre-wrap;
    padding: 0 10px;
}

.post-tags {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 30px;
    padding: 0 10px;
}

.tag-chip {
    background: #e6f7ff;
    color: #096dd9;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
}

.tag-chip:hover {
    background: #bae7ff;
}

.interaction-bar {
    display: flex;
    gap: 30px;
    color: #666;
    font-size: 15px;
    padding: 10px 10px 20px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.action-btn {
    cursor: pointer;
    transition: all 0.2s;
    padding: 6px 12px;
    border-radius: 8px;
    margin-left: -12px;
}

.action-btn:hover {
    color: #1890ff;
    background: #f0f7ff;
}

.action-btn.active {
    color: #1890ff;
    background: #f0f7ff;
}

/* Comment Section */
.comment-section {
    padding: 20px 10px 0;
}

.section-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 24px;
    color: #333;
}

.comment-input-area {
    display: flex;
    gap: 20px;
    margin-bottom: 40px;
}

.input-wrapper {
    flex: 1;
    position: relative;
}

.comment-textarea :deep(.el-textarea__inner) {
    background: #f8f9fa;
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 12px;
    transition: all 0.3s;
}

.comment-textarea :deep(.el-textarea__inner):focus {
    background: #fff;
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.send-btn {
    margin-top: 12px;
    float: right;
    border-radius: 18px;
    padding: 8px 20px;
}

.comment-list {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.comment-item {
    display: flex;
    gap: 16px;
}

.comment-avatar {
    border: 1px solid #f0f0f0;
}

.comment-body {
    flex: 1;
    background: #fcfcfc;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #f5f5f5;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.comment-user {
    font-weight: 700;
    font-size: 15px;
    color: #333;
}

.comment-time {
    font-size: 12px;
    color: #bbb;
}

.comment-text {
    font-size: 15px;
    color: #444;
    line-height: 1.6;
    margin-bottom: 12px;
}

.comment-actions {
    display: flex;
    gap: 16px;
}

.action-text {
    padding: 0;
    font-size: 13px;
    color: #999;
    font-weight: 500;
}

.action-text:hover {
    color: #409eff;
}

.action-text.active {
    color: #409eff;
}

.action-text.delete:hover {
    color: #ff4d4f;
}

.pagination {
    margin-top: 30px;
    justify-content: center;
}

.load-more-container {
    text-align: center;
    margin-top: 30px;
}

@media (max-width: 600px) {
    .post-detail-container {
        padding: 0;
    }

    .detail-card {
        border-radius: 0;
        box-shadow: none;
    }

    .media-container {
        margin: 0 -20px 20px;
    }

    .post-title {
        font-size: 22px;
    }

    .amount {
        font-size: 24px;
    }
}
</style>
