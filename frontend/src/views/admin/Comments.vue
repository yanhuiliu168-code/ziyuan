<template>
  <div>
    <div class="bg-white rounded-xl p-4 border border-slate-200/60 mb-4 flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width:130px" @change="() => { page = 1; load() }">
          <el-option label="展示中" :value="1" />
          <el-option label="已隐藏" :value="0" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <span class="text-xs text-slate-400">共 {{ total }} 条留言</span>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <el-table :data="list" stripe :row-style="rowStyle">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="nickname" label="昵称" width="120">
          <template #default="{ row }">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-700">{{ row.nickname }}</span>
              <span v-if="row.status === 0" class="inline-block px-1 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700 font-medium">已隐藏</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="text-sm">
              <div :class="row.status === 0 ? 'text-slate-400' : 'text-slate-700'">{{ row.content }}</div>
              <div v-if="row.resource_title" class="text-xs text-slate-400 mt-1">资源: {{ row.resource_title }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="160" />
        <el-table-column label="展示" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="val => toggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="p-4 flex items-center justify-end">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next, total" @current-change="load" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const list = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const statusFilter = ref(null)

function rowStyle({ row }) {
  if (row.status === 0) return { background: 'rgba(245, 158, 11, 0.04)' }
  return {}
}

async function load() {
  const params = { page: page.value, page_size: pageSize.value }
  if (statusFilter.value !== null && statusFilter.value !== undefined && statusFilter.value !== '') {
    params.status = statusFilter.value
  }
  const data = await api.get('/admin/comments', { params })
  list.value = data.list || []
  total.value = data.total || 0
}

async function toggleStatus(row, val) {
  try {
    await api.put(`/admin/comments/${row.id}`, { status: val })
    ElMessage.success(val ? '已展示' : '已隐藏')
  } catch (e) {
    row.status = val ? 0 : 1
    ElMessage.error('操作失败')
  }
}

async function remove(row) {
  await ElMessageBox.confirm('确定删除此留言？', '提示', { type: 'warning' })
  await api.delete(`/admin/comments/${row.id}`)
  ElMessage.success('已删除'); load()
}

onMounted(load)
</script>
