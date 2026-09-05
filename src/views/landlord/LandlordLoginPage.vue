<template>
  <div class="login-container">
    <div class="login-card">
      <h1>🏠 Nest 安居</h1>
      <p class="subtitle">房东管理端</p>
      <el-form :model="form" label-width="0" size="large" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.phone" placeholder="手机号" prefix-icon="Phone" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password
            @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { landlordLogin } from '@/api/house'

const router = useRouter()
const loading = ref(false)
const form = reactive({ phone: '', password: '' })

async function handleLogin() {
  if (!form.phone || !form.password) {
    ElMessage.warning('请输入手机号和密码')
    return
  }
  loading.value = true
  try {
    const res: any = await landlordLogin(form.phone, form.password)
    const token = res.data?.token
    if (token) {
      localStorage.setItem('adminToken', token)
      ElMessage.success('登录成功')
      router.push('/landlord/map')
    }
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 380px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-card h1 {
  text-align: center;
  margin: 0 0 4px;
  font-size: 28px;
  color: #303133;
}

.subtitle {
  text-align: center;
  color: #909399;
  margin: 0 0 32px;
  font-size: 14px;
}
</style>
