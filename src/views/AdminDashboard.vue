<template>
  <div class="admin-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="用户管理" name="users">
        <el-table :data="users" style="width: 100%">
          <el-table-column prop="userId" label="ID" width="80" />
          <el-table-column prop="username" label="用户名">
            <template #default="scope">
              <el-link :underline="false" type="primary" @click="goUser(scope.row.userId)">{{ scope.row.username }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
                {{ scope.row.status === 0 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button
                v-if="scope.row.status === 0"
                type="danger"
                size="small"
                @click="handleStatus(scope.row.userId, 1)"
              >禁用</el-button>
              <el-button
                v-else
                type="success"
                size="small"
                @click="handleStatus(scope.row.userId, 0)"
              >启用</el-button>

              <el-button
                type="primary"
                size="small"
                plain
                @click="openRoleDialog(scope.row)"
              >角色</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="userTotal"
          @current-change="fetchUsers"
        />
      </el-tab-pane>

      <el-tab-pane label="帖子管理" name="posts">
        <el-table :data="posts" style="width: 100%">
          <el-table-column prop="postId" label="ID" width="80" />
          <el-table-column prop="title" label="标题">
            <template #default="scope">
              <el-link :underline="false" type="primary" @click="goPost(scope.row.postId)">{{ scope.row.title }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="作者">
            <template #default="scope">
              <el-link :underline="false" @click="goUser(scope.row.userId)">{{ scope.row.username }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
             <template #default="scope">
                 {{ scope.row.status === 1 ? '未通过' : (scope.row.status === 2 ? '已通过' : '待审核') }}
             </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button type="success" size="small" @click="handleAudit(scope.row.postId, 2)">通过</el-button>
              <el-button type="warning" size="small" @click="handleAudit(scope.row.postId, 1)">拒绝</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row.postId)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="postTotal"
          @current-change="fetchPosts"
        />
      </el-tab-pane>

      <el-tab-pane label="举报管理" name="reports">
        <div class="section-header">
          <div class="section-title">举报记录</div>
          <div class="section-actions">
            <el-select v-model="reportStatusFilter" size="small" style="width: 160px" placeholder="处理状态">
              <el-option label="全部" :value="undefined" />
              <el-option label="未处理" :value="0" />
              <el-option label="已处理" :value="1" />
            </el-select>
            <el-button size="small" :loading="reportLoading" @click="fetchReports(reportPage)">刷新</el-button>
          </div>
        </div>

        <el-table :data="reports" style="width: 100%" v-loading="reportLoading">
          <el-table-column label="ID" width="90">
            <template #default="scope">{{ getReportId(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="对象类型" width="110">
            <template #default="scope">
              <el-tag :type="reportTargetTypeTagType(scope.row)">{{ reportTargetTypeLabel(scope.row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="对象ID" width="110">
            <template #default="scope">{{ getReportTargetId(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="原因" min-width="200">
            <template #default="scope">{{ getReportReason(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="证据" min-width="200">
            <template #default="scope">{{ previewReportEvidence(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="scope">
              <el-tag :type="reportStatusTagType(scope.row)">{{ reportStatusLabel(scope.row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="180">
            <template #default="scope">{{ getReportTime(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="openReportDetail(scope.row)">详情</el-button>
              <el-button size="small" type="primary" plain @click="goReportTarget(scope.row)">跳转</el-button>
              <el-switch
                v-model="scope.row.isStatus"
                :active-value="1"
                :inactive-value="0"
                :loading="Boolean(reportStatusUpdating[getReportId(scope.row)])"
                @change="(val) => handleUpdateReportStatus(scope.row, val)"
              />
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          background
          layout="prev, pager, next"
          :total="reportTotal"
          :page-size="reportPageSize"
          :current-page="reportPage"
          @current-change="fetchReports"
        />
      </el-tab-pane>

      <el-tab-pane label="标签管理" name="tags">
        <el-form :model="tagForm" label-position="top" style="max-width: 720px">
          <el-form-item label="批量新增标签">
            <el-select
              v-model="tagForm.tagNames"
              multiple
              filterable
              allow-create
              default-first-option
              clearable
              placeholder="输入标签名称并回车，可多选"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="tagCreating" @click="handleCreateTags">新增</el-button>
            <el-button :loading="tagLoading" @click="fetchTags(tagPage)">刷新</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="tags" style="width: 100%" v-loading="tagLoading">
          <el-table-column prop="tagId" label="ID" width="100" />
          <el-table-column prop="tagName" label="标签" />
          <el-table-column prop="useCount" label="使用次数" width="120" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="danger" size="small" :loading="Boolean(tagDeleteLoading[scope.row.tagId])" @click="handleDeleteTag(scope.row.tagId)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="tagTotal"
          :page-size="tagPageSize"
          :current-page="tagPage"
          @current-change="fetchTags"
        />
      </el-tab-pane>

      <el-tab-pane label="公告管理" name="announcement">
        <div class="section-header">
          <div class="section-title">系统公告</div>
          <div class="section-actions">
            <el-button type="primary" @click="announcementDialogVisible = true">新增公告</el-button>
            <el-button :loading="announcementLoading" @click="fetchAnnouncements(announcementPage)">刷新</el-button>
          </div>
        </div>

        <el-table :data="announcements" style="width: 100%" v-loading="announcementLoading">
          <el-table-column label="ID" width="100">
            <template #default="scope">{{ getAnnouncementId(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="标题" min-width="200">
            <template #default="scope">{{ getAnnouncementTitle(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="内容" min-width="320">
            <template #default="scope">{{ previewAnnouncementContent(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="时间" width="180">
            <template #default="scope">{{ getAnnouncementTime(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                :loading="Boolean(announcementDeleteLoading[getAnnouncementId(scope.row)])"
                @click="handleDeleteAnnouncement(scope.row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          background
          layout="prev, pager, next"
          :total="announcementTotal"
          :page-size="announcementPageSize"
          :current-page="announcementPage"
          @current-change="fetchAnnouncements"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="roleDialogVisible" title="用户角色" width="520px" center destroy-on-close>
      <div v-loading="roleLoading">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户">{{ roleUser.username }} (ID: {{ roleUser.userId }})</el-descriptions-item>
        </el-descriptions>

        <div style="height: 12px" />

        <el-form label-position="top">
          <el-form-item label="角色">
            <el-select
              v-model="selectedRoleIds"
              multiple
              filterable
              clearable
              placeholder="请选择角色（可为空，表示清空角色）"
              style="width: 100%"
            >
              <el-option
                v-for="role in roleOptions"
                :key="role.roleId"
                :label="formatRoleLabel(role)"
                :value="role.roleId"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="roleSaving" @click="saveUserRoles">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="announcementDialogVisible" title="新增公告" width="640px" center destroy-on-close>
      <el-form :model="announcementForm" label-position="top">
        <el-form-item label="标题">
          <el-input v-model="announcementForm.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input type="textarea" :rows="6" v-model="announcementForm.content" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="announcementDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="announcementCreating" @click="handleCreateAnnouncement">发布</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="reportDetailVisible" title="举报详情" width="720px" center destroy-on-close>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ getReportId(reportDetail) }}</el-descriptions-item>
        <el-descriptions-item label="对象类型">{{ reportTargetTypeLabel(reportDetail) }}</el-descriptions-item>
        <el-descriptions-item label="对象ID">{{ getReportTargetId(reportDetail) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ reportStatusLabel(reportDetail) }}</el-descriptions-item>
        <el-descriptions-item label="原因">{{ getReportReason(reportDetail) }}</el-descriptions-item>
        <el-descriptions-item label="证据">{{ getReportEvidence(reportDetail) }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ getReportTime(reportDetail) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDetailVisible = false">关闭</el-button>
          <el-button type="primary" @click="goReportTarget(reportDetail)">跳转到对象</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  getAdminUserList,
  updateUserStatus,
  getAdminPostList,
  auditPost,
  deleteAdminPost,
  publishAnnouncement,
  deleteAdminAnnouncement,
  getReportList,
  updateReportStatus,
  createAdminTags,
  deleteAdminTag,
  getUserRoleInfo,
  updateUserRole,
} from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getTags as getPublicTags } from '@/api/post'
import { useRouter } from 'vue-router'
import { getAnnouncements as getUserAnnouncements } from '@/api/user'

const activeTab = ref('users')
const users = ref([])
const posts = ref([])
const reports = ref([])
const userTotal = ref(0)
const postTotal = ref(0)
const announcementForm = ref({ title: '', content: '', visibleTo: 0 })

const userStore = useUserStore()
const router = useRouter()

const roleDialogVisible = ref(false)
const roleLoading = ref(false)
const roleSaving = ref(false)
const roleUser = ref({ userId: undefined, username: '' })
const roleOptions = ref([])
const selectedRoleIds = ref([])

const announcements = ref([])
const announcementTotal = ref(0)
const announcementPage = ref(1)
const announcementPageSize = ref(10)
const announcementLoading = ref(false)
const announcementDialogVisible = ref(false)
const announcementCreating = ref(false)
const announcementDeleteLoading = ref({})

const tags = ref([])
const tagTotal = ref(0)
const tagPage = ref(1)
const tagPageSize = ref(10)
const tagLoading = ref(false)
const tagCreating = ref(false)
const tagDeleteLoading = ref({})
const tagForm = ref({ tagNames: [] })

const reportTotal = ref(0)
const reportPage = ref(1)
const reportPageSize = ref(10)
const reportLoading = ref(false)
const reportStatusFilter = ref(undefined)
const reportStatusUpdating = ref({})
const reportDetailVisible = ref(false)
const reportDetail = ref(null)

const formatRoleLabel = (role) => {
  if (!role) return ''
  const name = role.roleName || ''
  const key = role.roleKey ? `(${role.roleKey})` : ''
  return `${name} ${key}`.trim()
}

const fetchUsers = async (page = 1) => {
  try {
    const res = await getAdminUserList({ page, pageSize: 10 })
    users.value = res.records || []
    userTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  }
}

const fetchPosts = async (page = 1) => {
  try {
    const res = await getAdminPostList({ page, pageSize: 10 })
    posts.value = res.records || []
    postTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  }
}

const fetchReports = async (page = 1) => {
  try {
    reportLoading.value = true
    reportPage.value = page
    const res = await getReportList({
      page: reportPage.value,
      pageSize: reportPageSize.value,
      isStatus: reportStatusFilter.value,
    })
    const list = Array.isArray(res?.records) ? res.records : []
    reports.value = list.map(item => {
      const normalized = { ...item }
      const v = reportStatusValue(normalized)
      if (v !== undefined) normalized.isStatus = v
      return normalized
    })
    reportTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    reportLoading.value = false
  }
}

const handleUpdateReportStatus = async (row, isStatus) => {
  const id = getReportId(row)
  if (!id) return
  if (reportStatusUpdating.value[id]) return

  const previous = reportStatusValue(row)
  row.isStatus = isStatus

  try {
    reportStatusUpdating.value = { ...reportStatusUpdating.value, [id]: true }
    await updateReportStatus(id)
    ElMessage.success('已更新')
    fetchReports(reportPage.value)
  } catch (error) {
    row.isStatus = previous
    console.error(error)
  } finally {
    const { [id]: _, ...rest } = reportStatusUpdating.value
    reportStatusUpdating.value = rest
  }
}

const getReportId = (item) => {
  return item?.id || item?.reportId
}

const getReportTargetType = (item) => {
  const raw = item?.targetType ?? item?.type
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : raw
  return Number.isFinite(n) ? n : undefined
}

const getReportTargetId = (item) => {
  return item?.targetId
}

const getReportReason = (item) => {
  return item?.reasonText || item?.reason || ''
}

const getReportEvidence = (item) => {
  return item?.evidence || ''
}

const getReportTime = (item) => {
  return item?.createTime || item?.createAt || item?.time || ''
}

const reportTargetTypeLabel = (item) => {
  const t = getReportTargetType(item)
  if (t === 0) return '帖子'
  if (t === 1) return '用户'
  if (t === 2) return '评论'
  return '未知'
}

const reportTargetTypeTagType = (item) => {
  const t = getReportTargetType(item)
  if (t === 0) return 'success'
  if (t === 1) return 'warning'
  if (t === 2) return 'info'
  return 'default'
}

const reportStatusValue = (item) => {
  const raw = item?.isStatus ?? item?.status
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : raw
  return Number.isFinite(n) ? n : undefined
}

const reportStatusLabel = (item) => {
  const v = reportStatusValue(item)
  if (v === 0) return '未处理'
  if (v === 1) return '已处理'
  return String(item?.status ?? item?.isStatus ?? '') || '未知'
}

const reportStatusTagType = (item) => {
  const v = reportStatusValue(item)
  if (v === 0) return 'danger'
  if (v === 1) return 'success'
  return 'info'
}

const previewReportEvidence = (item) => {
  const text = String(getReportEvidence(item) || '').trim()
  if (!text) return ''
  return text.length > 40 ? `${text.slice(0, 40)}...` : text
}

const openReportDetail = (item) => {
  reportDetail.value = item
  reportDetailVisible.value = true
}

const goReportTarget = (item) => {
  const t = getReportTargetType(item)
  const id = getReportTargetId(item)
  if (t === 0) return goPost(id)
  if (t === 1) return goUser(id)
  if (t === 2) {
    const postId = item?.postId
    if (postId) return goPost(postId)
    ElMessage.warning('该举报对象为评论，缺少帖子ID，无法跳转')
    return
  }
  ElMessage.warning('未知举报对象，无法跳转')
}

const fetchTags = async (page = 1) => {
  try {
    tagLoading.value = true
    tagPage.value = page
    const res = await getPublicTags({ page: tagPage.value, pageSize: tagPageSize.value })
    tags.value = res.records || []
    tagTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    tagLoading.value = false
  }
}

const normalizeTagNames = (names) => {
  const list = Array.isArray(names) ? names : []
  const cleaned = list.map(s => String(s || '').trim()).filter(Boolean)
  return Array.from(new Set(cleaned))
}

const handleCreateTags = async () => {
  const names = normalizeTagNames(tagForm.value.tagNames)
  if (names.length === 0) {
    ElMessage.warning('请输入至少一个标签名称')
    return
  }
  try {
    tagCreating.value = true
    await createAdminTags(names.map(tagName => ({ tagName })))
    ElMessage.success('新增成功')
    tagForm.value.tagNames = []
    fetchTags(1)
  } catch (error) {
    console.error(error)
  } finally {
    tagCreating.value = false
  }
}

const handleDeleteTag = async (tagId) => {
  if (!tagId) return
  if (tagDeleteLoading.value[tagId]) return
  try {
    tagDeleteLoading.value = { ...tagDeleteLoading.value, [tagId]: true }
    await deleteAdminTag(tagId)
    ElMessage.success('删除成功')
    fetchTags(tagPage.value)
  } catch (error) {
    console.error(error)
  } finally {
    const { [tagId]: _, ...rest } = tagDeleteLoading.value
    tagDeleteLoading.value = rest
  }
}

const handleStatus = async (userId, status) => {
  try {
    await updateUserStatus(userId, status)
    ElMessage.success('操作成功')
    fetchUsers()
  } catch (error) {
    console.error(error)
  }
}

const handleAudit = async (postId, status) => {
  try {
    await auditPost(postId, status)
    ElMessage.success('操作成功')
    fetchPosts()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (postId) => {
  try {
    await deleteAdminPost(postId)
    ElMessage.success('删除成功')
    fetchPosts()
  } catch (error) {
    console.error(error)
  }
}

const getAnnouncementId = (item) => {
  return item?.id || item?.announcementId || item?.noticeId
}

const getAnnouncementTitle = (item) => {
  return item?.title || item?.announcementTitle || item?.noticeTitle || '公告'
}

const getAnnouncementTime = (item) => {
  return item?.createTime || item?.createAt || item?.time || ''
}

const previewAnnouncementContent = (item) => {
  const text = String(item?.content || item?.announcementContent || item?.noticeContent || item?.text || '').trim()
  if (!text) return ''
  return text.length > 60 ? `${text.slice(0, 60)}...` : text
}

const fetchAnnouncements = async (page = 1) => {
  try {
    announcementLoading.value = true
    announcementPage.value = page
    const res = await getUserAnnouncements({ page: announcementPage.value, pageSize: announcementPageSize.value })
    announcements.value = res?.records || []
    announcementTotal.value = res?.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    announcementLoading.value = false
  }
}

const handleCreateAnnouncement = async () => {
  const title = String(announcementForm.value.title || '').trim()
  const content = String(announcementForm.value.content || '').trim()
  if (!title || !content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  try {
    announcementCreating.value = true
    await publishAnnouncement({ ...announcementForm.value, title, content })
    ElMessage.success('发布成功')
    announcementForm.value = { title: '', content: '', visibleTo: 0 }
    announcementDialogVisible.value = false
    fetchAnnouncements(1)
  } catch (error) {
    console.error(error)
  } finally {
    announcementCreating.value = false
  }
}

const handleDeleteAnnouncement = async (item) => {
  const id = getAnnouncementId(item)
  if (!id) {
    ElMessage.error('公告ID缺失，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm('确定删除该公告吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  if (announcementDeleteLoading.value[id]) return
  try {
    announcementDeleteLoading.value = { ...announcementDeleteLoading.value, [id]: true }
    await deleteAdminAnnouncement(id)
    ElMessage.success('删除成功')
    fetchAnnouncements(announcementPage.value)
  } catch (error) {
    console.error(error)
  } finally {
    const { [id]: _, ...rest } = announcementDeleteLoading.value
    announcementDeleteLoading.value = rest
  }
}

const goUser = (userId) => {
  if (!userId) return
  router.push({ name: 'me', query: { userId } })
}

const goPost = (postId) => {
  if (!postId) return
  router.push({ name: 'post-detail', params: { id: postId } })
}

const openRoleDialog = async (user) => {
  roleDialogVisible.value = true
  roleLoading.value = true
  roleUser.value = { userId: user.userId, username: user.username }
  roleOptions.value = []
  selectedRoleIds.value = []

  try {
    const res = await getUserRoleInfo(user.userId)
    roleOptions.value = (res?.roleList || []).filter(r => String(r?.status || '0') === '0')
    selectedRoleIds.value = res?.assignedRoleIds || []
  } catch (error) {
    console.error(error)
  } finally {
    roleLoading.value = false
  }
}

const saveUserRoles = async () => {
  if (!roleUser.value.userId) return
  if (roleSaving.value) return
  try {
    roleSaving.value = true
    await updateUserRole({
      userId: roleUser.value.userId,
      roleIds: selectedRoleIds.value,
    })
    ElMessage.success('角色已更新')
    ElMessage.warning('该用户登录态已失效，需要重新登录生效')
    roleDialogVisible.value = false

    const currentUserId = userStore.userInfo?.userId
    if (currentUserId && String(currentUserId) === String(roleUser.value.userId)) {
      userStore.clearToken()
      window.location.href = `${import.meta.env.BASE_URL || '/'}login`
    }
  } catch (error) {
    console.error(error)
  } finally {
    roleSaving.value = false
  }
}

onMounted(() => {
  fetchUsers()
  fetchPosts()
})

watch(activeTab, (tab) => {
  if (tab === 'reports') fetchReports()
  if (tab === 'tags') fetchTags(1)
  if (tab === 'announcement') fetchAnnouncements(1)
})

watch(reportStatusFilter, () => {
  if (activeTab.value !== 'reports') return
  fetchReports(1)
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-weight: 700;
}

.section-actions {
  display: flex;
  gap: 10px;
}
</style>
