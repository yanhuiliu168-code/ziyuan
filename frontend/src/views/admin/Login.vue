<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-indigo-500 to-primary-400 p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">后台管理系统</h1>
        <p class="text-sm text-slate-400 mt-1">Resource Depot Admin</p>
      </div>

      <el-form :model="form" label-width="0" @submit.prevent="login">
        <el-form-item>
          <el-input v-model="form.username" size="large" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" size="large" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-button type="primary" size="large" class="w-full" :loading="loading" native-type="submit">登 录</el-button>
      </el-form>

      <p class="text-center text-xs text-slate-400 mt-6">默认账号: admin / admin123</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import api from '@/api'

const router = useRouter()
const form = ref({ username: 'admin', password: 'admin123' })
const loading = ref(false)

async function login() {
  loading.value = true
  try {
    const data = await api.post('/admin/login', form.value)
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', JSON.stringify(data.user))
    ElMessage.success('登录成功')
    router.push('/admin/dashboard')
  } catch (e) {
    ElMessage.error(e)
  }
  loading.value = false
}
</script>
