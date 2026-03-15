<template>
  <div class="notification-container" v-loading="loading">
    <div class="header">
      <h2 class="title">系统公告</h2>
      <el-button size="small" @click="fetchAnnouncements(page)">刷新</el-button>
    </div>

    <el-empty v-if="!loading && announcements.length === 0" description="暂无公告" :image-size="160" />

    <div v-else class="list">
      <el-card v-for="item in announcements" :key="itemKey(item)" class="item" shadow="never" @click="openDetail(item)">
        <div class="item-header">
          <div class="item-title">{{ item.title || item.announcementTitle || '公告' }}</div>
          <div class="item-time">{{ formatTime(item.createTime || item.createAt || item.time) }}</div>
        </div>
        <div class="item-content">{{ previewText(item.content || item.announcementContent || item.text) }}</div>
      </el-card>

      <el-pagination
        v-if="total > pageSize"
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="fetchAnnouncements"
        class="pagination"
      />
    </div>

    <el-dialog v-model="detailVisible" :title="detailTitle" width="680px" center destroy-on-close>
      <div class="detail-meta">{{ detailTime }}</div>
      <div class="detail-content">{{ detailContent }}</div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAnnouncements } from '@/api/user'

const loading = ref(false)
const announcements = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const detailVisible = ref(false)
const detailItem = ref(null)

const itemKey = (item) => {
  return item?.id || item?.announcementId || `${item?.title || ''}-${item?.createTime || ''}`
}

const formatTime = (value) => {
  if (!value) return ''
  return String(value)
}

const previewText = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  return text.length > 120 ? `${text.slice(0, 120)}...` : text
}

const openDetail = (item) => {
  detailItem.value = item
  detailVisible.value = true
}

const detailTitle = computed(() => {
  const item = detailItem.value
  return item?.title || item?.announcementTitle || '公告详情'
})

const detailTime = computed(() => {
  const item = detailItem.value
  return formatTime(item?.createTime || item?.createAt || item?.time)
})

const detailContent = computed(() => {
  const item = detailItem.value
  return String(item?.content || item?.announcementContent || item?.text || '')
})

const fetchAnnouncements = async (newPage = 1) => {
  page.value = newPage
  try {
    loading.value = true
    const res = await getAnnouncements({ page: page.value, pageSize: pageSize.value })
    announcements.value = res?.records || []
    total.value = res?.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAnnouncements(1)
})
</script>

<style scoped>
.notification-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item {
  cursor: pointer;
  border-radius: 12px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.item-title {
  font-weight: 700;
  color: #1a1a1a;
}

.item-time {
  color: #999;
  font-size: 12px;
  flex-shrink: 0;
}

.item-content {
  color: #555;
  line-height: 1.7;
  white-space: pre-wrap;
}

.pagination {
  margin-top: 16px;
  justify-content: center;
}

.detail-meta {
  color: #999;
  font-size: 12px;
  margin-bottom: 12px;
}

.detail-content {
  white-space: pre-wrap;
  color: #333;
  line-height: 1.8;
}
</style>

