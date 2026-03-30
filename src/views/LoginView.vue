<!-- src/views/LoginView.vue -->
<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>用户登录</span>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading">登录</el-button>
          <el-button type="info" plain @click="handleGuestLogin" :loading="guestLoading">游客登录</el-button>
          <el-button @click="$router.push('/register')">去注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const guestLoading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 尝试登录
        const success = await userStore.login(form)

        if (success) {
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          ElMessage.error('登录失败，请检查用户名和密码')
        }
      } catch (error) {
        console.error('登录异常:', error)
        // 根据错误信息显示相应的提示
        if (error.message && error.message.includes('权限不足')) {
          ElMessage.error('您的权限不足，无法完成登录操作')
        } else if (error.response?.data?.msg) {
          ElMessage.error(error.response.data.msg || '登录失败')
        } else {
          ElMessage.error(error.message || '登录失败，请稍后重试')
        }
      } finally {
        loading.value = false
      }
    }
  }).catch(validationErrors => {
    console.log('表单验证失败:', validationErrors)
  })
}

const handleGuestLogin = async () => {
  guestLoading.value = true
  try {
    const success = await userStore.guestLogin()
    if (success) {
      ElMessage.success('已作为游客登录')
      router.push('/')
    } else {
      ElMessage.error('游客登录失败')
    }
  } catch (error) {
    console.error('游客登录异常:', error)
    const msg = error.response?.data?.msg || error.message || '游客登录失败'
    ElMessage.error(msg)
  } finally {
    guestLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}
.login-card {
  width: 400px;
}
.card-header {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
}
</style>
