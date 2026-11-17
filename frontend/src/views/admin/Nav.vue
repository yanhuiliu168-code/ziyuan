<template>
  <div>
    <div class="bg-white rounded-xl p-5 border border-slate-200/60 mb-4">
      <el-form :inline="true" :model="form" label-width="60px">
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="导航名称" style="width:140px" /></el-form-item>
        <el-form-item label="链接"><el-input v-model="form.link" placeholder="/ 或外部URL" style="width:200px" /></el-form-item>
        <el-form-item label="显示">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="新窗口">
          <el-switch v-model="form.target" :active-value="1" :inactive-value="0" />
        </el-form-item>
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
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="link" label="链接" show-overflow-tooltip />
        <el-table-column label="显示" width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="target" label="新窗口" width="80" align="center">
          <template #default="{ row }">{{ row.target === 1 ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="edit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
      💡 提示：关闭"显示"后，前台导航栏不会出现该菜单项，但手动输入 URL 仍然可以访问对应的页面。
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const list = ref([])
const isEdit = ref(false)
const form = reactive({ id: null, name: '', link: '', status: 1, target: 0, sort: 0 })

async function load() { list.value = await api.get('/admin/nav') || [] }
function edit(row) { Object.assign(form, row); isEdit.value = true }
function reset() { Object.assign(form, { id: null, name: '', link: '', status: 1, target: 0, sort: 0 }); isEdit.value = false }

async function save() {
  if (!form.name || !form.link) return ElMessage.warning('请填写名称和链接')
  if (isEdit.value) { await api.put(`/admin/nav/${form.id}`, form); ElMessage.success('已更新') }
  else { await api.post('/admin/nav', form); ElMessage.success('已添加') }
  reset(); load()
}

async function toggleStatus(row) {
  try {
    await api.put(`/admin/nav/${row.id}`, { status: row.status })
    ElMessage.success(row.status ? '已显示' : '已隐藏')
  } catch (e) {
    row.status = row.status ? 0 : 1
    ElMessage.error('操作失败')
  }
}

async function remove(row) {
  await ElMessageBox.confirm(`删除导航 "${row.name}"?`, '提示', { type: 'warning' })
  await api.delete(`/admin/nav/${row.id}`); ElMessage.success('已删除'); load()
}
onMounted(load)
</script>
