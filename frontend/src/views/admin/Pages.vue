<template>
  <div>
    <div class="bg-white rounded-xl p-5 border border-slate-200/60 mb-4">
      <el-form :inline="true" :model="form" label-width="70px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="页面标题" style="width:200px" />
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="form.slug" placeholder="URL 别名（about 等）" style="width:150px" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="showEditor = !showEditor">{{ showEditor ? '收起' : '编辑内容' }}</el-button>
          <el-button type="success" @click="save">{{ isEdit ? '更新' : '新增' }}</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-if="showEditor" class="mt-3">
        <div class="text-xs text-slate-400 mb-1">页面内容（支持纯文本或 HTML）</div>
        <el-input v-model="form.content" type="textarea" :rows="10" placeholder="页面详细内容" />
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="slug" label="URL" width="200">
          <template #default="{ row }"><code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">/page/{{ row.slug }}</code></template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
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
const showEditor = ref(false)
const form = reactive({ id: null, title: '', slug: '', content: '', sort: 0, status: 1 })

async function load() { list.value = await api.get('/admin/pages') || [] }

function edit(row) { Object.assign(form, row); isEdit.value = true; showEditor.value = true }
function reset() { Object.assign(form, { id: null, title: '', slug: '', content: '', sort: 0, status: 1 }); isEdit.value = false; showEditor.value = false }

async function save() {
  if (!form.title || !form.slug) return ElMessage.warning('请填写标题和URL别名')
  if (isEdit.value) { await api.put(`/admin/pages/${form.id}`, form); ElMessage.success('已更新') }
  else { await api.post('/admin/pages', form); ElMessage.success('已添加') }
  reset(); load()
}
async function toggleStatus(row) { await api.put(`/admin/pages/${row.id}`, { status: row.status }) }
async function remove(row) {
  await ElMessageBox.confirm(`删除页面 "${row.title}"?`, '提示', { type: 'warning' })
  await api.delete(`/admin/pages/${row.id}`); ElMessage.success('已删除'); load()
}
onMounted(load)
</script>
