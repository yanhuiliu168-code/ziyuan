<template>
  <div>
    <div class="bg-white rounded-xl p-5 border border-slate-200/60 mb-4">
      <el-form :inline="true" :model="form" label-width="70px">
        <el-form-item label="用户名"><el-input v-model="form.username" style="width:160px" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" style="width:160px" show-password :placeholder="isEdit ? '留空则不修改' : ''" /></el-form-item>
        <el-form-item>
          <el-button type="success" @click="save">{{ isEdit ? '更新' : '新增' }}</el-button>
          <el-button v-if="isEdit" @click="reset">取消</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.role === 'super'" type="danger" size="small">超级管理员</el-tag>
            <el-tag v-else size="small">管理员</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="edit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="resetPwd(row)">重置密码</el-button>
            <el-button v-if="row.role !== 'super'" link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElInput } from 'element-plus'
import api from '@/api'

const list = ref([])
const isEdit = ref(false)
const form = reactive({ id: null, username: '', password: '' })

async function load() { list.value = await api.get('/admin/admins') || [] }
function edit(row) { Object.assign(form, row, { password: '' }); isEdit.value = true }
function reset() { Object.assign(form, { id: null, username: '', password: '' }); isEdit.value = false }

async function save() {
  if (!form.username) return ElMessage.warning('请填写用户名')
  if (!isEdit.value && !form.password) return ElMessage.warning('请设置密码')
  if (isEdit.value) { await api.put(`/admin/admins/${form.id}`, { username: form.username, ...(form.password ? { password: form.password } : {}) }); ElMessage.success('已更新') }
  else { await api.post('/admin/admins', form); ElMessage.success('已添加') }
  reset(); load()
}

async function resetPwd(row) {
  const { value } = await ElMessageBox.prompt(`为 "${row.username}" 设置新密码`, '重置密码', {
    confirmButtonText: '确定', cancelButtonText: '取消', inputPattern: /.+/, inputErrorMessage: '密码不能为空'
  }).catch(() => ({ value: null }))
  if (value) { await api.put(`/admin/admins/${row.id}`, { password: value }); ElMessage.success('密码已更新') }
}
async function remove(row) {
  await ElMessageBox.confirm(`删除管理员 "${row.username}"?`, '提示', { type: 'warning' })
  await api.delete(`/admin/admins/${row.id}`); ElMessage.success('已删除'); load()
}
onMounted(load)
</script>
