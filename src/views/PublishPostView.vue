<template>
  <div class="publish-container">
    <div class="page-header">
        <h2>发布新内容</h2>
        <p class="subtitle">分享你的美食发现</p>
    </div>

    <el-card class="publish-card" :class="{ 'is-active': tagPopoverVisible }">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0" class="publish-form">

        <!-- Title -->
        <el-form-item prop="title">
          <el-input
            v-model="form.title"
            placeholder="填写标题，可能会有更多人看到哦~"
            class="title-input"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <!-- Content -->
        <el-form-item prop="content">
          <el-input
            type="textarea"
            v-model="form.content"
            placeholder="添加正文，详细描述一下吧..."
            :rows="7"
            class="content-input"
            resize="none"
          />
        </el-form-item>

        <!-- Images -->
        <el-form-item>
          <el-upload
            v-model:file-list="fileList"
            action="#"
            list-type="picture-card"
            :http-request="handleUpload"
            :on-preview="handlePictureCardPreview"
            :on-remove="handleRemove"
            :limit="9"
            class="image-uploader"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <el-dialog v-model="dialogVisible">
            <img w-full :src="dialogImageUrl" alt="Preview Image" class="preview-img" />
          </el-dialog>
        </el-form-item>

        <el-divider />

        <!-- Meta Info -->
        <div class="meta-section">
            <div class="meta-row">
                <div class="meta-field">
                  <span class="meta-label">价<br/>格</span>
                  <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" :controls="false" placeholder="0.00" class="price-input">
                      <template #prefix><span class="price-symbol">¥</span></template>
                  </el-input-number>
                </div>

                <div class="meta-field">
                  <span class="meta-label">位<br/>置</span>
                  <el-select v-model="form.local" placeholder="选择位置" class="location-select">
                    <el-option label="校内" :value="0" />
                    <el-option label="校外" :value="1" />
                    <el-option label="外卖" :value="2" />
                  </el-select>
                </div>
            </div>

            <div class="meta-row tag-row">
                <span class="meta-label">标<br/>签</span>
                <div class="tags-container">
                    <div class="selected-tags" v-if="form.tags.length > 0">
                        <el-tag
                            v-for="tag in form.tags"
                            :key="tag"
                            closable
                            @close="handleCloseTag(tag)"
                            class="custom-tag"
                            round
                        >
                            # {{ tag }}
                        </el-tag>
                    </div>

                    <el-popover
                        placement="bottom-start"
                        :width="300"
                        trigger="click"
                        v-model:visible="tagPopoverVisible"
                    >
                        <template #reference>
                            <el-button class="add-tag-btn" round>
                                <el-icon><Plus /></el-icon> 添加标签
                            </el-button>
                        </template>

                        <div class="tag-selector-popover">
                            <div class="search-tag-section">
                                <el-select
                                    v-model="form.tags"
                                    multiple
                                    filterable
                                    allow-create
                                    default-first-option
                                    placeholder="输入关键词搜索或添加"
                                    class="tag-select"
                                    :loading="tagLoading"
                                    @change="handleTagSelectChange"
                                >
                                    <el-option
                                        v-for="item in predefinedTags"
                                        :key="item"
                                        :label="item"
                                        :value="item"
                                    />
                                </el-select>
                            </div>
                            <div class="hot-tags-section" v-if="predefinedTags.length > 0">
                                <div class="hot-tags-title">推荐标签</div>
                                <div class="hot-tags-list">
                                    <span
                                        v-for="tag in predefinedTags.slice(0, 10)"
                                        :key="tag"
                                        class="hot-tag-pill"
                                        @click="addHotTag(tag)"
                                        v-show="!form.tags.includes(tag)"
                                    >
                                        + {{ tag }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </el-popover>
                </div>
            </div>
        </div>

        <div class="form-actions">
          <el-button @click="$router.back()" round class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="handlePublish" :loading="loading" class="submit-btn" round>发布笔记</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { publishPost } from '@/api/user'
import { getTags } from '@/api/post'
import { uploadFile } from '@/api/common'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const fileList = ref([])
const dialogImageUrl = ref('')
const dialogVisible = ref(false)

// Tags
const predefinedTags = ref([])
const tagLoading = ref(false)
const tagPopoverVisible = ref(false)

const fetchTags = async () => {
  try {
    tagLoading.value = true
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
  } finally {
    tagLoading.value = false
  }
}

const addHotTag = (tag) => {
  // tag here is the tagName string
  if (!form.tags.includes(tag)) {
    form.tags.push(tag)
  }
}

const handleTagSelectChange = (val) => {
  // We can add logic here if needed, but v-model handles it
}

onMounted(() => {
  fetchTags()
})

const form = reactive({
  title: '',
  content: '',
  price: 0,
  local: 0,
  tags: [],
  images: []
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const handleCloseTag = (tag) => {
  form.tags.splice(form.tags.indexOf(tag), 1)
}

const normalizeUploadUrl = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    if (typeof value.data === 'string') return value.data
    if (typeof value.url === 'string') return value.url
    if (typeof value.msg === 'string') return value.msg
  }
  return ''
}

const isTemporaryUrl = (url) => {
  return typeof url === 'string' && (url.startsWith('blob:') || url.startsWith('data:'))
}

const ensureUploadedImages = async () => {
  for (const f of fileList.value) {
    const responseUrl = normalizeUploadUrl(f.response)
    if (responseUrl && !isTemporaryUrl(responseUrl)) continue
    if (f.raw instanceof File) {
      const formData = new FormData()
      formData.append('file', f.raw)
      const uploadedUrl = normalizeUploadUrl(await uploadFile(formData))
      if (!uploadedUrl || isTemporaryUrl(uploadedUrl)) {
        throw new Error('图片上传失败，请重试')
      }
      fileList.value = fileList.value.map((it) =>
        it.uid === f.uid ? { ...it, response: uploadedUrl } : it,
      )
      continue
    }
    if (f.url && isTemporaryUrl(f.url)) {
      throw new Error('图片尚未上传完成，请稍后再发布')
    }
  }
}

const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options
    try {
        const formData = new FormData()
        formData.append('file', file)
        const uploadedUrl = normalizeUploadUrl(await uploadFile(formData))
        if (!uploadedUrl || isTemporaryUrl(uploadedUrl)) {
          throw new Error('图片上传失败，请重试')
        }

        // 成功后，将后端返回的 URL 作为 response 存入 uploadFile 对象
        // 关键修复：确保更新 fileList 中的对应文件对象
        fileList.value = fileList.value.map((f) =>
          f.uid === file.uid ? { ...f, response: uploadedUrl } : f,
        )

        file.response = uploadedUrl
        onSuccess(uploadedUrl)
    } catch (err) {
        console.error('Upload failed:', err)
        onError(err)
    }
}

const handleRemove = (uploadFile) => {
  // 优先尝试获取 response (上传成功后的返回值)，其次是 url (回显时的字段)
  const url = normalizeUploadUrl(uploadFile.response) || uploadFile.url
  if (url) {
      const index = form.images.indexOf(url)
      if (index !== -1) {
          form.images.splice(index, 1)
      }
  }
}

const handlePictureCardPreview = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url
  dialogVisible.value = true
}

const handlePublish = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true
    await ensureUploadedImages()

    // 在提交前，从 fileList 重新提取所有图片的 URL
    // 这样可以确保 form.images 与当前界面上看到的文件列表完全一致
    form.images = fileList.value.map(file => {
        // 如果是刚上传的，URL 在 response 里；如果是回显的，URL 在 url 里
        const responseUrl = normalizeUploadUrl(file.response)
        if (responseUrl && !isTemporaryUrl(responseUrl)) return responseUrl
        if (file.url && !isTemporaryUrl(file.url)) return file.url
        return ''
    }).filter(url => url) // 过滤掉无效的 url

    console.log('Final images to submit:', form.images)

    await publishPost(form)
    ElMessage.success('发布成功')
    router.push('/')
  } catch (error) {
    // 区分表单校验错误和 API 请求错误
    if (error && error.message) {
        console.error('Publish failed:', error)
    } else {
        console.log('Validation failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.publish-container {
  padding: 20px 16px;
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
    text-align: center;
    margin-bottom: 18px;
}

.page-header h2 {
    font-size: 24px;
    font-weight: 800;
    color: #333;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.subtitle {
    color: #888;
    font-size: 13px;
}

.publish-card {
    border-radius: 18px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.05);
    overflow: visible;
    border: none;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.publish-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 25px 70px rgba(0,0,0,0.08);
}

.publish-card.is-active {
    transform: translateY(-2px);
    box-shadow: 0 25px 70px rgba(0,0,0,0.08);
}

.publish-form {
    padding: 12px 6px;
}

.title-input :deep(.el-input__wrapper) {
    box-shadow: none !important;
    border-bottom: 2px solid #eee;
    border-radius: 0;
    padding: 10px 0;
    transition: border-color 0.3s;
    background: transparent;
}

.title-input :deep(.el-input__wrapper.is-focus) {
    border-bottom-color: #333;
}

.title-input :deep(.el-input__inner) {
    font-size: 20px;
    font-weight: 700;
    color: #333;
}

.title-input :deep(.el-input__inner::placeholder) {
    color: #ccc;
    font-weight: 500;
}

.content-input :deep(.el-textarea__inner) {
    box-shadow: none !important;
    padding: 12px 0;
    font-size: 14px;
    color: #444;
    line-height: 1.6;
    background: transparent;
}

.content-input :deep(.el-textarea__inner::placeholder) {
    color: #ccc;
}

.image-uploader {
    margin-top: 12px;
}

.image-uploader :deep(.el-upload--picture-card) {
    border-radius: 16px;
    border: 2px dashed #e0e0e0;
    width: 104px;
    height: 104px;
    transition: border-color 0.3s;
    background: #fafafa;
}

.image-uploader :deep(.el-upload--picture-card:hover) {
    border-color: #409eff;
    background: #f0f7ff;
}

.image-uploader :deep(.el-upload-list__item) {
    border-radius: 16px;
    width: 104px;
    height: 104px;
    border: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.preview-img {
    width: 100%;
    border-radius: 12px;
}

.meta-section {
    margin: 16px 0;
    padding: 16px;
    background: #f9f9fb;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.meta-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.meta-field {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.meta-label {
    font-size: 14px;
    color: #666;
    line-height: 1.2;
    text-align: center;
    min-width: 28px;
    font-weight: 500;
}

.price-input :deep(.el-input__wrapper) {
    box-shadow: none !important;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    height: 40px;
}

.price-symbol {
    color: #9ca3af;
    font-size: 16px;
    margin-right: 4px;
}

.location-select :deep(.el-input__wrapper) {
    box-shadow: none !important;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    height: 40px;
}

.tag-row {
    align-items: flex-start;
}

.tags-container {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
}

.selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.custom-tag {
    background: #f3f4f6;
    border: none;
    color: #4b5563;
    padding: 0 12px;
    height: 32px;
    font-size: 13px;
    font-weight: 500;
}

.add-tag-btn {
    border: 1px dashed #d1d5db;
    background: #fff;
    color: #6b7280;
    height: 32px;
    padding: 0 16px;
    font-size: 13px;
}

.add-tag-btn:hover {
    border-color: #409eff;
    color: #409eff;
    background: #f0f7ff;
}

/* Tag Selector Popover Styles */
.tag-selector-popover {
    padding: 8px 0;
}

.search-tag-section {
    margin-bottom: 16px;
}

.tag-select {
    width: 100%;
}

.hot-tags-title {
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 8px;
    padding: 0 4px;
}

.hot-tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.hot-tag-pill {
    font-size: 12px;
    color: #4b5563;
    background: #f3f4f6;
    padding: 4px 10px;
    border-radius: 100px;
    cursor: pointer;
    transition: all 0.2s;
}

.hot-tag-pill:hover {
    background: #e5e7eb;
    color: #1f2937;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}

.cancel-btn {
    border: 1px solid #e5e7eb;
    color: #6b7280;
    padding: 0 24px;
}

.submit-btn {
    padding: 0 24px;
    background: #3b82f6;
    border: none;
    font-weight: 600;
}

.submit-btn:hover {
    background: #2563eb;
}

@media (max-width: 600px) {
    .publish-container {
        padding: 16px 12px;
    }

    .page-header h2 {
        font-size: 24px;
    }

    .meta-section {
        flex-direction: column;
        gap: 20px;
        padding: 15px;
    }

    .image-uploader :deep(.el-upload--picture-card),
    .image-uploader :deep(.el-upload-list__item) {
        width: 92px;
        height: 92px;
    }

    .form-actions {
        flex-direction: column-reverse;
        gap: 12px;
    }

    .form-actions button {
        width: 100%;
        margin-left: 0 !important;
    }
}
</style>
