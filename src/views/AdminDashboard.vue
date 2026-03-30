<template>
  <div class="admin-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="用户管理" name="users">
        <div class="section-header">
          <div class="section-title">用户列表</div>
          <div class="section-actions">
            <el-input
              v-model="userKeywordFilter"
              placeholder="搜索用户名"
              size="small"
              style="width: 180px"
              clearable
              @clear="fetchUsers(1)"
              @keyup.enter="fetchUsers(1)"
            >
              <template #append>
                <el-button :icon="Search" @click="fetchUsers(1)" />
              </template>
            </el-input>
            <el-button size="small" :loading="userLoading" @click="fetchUsers(1)">刷新</el-button>
          </div>
        </div>

        <el-table :data="users" stripe border v-loading="userLoading" style="width: 100%">
          <el-table-column prop="userId" label="ID" width="80" sortable />
          <el-table-column label="用户" min-width="150">
            <template #default="scope">
              <div class="target-info">
                <el-image
                  v-if="scope.row.image"
                  :src="scope.row.image"
                  class="target-image"
                  :preview-src-list="[scope.row.image]"
                  preview-teleported
                  fit="cover"
                />
                <el-link :underline="false" type="primary" @click="goUser(scope.row.userId)" class="target-name">{{ scope.row.username }}</el-link>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" sortable>
            <template #default="scope">
              <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'" size="small">
                {{ scope.row.status === 0 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="role" label="角色" width="120" sortable>
            <template #default="scope">
              <el-tag :type="getRoleTagType(scope.row.role)" size="small">
                {{ getRoleLabel(scope.row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="scope">
              <template v-if="canManageUser(scope.row)">
                <el-button
                  v-if="scope.row.status === 0"
                  type="danger"
                  size="small"
                  plain
                  @click="handleStatus(scope.row.userId, 1)"
                >禁用</el-button>
                <el-button
                  v-else
                  type="success"
                  size="small"
                  plain
                  @click="handleStatus(scope.row.userId, 0)"
                >启用</el-button>
              </template>

              <el-button
                v-if="userStore.hasPermission('permission:manage')"
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
          layout="prev, pager, next, total"
          :total="userTotal"
          :page-size="10"
          @current-change="fetchUsers"
        />
      </el-tab-pane>

      <el-tab-pane label="帖子管理" name="posts">
        <div class="section-header">
          <div class="section-title">帖子列表</div>
          <div class="section-actions">
            <el-button size="small" :loading="postLoading" @click="fetchPosts(1)">刷新</el-button>
          </div>
        </div>

        <el-table :data="posts" stripe border v-loading="postLoading" style="width: 100%">
          <el-table-column prop="postId" label="ID" width="80" sortable />
          <el-table-column label="帖子" min-width="150">
            <template #default="scope">
              <div class="target-info">
                <el-image
                  v-if="getPostCover(scope.row)"
                  :src="getPostCover(scope.row)"
                  class="target-image"
                  :preview-src-list="getPostPreviewList(scope.row)"
                  preview-teleported
                  fit="cover"
                />
                <el-link :underline="false" type="primary" @click="goPost(scope.row.postId)" class="target-name">{{ scope.row.title }}</el-link>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="作者" min-width="120">
            <template #default="scope">
              <el-link :underline="false" type="primary" @click="goUser(scope.row.userId)">{{ scope.row.username }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" sortable>
             <template #default="scope">
               <el-tag :type="scope.row.status === 2 ? 'success' : (scope.row.status === 1 ? 'danger' : 'warning')" size="small">
                 {{ scope.row.status === 1 ? '未通过' : (scope.row.status === 2 ? '已通过' : '待审核') }}
               </el-tag>
             </template>
          </el-table-column>
          <el-table-column prop="createTime" label="发布时间" width="160" sortable>
            <template #default="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="scope">
              <el-button
                v-if="scope.row.status === 2"
                type="warning"
                size="small"
                plain
                @click="handlePostStatus(scope.row.postId, 1)"
              >拒绝</el-button>
              <el-button
                v-else
                type="success"
                size="small"
                plain
                @click="handlePostStatus(scope.row.postId, 2)"
              >通过</el-button>
              <el-button type="danger" size="small" plain @click="handleDelete(scope.row.postId)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="postTotal"
          :page-size="10"
          @current-change="fetchPosts"
        />
      </el-tab-pane>

      <el-tab-pane label="举报管理" name="reports">
        <div class="section-header">
          <div class="section-title">举报记录</div>
          <div class="section-actions">
            <el-select v-model="reportStatusFilter" size="small" style="width: 120px" placeholder="处理状态" clearable>
              <el-option label="全部" :value="undefined" />
              <el-option label="未处理" :value="0" />
              <el-option label="已处理" :value="1" />
            </el-select>
            <el-button size="small" :loading="reportLoading" @click="fetchReports(reportPage)">刷新</el-button>
          </div>
        </div>

        <el-table :data="reports" stripe border v-loading="reportLoading" style="width: 100%">
          <el-table-column label="ID" width="80">
            <template #default="scope">{{ getReportId(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="举报人" min-width="120">
            <template #default="scope">
              <el-link :underline="false" type="primary" @click="goUser(scope.row.reporterId)">{{ scope.row.reporterUsername || '未知' }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="对象类型" width="120" sortable :sort-method="(a, b) => getReportTargetType(a) - getReportTargetType(b)">
            <template #default="scope">
              <el-tag :type="reportTargetTypeTagType(scope.row)" size="small">{{ reportTargetTypeLabel(scope.row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="举报对象" min-width="150">
            <template #default="scope">
              <div class="target-info">
                <el-image
                  v-if="getReportTargetImage(scope.row)"
                  :src="getReportTargetImage(scope.row)"
                  class="target-image"
                  :preview-src-list="getReportTargetPreviewList(scope.row)"
                  preview-teleported
                  fit="cover"
                />
                <span class="target-name">{{ scope.row.targetName || '未知' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="原因" min-width="150" show-overflow-tooltip>
            <template #default="scope">{{ getReportReason(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100" sortable :sort-method="(a, b) => reportStatusValue(a) - reportStatusValue(b)">
            <template #default="scope">
              <el-tag :type="reportStatusTagType(scope.row)" size="small">{{ reportStatusLabel(scope.row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="160" sortable :sort-method="(a, b) => new Date(a.createTime || a.createAt || a.time) - new Date(b.createTime || b.createAt || b.time)">
            <template #default="scope">{{ getReportTime(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="操作" min-width="200">
            <template #default="scope">
              <div class="action-buttons-container">
                <div class="action-buttons-row">
                  <!-- 用户操作 -->
                  <template v-if="getReportTargetType(scope.row) === 1">
                    <el-button
                      v-if="scope.row.targetStatus === 0"
                      type="danger"
                      size="small"
                      plain
                      @click="handleReportUserStatus(scope.row, 1)"
                    >禁用用户</el-button>
                    <el-button
                      v-else
                      type="info"
                      size="small"
                      plain
                      disabled
                    >已禁用</el-button>
                  </template>

                  <!-- 帖子操作 -->
                  <template v-else-if="getReportTargetType(scope.row) === 0">
                    <el-button
                      v-if="scope.row.targetStatus !== 2"
                      type="success"
                      size="small"
                      plain
                      @click="handleReportPostStatus(scope.row, 2)"
                    >通过</el-button>
                    <el-button
                      v-else
                      type="info"
                      size="small"
                      plain
                      disabled
                    >已通过</el-button>

                    <el-button
                      v-if="scope.row.targetStatus !== 1"
                      type="warning"
                      size="small"
                      plain
                      @click="handleReportPostStatus(scope.row, 1)"
                    >拒绝</el-button>
                    <el-button
                      v-else
                      type="info"
                      size="small"
                      plain
                      disabled
                    >未通过</el-button>

                    <el-button type="danger" size="small" plain @click="handleReportPostDelete(scope.row)">删除</el-button>
                  </template>

                  <!-- 评论操作 -->
                  <template v-else-if="getReportTargetType(scope.row) === 2">
                    <el-button type="danger" size="small" plain @click="handleReportCommentDelete(scope.row)">删除评论</el-button>
                  </template>

                  <el-button size="small" plain @click="openReportDetail(scope.row)">详情</el-button>
                </div>

                <div class="action-buttons-row secondary-row">
                  <el-button
                    type="danger"
                    size="small"
                    plain
                    class="full-width-btn"
                    :loading="Boolean(reportDeleteLoading[getReportId(scope.row)])"
                    @click="handleDeleteReport(scope.row)"
                  >删除记录</el-button>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="reportTotal"
          :page-size="reportPageSize"
          :current-page="reportPage"
          @current-change="fetchReports"
        />
      </el-tab-pane>

      <el-tab-pane label="标签管理" name="tags">
        <div class="section-header">
          <div class="section-title">标签列表</div>
          <div class="section-actions">
            <el-input
              v-model="tagKeywordFilter"
              placeholder="搜索标签"
              size="small"
              style="width: 180px"
              clearable
              @clear="fetchTags(1)"
              @keyup.enter="fetchTags(1)"
            >
              <template #append>
                <el-button :icon="Search" @click="fetchTags(1)" />
              </template>
            </el-input>
            <el-divider direction="vertical" />
            <el-input
              v-model="tagForm.tagName"
              clearable
              size="small"
              placeholder="请输入标签名称"
              style="width: 200px"
              @keyup.enter="handleCreateTags"
            />
            <el-button type="primary" size="small" :loading="tagCreating" @click="handleCreateTags">新增</el-button>
            <el-button size="small" :loading="tagLoading" @click="fetchTags(tagPage)">刷新</el-button>
          </div>
        </div>

        <el-table :data="tags" stripe border v-loading="tagLoading" style="width: 100%">
          <el-table-column prop="tagId" label="ID" width="100" />
          <el-table-column prop="tagName" label="标签" />
          <el-table-column prop="useCount" label="使用次数" width="120" />
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="danger" size="small" plain :loading="Boolean(tagDeleteLoading[scope.row.tagId])" @click="handleDeleteTag(scope.row.tagId)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          background
          layout="prev, pager, next, total"
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
            <el-button type="primary" size="small" @click="announcementDialogVisible = true">发布公告</el-button>
            <el-button size="small" :loading="announcementLoading" @click="fetchAnnouncements(announcementPage)">刷新</el-button>
          </div>
        </div>

        <el-table :data="announcements" stripe border v-loading="announcementLoading" style="width: 100%">
          <el-table-column label="ID" width="100">
            <template #default="scope">{{ getAnnouncementId(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="标题" min-width="180" show-overflow-tooltip>
            <template #default="scope">{{ getAnnouncementTitle(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="内容" min-width="300" show-overflow-tooltip>
            <template #default="scope">{{ previewAnnouncementContent(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="时间" width="160">
            <template #default="scope">{{ getAnnouncementTime(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                plain
                @click="openAnnouncementDetail(scope.row)"
              >查看</el-button>
              <el-button
                type="danger"
                size="small"
                plain
                :loading="Boolean(announcementDeleteLoading[getAnnouncementId(scope.row)])"
                @click="handleDeleteAnnouncement(scope.row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="announcementTotal"
          :page-size="announcementPageSize"
          :current-page="announcementPage"
          @current-change="fetchAnnouncements"
        />
      </el-tab-pane>

      <el-tab-pane label="评论管理" name="comments">
        <div class="section-header">
          <div class="section-title">评论列表</div>
          <div class="section-actions">
            <el-input
              v-model="commentPostIdFilter"
              placeholder="按帖子ID筛选"
              size="small"
              style="width: 180px"
              clearable
              @clear="fetchComments(1)"
              @keyup.enter="fetchComments(1)"
            >
              <template #append>
                <el-button :icon="Search" @click="fetchComments(1)" />
              </template>
            </el-input>
            <el-button size="small" :loading="commentLoading" @click="fetchComments(commentPage)">刷新</el-button>
          </div>
        </div>

        <el-table :data="comments" stripe border v-loading="commentLoading" style="width: 100%">
          <el-table-column prop="commentId" label="ID" width="100" />
          <el-table-column prop="postId" label="帖子ID" width="100">
            <template #default="scope">
              <el-link type="primary" :underline="false" @click="goPost(scope.row.postId)">{{ scope.row.postId }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="评论者" min-width="150">
            <template #default="scope">
              <div class="target-info">
                <el-image
                  v-if="scope.row.avatar"
                  :src="scope.row.avatar"
                  class="target-image"
                  :preview-src-list="[scope.row.avatar]"
                  preview-teleported
                  fit="cover"
                />
                <el-link type="primary" :underline="false" @click="goUser(scope.row.userId)" class="target-name">{{ scope.row.username || '未知用户' }}</el-link>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip />
          <el-table-column label="时间" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                plain
                :loading="Boolean(commentDeleteLoading[scope.row.commentId])"
                @click="handleDeleteComment(scope.row.commentId)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="commentTotal"
          :page-size="commentPageSize"
          :current-page="commentPage"
          @current-change="fetchComments"
        />
      </el-tab-pane>

      <el-tab-pane label="位置管理" name="locals">
        <div class="section-header">
          <div class="section-title">位置分类</div>
          <div class="section-actions">
            <el-button type="primary" size="small" @click="openLocalDialog()">新增位置</el-button>
            <el-button size="small" :loading="localLoading" @click="fetchLocals">刷新</el-button>
          </div>
        </div>

        <el-table :data="locals" stripe border v-loading="localLoading" style="width: 100%">
          <el-table-column prop="localId" label="ID" width="100" />
          <el-table-column prop="localName" label="位置名称" min-width="150" />
          <el-table-column label="操作" width="160">
            <template #default="scope">
              <el-button type="primary" size="small" plain @click="openLocalDialog(scope.row)">编辑</el-button>
              <el-button
                type="danger"
                size="small"
                plain
                @click="handleDeleteLocal(scope.row.localId)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="localDialogVisible" :title="isEditLocal ? '编辑位置' : '新增位置'" width="500px" center destroy-on-close>
      <el-form :model="localForm" label-position="top">
        <el-form-item label="位置名称" required>
          <el-input v-model="localForm.localName" placeholder="例如：天津、北京、上海" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="localDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="localSaving" @click="handleSaveLocal">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialogVisible" title="用户角色" width="520px" center destroy-on-close>
      <div v-loading="roleLoading">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户">{{ roleUser.username }} (ID: {{ roleUser.userId }})</el-descriptions-item>
        </el-descriptions>

        <div style="height: 12px" />

        <el-form label-position="top">
          <el-form-item label="角色" required>
            <el-select
              v-model="selectedRoleId"
              filterable
              placeholder="请选择角色"
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

    <el-dialog v-model="announcementDetailVisible" title="公告详情" width="640px" center destroy-on-close>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ getAnnouncementId(announcementDetail) }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ getAnnouncementTitle(announcementDetail) }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ getAnnouncementTime(announcementDetail) }}</el-descriptions-item>
      </el-descriptions>
      <div style="height: 12px" />
      <el-card shadow="never">
        <div class="announcement-content">{{ getAnnouncementContent(announcementDetail) }}</div>
      </el-card>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="announcementDetailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="reportDetailVisible" title="举报详情" width="720px" center destroy-on-close>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ getReportId(reportDetail) }}</el-descriptions-item>
        <el-descriptions-item label="举报人">
          <el-link :underline="false" type="primary" @click="goUser(reportDetail?.reporterId)">{{ reportDetail?.reporterUsername || '未知' }}</el-link>
        </el-descriptions-item>
        <el-descriptions-item label="对象类型">{{ reportTargetTypeLabel(reportDetail) }}</el-descriptions-item>
        <el-descriptions-item label="举报对象">
          <div class="target-info">
            <el-image
              v-if="getReportTargetImage(reportDetail)"
              :src="getReportTargetImage(reportDetail)"
              class="target-image"
              :preview-src-list="getReportTargetPreviewList(reportDetail)"
              preview-teleported
              fit="cover"
            />
            <span class="target-name">{{ reportDetail?.targetName || '未知' }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="状态">{{ reportStatusLabel(reportDetail) }}</el-descriptions-item>
        <el-descriptions-item label="原因">{{ getReportReason(reportDetail) }}</el-descriptions-item>
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
  updatePostStatus,
  deleteAdminPost,
  publishAnnouncement,
  deleteAdminAnnouncement,
  getReportList,
  updateReportStatus,
  deleteReport as deleteAdminReport,
  createAdminTags,
  deleteAdminTag,
  getUserRoleInfo,
  updateUserRole,
  getAdminCommentList,
  deleteAdminComment,
} from '@/api/admin'
import {
  getLocalList,
  createLocal,
  updateLocal,
  deleteLocal,
} from '@/api/local'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getTags as getPublicTags } from '@/api/post'
import { useRouter } from 'vue-router'
import { getAnnouncements as getUserAnnouncements } from '@/api/user'
import { formatDate } from '@/utils/formatDate'

const activeTab = ref('users')
const users = ref([])
const posts = ref([])
const reports = ref([])
const userTotal = ref(0)
const postTotal = ref(0)
const userLoading = ref(false)
const postLoading = ref(false)
const userKeywordFilter = ref('')
const announcementForm = ref({ title: '', content: '', visibleTo: 0 })

const userStore = useUserStore()
const router = useRouter()

const roleDialogVisible = ref(false)
const roleLoading = ref(false)
const roleSaving = ref(false)
const roleUser = ref({ userId: undefined, username: '' })
const roleOptions = ref([])
const selectedRoleId = ref(undefined)

const announcements = ref([])
const announcementTotal = ref(0)
const announcementPage = ref(1)
const announcementPageSize = ref(10)
const announcementLoading = ref(false)
const announcementDialogVisible = ref(false)
const announcementCreating = ref(false)
const announcementDeleteLoading = ref({})

const announcementDetailVisible = ref(false)
const announcementDetail = ref(null)

const tags = ref([])
const tagTotal = ref(0)
const tagPage = ref(1)
const tagPageSize = ref(10)
const tagLoading = ref(false)
const tagCreating = ref(false)
const tagDeleteLoading = ref({})
const tagForm = ref({ tagName: '' })
const tagKeywordFilter = ref('')

const reportTotal = ref(0)
const reportPage = ref(1)
const reportPageSize = ref(10)
const reportLoading = ref(false)
const reportStatusFilter = ref(undefined)
const reportDeleteLoading = ref({})
const reportDetailVisible = ref(false)
const reportDetail = ref(null)

const comments = ref([])
const commentTotal = ref(0)
const commentPage = ref(1)
const commentPageSize = ref(10)
const commentLoading = ref(false)
const commentPostIdFilter = ref('')
const commentDeleteLoading = ref({})

const locals = ref([])
const localLoading = ref(false)
const localDialogVisible = ref(false)
const localSaving = ref(false)
const isEditLocal = ref(false)
const localForm = ref({ localId: undefined, localName: '' })

const fetchLocals = async () => {
  try {
    localLoading.value = true
    const res = await getLocalList()
    locals.value = res || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取位置列表失败')
  } finally {
    localLoading.value = false
  }
}

const openLocalDialog = (row = null) => {
  if (row) {
    isEditLocal.value = true
    localForm.value = { ...row }
  } else {
    isEditLocal.value = false
    localForm.value = { localId: undefined, localName: '' }
  }
  localDialogVisible.value = true
}

const handleSaveLocal = async () => {
  if (!localForm.value.localName) {
    ElMessage.warning('请输入位置名称')
    return
  }
  try {
    localSaving.value = true
    if (isEditLocal.value) {
      await updateLocal(localForm.value)
      ElMessage.success('更新成功')
    } else {
      await createLocal(localForm.value)
      ElMessage.success('创建成功')
    }
    localDialogVisible.value = false
    fetchLocals()
  } catch (error) {
    console.error(error)
  } finally {
    localSaving.value = false
  }
}

const handleDeleteLocal = async (localId) => {
  try {
    await ElMessageBox.confirm('确定删除该位置分类吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteLocal(localId)
    ElMessage.success('删除成功')
    fetchLocals()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const getRoleLabel = (role) => {
  const map = { 1: '超级管理员', 2: '管理员', 3: '普通用户', 4: '游客' }
  return map[role] || '未知'
}

const getRoleTagType = (role) => {
  const map = { 1: 'danger', 2: 'warning', 3: 'success', 4: 'info' }
  return map[role] || 'info'
}

const canManageUser = (targetUser) => {
  if (!targetUser) return false
  const currentUserRole = userStore.userInfo?.role
  const targetUserRole = Number(targetUser.role)

  // 超级管理员可以管理所有人，除了自己（防止自杀）
  if (currentUserRole === 1) {
    return String(userStore.userInfo.userId) !== String(targetUser.userId)
  }

  // 管理员只能管理普通用户(3)和游客(4)，不能管理超级管理员(1)和其他管理员(2)
  if (currentUserRole === 2) {
    return targetUserRole > 2
  }

  return false
}

const formatRoleLabel = (role) => {
  if (!role) return ''
  const name = role.roleName || ''
  const key = role.roleKey ? `(${role.roleKey})` : ''
  return `${name} ${key}`.trim()
}

const fetchUsers = async (page = 1) => {
  try {
    userLoading.value = true
    const res = await getAdminUserList({
      page,
      pageSize: 10,
      username: userKeywordFilter.value || undefined,
    })
    users.value = res.records || []
    userTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    userLoading.value = false
  }
}

const fetchPosts = async (page = 1) => {
  try {
    postLoading.value = true
    const res = await getAdminPostList({ page, pageSize: 10 })
    posts.value = res.records || []
    postTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    postLoading.value = false
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

const handleDeleteReport = async (row) => {
  const id = getReportId(row)
  if (!id) return
  if (reportDeleteLoading.value[id]) return

  try {
    await ElMessageBox.confirm('确定要删除该举报记录吗？此操作不可撤销。', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    reportDeleteLoading.value = { ...reportDeleteLoading.value, [id]: true }
    await deleteAdminReport(id)
    ElMessage.success('举报记录已删除')
    fetchReports(reportPage.value)
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('删除失败')
    }
  } finally {
    const next = { ...reportDeleteLoading.value }
    delete next[id]
    reportDeleteLoading.value = next
  }
}

const handleReportUserStatus = async (row, status) => {
  const userId = getReportTargetId(row)
  if (!userId) return
  try {
    await updateUserStatus(userId, status)
    ElMessage.success(status === 0 ? '用户已启用' : '用户已禁用')
    // 自动标记为已处理
    if (reportStatusValue(row) === 0) {
      await updateReportStatus(getReportId(row), 1)
    }
    fetchReports(reportPage.value)
    fetchUsers(1)
  } catch (error) {
    console.error(error)
  }
}

const handleReportPostStatus = async (row, status) => {
  const postId = getReportTargetId(row)
  if (!postId) return
  try {
    await updatePostStatus(postId, status)
    ElMessage.success('帖子状态已更新')
    // 自动标记为已处理
    if (reportStatusValue(row) === 0) {
      await updateReportStatus(getReportId(row), 1)
    }
    fetchReports(reportPage.value)
    fetchPosts(1)
  } catch (error) {
    console.error(error)
  }
}

const handleReportPostDelete = async (row) => {
  const postId = getReportTargetId(row)
  if (!postId) return
  try {
    await ElMessageBox.confirm('确定要删除该帖子吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteAdminPost(postId)
    ElMessage.success('帖子已删除')
    // 自动标记为已处理
    if (reportStatusValue(row) === 0) {
      await updateReportStatus(getReportId(row), 1)
    }
    fetchReports(reportPage.value)
    fetchPosts(1)
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const handleReportCommentDelete = async (row) => {
  const commentId = getReportTargetId(row)
  if (!commentId) return
  try {
    await ElMessageBox.confirm('确定要删除该评论吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteAdminComment(commentId)
    ElMessage.success('评论已删除')
    // 自动标记为已处理
    if (reportStatusValue(row) === 0) {
      await updateReportStatus(getReportId(row), 1)
    }
    fetchReports(reportPage.value)
    fetchComments(commentPage.value)
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
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

const getReportTime = (item) => {
  return formatDate(item?.createTime || item?.createAt || item?.time)
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
    const res = await getPublicTags({
      page: tagPage.value,
      pageSize: tagPageSize.value,
      tagName: tagKeywordFilter.value || undefined
    })
    tags.value = res.records || []
    tagTotal.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    tagLoading.value = false
  }
}

const fetchComments = async (page = 1) => {
  try {
    commentLoading.value = true
    commentPage.value = page
    const res = await getAdminCommentList({
      page: commentPage.value,
      pageSize: commentPageSize.value,
      postId: commentPostIdFilter.value || undefined,
    })
    comments.value = res?.records || []
    commentTotal.value = res?.total || 0
  } catch (error) {
    console.error(error)
    ElMessage.error('获取评论列表失败')
  } finally {
    commentLoading.value = false
  }
}

const handleDeleteComment = async (commentId) => {
  if (!commentId) return
  try {
    await ElMessageBox.confirm('确定删除该评论吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  if (commentDeleteLoading.value[commentId]) return
  try {
    commentDeleteLoading.value = { ...commentDeleteLoading.value, [commentId]: true }
    await deleteAdminComment(commentId)
    ElMessage.success('删除成功')
    fetchComments(commentPage.value)
  } catch (error) {
    console.error(error)
    ElMessage.error('删除失败')
  } finally {
    const next = { ...commentDeleteLoading.value }
    delete next[commentId]
    commentDeleteLoading.value = next
  }
}

const handleCreateTags = async () => {
  const tagName = String(tagForm.value.tagName || '').trim()
  if (!tagName) {
    ElMessage.warning('请输入标签名称')
    return
  }
  try {
    tagCreating.value = true
    await createAdminTags([{ tagName }])
    ElMessage.success('新增成功')
    tagForm.value.tagName = ''
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
    const next = { ...tagDeleteLoading.value }
    delete next[tagId]
    tagDeleteLoading.value = next
  }
}

const handleStatus = async (userId, status) => {
  // 安全校验
  const targetUser = users.value.find(u => u.userId === userId)
  if (targetUser && !canManageUser(targetUser)) {
    ElMessage.error('权限不足，无法操作此用户')
    return
  }

  try {
    await updateUserStatus(userId, status)
    ElMessage.success(status === 0 ? '用户已启用' : '用户已禁用')
    fetchUsers(1)
  } catch (error) {
    console.error(error)
  }
}

const handlePostStatus = async (postId, status) => {
  try {
    await updatePostStatus(postId, status)
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

const getPostCover = (post) => {
  if (!post?.images) return ''
  if (Array.isArray(post.images)) {
    return post.images[0] || ''
  }
  return post.images
}

const getPostPreviewList = (post) => {
  const cover = getPostCover(post)
  if (!cover) return []
  if (Array.isArray(post.images)) {
    return post.images
  }
  return [post.images]
}

const getReportTargetImage = (report) => {
  if (!report?.targetImage) return ''
  if (Array.isArray(report.targetImage)) {
    return report.targetImage[0] || ''
  }
  return report.targetImage
}

const getReportTargetPreviewList = (report) => {
  const cover = getReportTargetImage(report)
  if (!cover) return []
  if (Array.isArray(report.targetImage)) {
    return report.targetImage
  }
  return [report.targetImage]
}

const getAnnouncementId = (item) => {
  return item?.id || item?.announcementId || item?.noticeId
}

const getAnnouncementTitle = (item) => {
  return item?.title || item?.announcementTitle || item?.noticeTitle || '公告'
}

const getAnnouncementTime = (item) => {
  return formatDate(item?.createTime || item?.createAt || item?.time)
}

const previewAnnouncementContent = (item) => {
  const text = String(item?.content || item?.announcementContent || item?.noticeContent || item?.text || '').trim()
  if (!text) return ''
  return text.length > 60 ? `${text.slice(0, 60)}...` : text
}

const getAnnouncementContent = (item) => {
  return String(item?.content || item?.announcementContent || item?.noticeContent || item?.text || '').trim()
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
    const next = { ...announcementDeleteLoading.value }
    delete next[id]
    announcementDeleteLoading.value = next
  }
}

const openAnnouncementDetail = (item) => {
  announcementDetail.value = item
  announcementDetailVisible.value = true
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
  if (!canManageUser(user)) {
    ElMessage.warning('无法修改此用户的角色')
    return
  }
  roleDialogVisible.value = true
  roleLoading.value = true
  roleUser.value = { userId: user.userId, username: user.username }
  roleOptions.value = []
  selectedRoleId.value = undefined

  try {
    const res = await getUserRoleInfo(user.userId)
    roleOptions.value = (res?.roleList || []).filter(r => String(r?.status || '0') === '0')
    const assignedIds = res?.assignedRoleIds || []
    selectedRoleId.value = assignedIds.length > 0 ? assignedIds[0] : undefined
  } catch (error) {
    console.error(error)
  } finally {
    roleLoading.value = false
  }
}

const saveUserRoles = async () => {
  if (!roleUser.value.userId) return
  if (selectedRoleId.value === undefined || selectedRoleId.value === null) {
    ElMessage.warning('请选择一个角色')
    return
  }
  if (roleSaving.value) return
  try {
    roleSaving.value = true
    await updateUserRole({
      userId: roleUser.value.userId,
      roleIds: [selectedRoleId.value],
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
  if (tab === 'comments') fetchComments(1)
  if (tab === 'locals') fetchLocals()
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
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: #409eff;
  border-radius: 2px;
}

.section-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.el-table {
  margin-top: 8px;
  border-radius: 4px;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

.target-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.target-image {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.target-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.action-buttons-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.secondary-row {
  border-top: 1px dashed #ebeef5;
  padding-top: 8px;
  margin-top: 4px;
}

.full-width-btn {
  width: 100%;
}

.announcement-content {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 14px;
  color: #2c3e50;
}
</style>
