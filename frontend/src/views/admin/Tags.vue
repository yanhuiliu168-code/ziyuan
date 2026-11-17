<template>
  <div>
    <div class="bg-white rounded-xl p-5 border border-slate-200/60 mb-4 flex items-center gap-3">
      <el-input v-model="form.name" placeholder="标签名称" style="width: 200px" @keyup.enter="save" />
      <el-button type="primary" @click="save">{{ isEdit ? '更新' : '新增' }}</el-button>
      <el-button v-if="isEdit" @click="reset">取消</el-button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="resource_count" label="资源数" width="100" />
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
const form = reactive({ id: null, name: '' })

async function load() { list.value = await api.get('/tags') || [] }
function edit(row) { Object.assign(form, row); isEdit.value = true }
function reset() { Object.assign(form, { id: null, name: '' }); isEdit.value = false }
async function save() {
  if (!form.name) return ElMessage.warning('请输入标签名称')
  if (isEdit.value) { await api.put(`/admin/tags/${form.id}`, { name: form.name }); ElMessage.success('已更新') }
  else { await api.post('/admin/tags', { name: form.name }); ElMessage.success('已添加') }
  reset(); load()
}
async function remove(row) {
  await ElMessageBox.confirm(`删除标签 "${row.name}"?`, '提示', { type: 'warning' })
  await api.delete(`/admin/tags/${row.id}`); ElMessage.success('已删除'); load()
}
onMounted(load)
</script>
