<template>
  <div class="content-area" v-loading="loading">
    <!-- Filters -->
    <div class="filter-container">
      <div class="filter-bar">
        <div class="filter-main">
          <div class="filter-row">
            <div class="row-label">排序方式</div>
            <div class="row-options">
              <div
                class="option-item"
                :class="{ active: sortType === 'new' }"
                @click="sortType = 'new'; applyFilters()"
              >
                最新发布
              </div>
              <div
                class="option-item"
                :class="{ active: sortType === 'hot' }"
                @click="sortType = 'hot'; applyFilters()"
              >
                热门推荐
              </div>
            </div>
          </div>
        </div>

        <div class="filter-more-btn" @click="showAdvancedFilters = !showAdvancedFilters">
          <span>更多筛选</span>
          <el-icon :class="{ 'is-active': showAdvancedFilters }">
            <ArrowDown v-if="!showAdvancedFilters" />
            <ArrowUp v-else />
          </el-icon>
        </div>
      </div>

      <el-collapse-transition>
        <div v-show="showAdvancedFilters" class="advanced-filter-panel">
          <div class="filter-row">
            <div class="row-label">位置分类</div>
            <div class="row-options scrollable">
              <div
                v-for="filter in filters"
                :key="filter"
                class="option-item"
                :class="{ active: activeFilter === filter }"
                @click="activeFilter = filter"
              >
                {{ filter }}
              </div>
            </div>
          </div>

          <div class="filter-row">
            <div class="row-label">价格区间</div>
            <div class="row-options">
              <div class="price-range">
                <el-input-number
                  v-model="priceMin"
                  :min="0"
                  placeholder="最低"
                  size="small"
                  :controls="false"
                  class="price-input"
                />
                <span class="separator">-</span>
                <el-input-number
                  v-model="priceMax"
                  :min="0"
                  placeholder="最高"
                  size="small"
                  :controls="false"
                  class="price-input"
                />
                <span class="unit">元</span>
                <el-button type="primary" size="small" @click="applyFilters" class="price-btn">确认</el-button>
              </div>
            </div>
          </div>

          <div class="filter-row">
            <div class="row-label">标签筛选</div>
            <div class="row-options">
              <el-select
                v-model="selectedTags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入标签"
                size="small"
                style="width: 300px"
                @change="applyFilters"
              >
                <el-option
                  v-for="item in predefinedTags"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
              <el-button
                link
                size="small"
                class="reset-btn"
                @click="resetFilters"
                :icon="RefreshRight"
              >
                重置全部筛选
              </el-button>
            </div>
          </div>
        </div>
      </el-collapse-transition>
    </div>

      <!-- Card Grid -->
      <div class="card-grid" v-if="foodList.length > 0">
        <div v-for="item in foodList" :key="item.postId" class="food-card" @click="handleCardClick(item.postId)">
          <div class="card-image-wrapper">
            <img :src="item.images && item.images[0] ? item.images[0] : 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'" loading="lazy" />
            <div class="card-overlay" v-if="item.price">
                <span class="price-tag">¥ {{ item.price }}</span>
            </div>
          </div>

          <div class="card-content">
            <h3 class="card-title">{{ item.title }}</h3>

            <div class="card-tags" v-if="item.tags && item.tags.length">
                <span v-for="tag in item.tags.slice(0, 2)" :key="tag" class="tag-item">#{{ tag }}</span>
            </div>

            <div class="card-footer">
              <div class="author-info" @click.stop="router.push({ name: 'me', query: { userId: item.userId } })" style="cursor: pointer;">
                <el-avatar :size="24" :src="item.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'"></el-avatar>
                <span class="author-name">{{ item.username }}</span>
              </div>
              <div class="card-stats">
                <span class="stat-item"><el-icon><Monitor /></el-icon> {{ item.viewCount }}</span>
                <span class="stat-item action" :class="{ active: item.isLiked === 1 }" @click.stop="toggleLike(item)">
                  <el-icon><Star /></el-icon> {{ item.likeCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="这里空空如也，快去发布第一条内容吧！" :image-size="200" />
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Monitor,
  Star,
  ArrowDown,
  ArrowUp,
  RefreshRight,
} from '@element-plus/icons-vue'
import { getPostList, getTags } from '@/api/post'
import { likePost, unlikePost } from '@/api/user'
import { getLocalList } from '@/api/local'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const filters = ref(['全部'])
const localOptions = ref([])
const activeFilter = ref('全部')
const loading = ref(false)
const foodList = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showAdvancedFilters = ref(false)

// Advanced filters
const sortType = ref('new')
const priceMin = ref(undefined)
const priceMax = ref(undefined)
const selectedTags = ref([])
const predefinedTags = ref([])

const fetchLocals = async () => {
  try {
    const res = await getLocalList()
    localOptions.value = res || []
    filters.value = ['全部', ...localOptions.value.map(item => item.localName)]
  } catch (error) {
    console.error('Failed to fetch locations:', error)
  }
}

const fetchTags = async () => {
  try {
    const res = await getTags({
      page: 1,
      pageSize: 100
    })
    if (res && res.records) {
      // According to Tag entity: tagId, tagName, useCount, createTime
      predefinedTags.value = res.records.map(item => {
        if (typeof item === 'string') return item
        return item.tagName || item.name || String(item)
      })
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: route.query.keyword || '',
      sort: sortType.value
    }

    if (activeFilter.value !== '全部') {
      const selectedLocal = localOptions.value.find(item => item.localName === activeFilter.value)
      if (selectedLocal) {
        params.local = selectedLocal.localId
      }
    }

    // Price range
    if (priceMin.value !== undefined || priceMax.value !== undefined) {
       const min = priceMin.value !== undefined ? priceMin.value : 0
       const max = priceMax.value !== undefined ? priceMax.value : 999999
       params.price = `${min}-${max}`
    }

    // Tags
    if (selectedTags.value && selectedTags.value.length > 0) {
        params.tags = selectedTags.value.join(',')
    }

    const res = await getPostList(params)
    if (res && res.records) {
        foodList.value = res.records
        total.value = res.total
    } else {
        foodList.value = []
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const ensureLoggedIn = (message = '请先登录后再操作') => {
  if (userStore.token) return true
  ElMessage.warning(message)
  router.push({ name: 'login' })
  return false
}

const toggleLike = async (item) => {
  if (!item) return
  if (!ensureLoggedIn('请先登录后再点赞')) return
  if (item.__likeLoading) return

  const previous = item.isLiked === 1
  const delta = previous ? -1 : 1
  item.isLiked = previous ? 0 : 1
  item.likeCount = (item.likeCount || 0) + delta
  item.__likeLoading = true

  try {
    if (previous) await unlikePost(item.postId)
    else await likePost(item.postId)
  } catch (error) {
    item.isLiked = previous ? 1 : 0
    item.likeCount = (item.likeCount || 0) - delta
    console.error(error)
  } finally {
    item.__likeLoading = false
  }
}

const applyFilters = () => {
  page.value = 1
  fetchPosts()
}

const resetFilters = () => {
    sortType.value = 'new'
    activeFilter.value = '全部'
    priceMin.value = undefined
    priceMax.value = undefined
    selectedTags.value = []
    applyFilters()
}

watch(activeFilter, () => {
  page.value = 1
  fetchPosts()
})

// Watch route query for search keyword changes
watch(() => route.query.keyword, () => {
    page.value = 1
    fetchPosts()
})

const handleCardClick = (id) => {
  router.push({ name: 'post-detail', params: { id } })
}

onMounted(() => {
  fetchPosts()
  fetchTags()
  fetchLocals()
})
</script>

<style scoped>
.content-area {
  padding: 24px 40px;
  min-height: 500px;
}

.filter-container {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-main {
  flex: 1;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.row-label {
  width: 80px;
  font-size: 14px;
  color: #909399;
  padding-top: 6px;
  flex-shrink: 0;
}

.row-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.row-options.scrollable {
  max-height: 100px;
  overflow-y: auto;
}

.option-item {
  padding: 6px 16px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.option-item:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.option-item.active {
  color: #409eff;
  background-color: #ecf5ff;
  font-weight: 600;
}

.filter-more-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.2s;
  height: 32px;
  background: #fff;
}

.filter-more-btn:hover {
  color: #409eff;
  border-color: #409eff;
}

.filter-more-btn .el-icon {
  transition: transform 0.3s;
}

.advanced-filter-panel {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-input {
  width: 100px;
}

.price-input :deep(.el-input__wrapper) {
  padding-left: 8px;
  padding-right: 8px;
}

.separator {
  color: #dcdfe6;
}

.unit {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
}

.price-btn {
  margin-left: 8px;
}

.reset-btn {
  margin-left: 16px;
  color: #909399;
}

.reset-btn:hover {
  color: #f56c6c;
}

/* Grid Styles */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.food-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
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
  transition: opacity 0.3s;
}

.card-overlay {
    position: absolute;
    bottom: 10px;
    right: 10px;
}

.price-tag {
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    backdrop-filter: blur(4px);
}

.card-content {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: #222;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
}

.tag-item {
    font-size: 12px;
    color: #888;
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
}

.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-name {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-stats {
    display: flex;
    gap: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-item.action {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 8px;
  transition: all 0.2s;
}

.stat-item.action:hover {
  color: #409eff;
  background: #f0f7ff;
}

.stat-item.action.active {
  color: #409eff;
  background: #f0f7ff;
}
</style>
