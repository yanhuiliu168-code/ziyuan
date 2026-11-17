<template>
  <div>
    <div class="bg-white rounded-xl p-5 border border-slate-200/60 mb-4">
      <el-form :inline="true" :model="form" label-width="70px">
        <el-form-item label="标题"><el-input v-model="form.title" style="width:180px" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" style="width:180px" /></el-form-item>
        <el-form-item label="按钮文字"><el-input v-model="form.btn_text" style="width:120px" /></el-form-item>
        <el-form-item label="链接"><el-input v-model="form.link" style="width:180px" /></el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="form.bg_color" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item>
          <el-button type="success" @click="save">{{ isEdit ? '更新' : '新增' }}</el-button>
          <el-button v-if="isEdit" @click="reset">取消</el-button>
        </el-form-item>
      </el-form>
      <div v-if="form.bg_color" class="mt-3 rounded-lg p-4 text-white text-xs font-bold" :style="{ background: form.bg_color }">预览: 我是一个广告卡片</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="卡片">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded" :style="{ background: row.bg_color || '#6c5ce7' }"></div>
              <div>
                <div class="font-medium text-sm">{{ row.title }}</div>
                <div class="text-xs text-slate-400">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="btn_text" label="按钮" width="100" />
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
const form = reactive({ id: null, title: '', description: '', btn_text: '立即获取', link: '', bg_color: '#6c5ce7', sort: 0 })

async function load() { list.value = await api.get('/ad-cards') || [] }
function edit(row) { Object.assign(form, row); isEdit.value = true }
function reset() { Object.assign(form, { id: null, title: '', description: '', btn_text: '立即获取', link: '', bg_color: '#6c5ce7', sort: 0 }); isEdit.value = false }

async function save() {
  if (!form.title) return ElMessage.warning('请填写标题')
  if (isEdit.value) { await api.put(`/admin/ad-cards/${form.id}`, form); ElMessage.success('已更新') }
  else { await api.post('/admin/ad-cards', form); ElMessage.success('已添加') }
  reset(); load()
}
async function remove(row) {
  await ElMessageBox.confirm(`删除 "${row.title}"?`, '提示', { type: 'warning' })
  await api.delete(`/admin/ad-cards/${row.id}`); ElMessage.success('已删除'); load()
}
onMounted(load)
</script>
