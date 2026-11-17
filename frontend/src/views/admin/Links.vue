<template>
  <div>
    <div class="bg-white rounded-xl p-5 border border-slate-200/60 mb-4">
      <el-form :inline="true" :model="form" label-width="60px">
        <el-form-item label="名称"><el-input v-model="form.name" style="width:160px" /></el-form-item>
        <el-form-item label="URL"><el-input v-model="form.url" style="width:220px" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item>
          <el-button type="success" @click="save">{{ isEdit ? '更新' : '新增' }}</el-button>
          <el-button v-if="isEdit" @click="reset">取消</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="名称" width="200" />
        <el-table-column prop="url" label="URL" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="edit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const list = ref([])
const isEdit = ref(false)
const form = reactive({ id: null, name: '', url: '', sort: 0 })

async function load() { list.value = await api.get('/friend-links') || [] }
function edit(row) { Object.assign(form, row); isEdit.value = true }
function reset() { Object.assign(form, { id: null, name: '', url: '', sort: 0 }); isEdit.value = false }

async function save() {
  if (!form.name || !form.url) return ElMessage.warning('请填写名称和URL')
  if (isEdit.value) { await api.put(`/admin/friend-links/${form.id}`, form); ElMessage.success('已更新') }
  else { await api.post('/admin/friend-links', form); ElMessage.success('已添加') }
  reset(); load()
}
async function remove(row) {
  await ElMessageBox.confirm(`删除 "${row.name}"?`, '提示', { type: 'warning' })
  await api.delete(`/admin/friend-links/${row.id}`); ElMessage.success('已删除'); load()
}
onMounted(load)
</script>
