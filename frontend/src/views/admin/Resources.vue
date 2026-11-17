<template>
  <div>
    <div v-if="catStats.length" class="bg-white rounded-xl p-5 border border-slate-200/60 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-700">📊 资源分类汇总</h3>
        <span class="text-xs text-slate-400">共 {{ catTotal }} 个资源 · {{ catShown }} 个展示中</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div v-for="c in catStats" :key="c.id" @click="quickFilter(c.id)"
          class="cursor-pointer px-3 py-2.5 rounded-lg border transition-all hover:shadow-md"
          :class="categoryId === c.id ? 'bg-primary-50 border-primary-300 ring-1 ring-primary-200' : 'bg-slate-50 border-slate-100 hover:border-primary-200 hover:bg-primary-50/50'">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-slate-700 truncate">{{ c.name }}</span>
            <span class="text-[10px] text-slate-400 shrink-0">{{ c.shown || 0 }}/{{ c.total }}</span>
          </div>
          <div class="mt-1 flex items-baseline gap-1">
            <span class="text-lg font-bold text-primary-600">{{ c.total || 0 }}</span>
            <span class="text-[10px] text-slate-400">个资源</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl p-5 border border-slate-200/60 mb-4 flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <el-input v-model="keyword" placeholder="搜索资源标题" clearable style="width: 220px" @keyup.enter="load" />
        <el-select v-model="categoryId" placeholder="全部分类" clearable style="width: 150px" @change="load">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 130px" @change="load">
          <el-option label="展示中" :value="1" />
          <el-option label="已隐藏" :value="0" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
      </div>
      <el-button type="primary" @click="$router.push('/admin/resource/create')">+ 新建资源</el-button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <el-table :data="list" stripe v-loading="loading" size="small" style="width: 100%">
        <el-table-column label="序号" width="70" align="center">
          <template #default="{ $index }">
            <span class="text-xs font-mono text-slate-500">NO:{{ (page - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="封面" width="72">
          <template #default="{ row }">
            <img v-if="row.cover" :src="row.cover" class="w-10 h-10 rounded object-cover" />
            <div v-else class="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-300 text-base">📦</div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="font-medium text-slate-700">{{ row.title }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="category_name" label="分类" width="90" />
        <el-table-column label="标签" min-width="120">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-0.5">
              <span v-for="t in row.tags?.slice(0,3)" :key="t.id" class="inline-block px-1 py-0 text-[10px] bg-slate-100 rounded text-slate-500">{{ t.name }}</span>
              <span v-if="row.tags?.length > 3" class="text-[10px] text-slate-400">+{{ row.tags.length - 3 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="110" align="center">
          <template #default="{ row, $index }">
            <div class="flex items-center justify-center gap-0.5">
              <el-tooltip content="上移" :show-after="300">
                <el-button link size="small" :disabled="$index === 0" @click="moveUp($index)"><el-icon size="14"><ArrowUp /></el-icon></el-button>
              </el-tooltip>
              <el-input-number v-model="row.sort" :min="0" :max="9999" size="small" controls-position="right" style="width:58px" @change="val => updateField(row, 'sort', val)" />
              <el-tooltip content="下移" :show-after="300">
                <el-button link size="small" :disabled="$index === list.length - 1" @click="moveDown($index)"><el-icon size="14"><ArrowDown /></el-icon></el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="publish_time" label="时间" width="140">
          <template #default="{ row }">
            <span class="text-[11px] text-slate-500 font-mono">{{ (row.publish_time || '—').slice(5, 16) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="views" label="浏览" width="70" sortable="custom" @sort-change="onSort">
          <template #default="{ row }">
            <span class="text-slate-600 text-xs font-medium">{{ Number(row.views).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="130" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1">
              <el-tooltip content="置顶">
                <el-icon size="15" :class="row.is_top ? 'text-secondary-500' : 'text-slate-300 cursor-pointer hover:text-secondary-400'" @click="toggleTop(row)"><Star /></el-icon>
              </el-tooltip>
              <el-tooltip content="推荐">
                <el-icon size="15" :class="row.is_recommend ? 'text-primary-500' : 'text-slate-300 cursor-pointer hover:text-primary-400'" @click="toggleRecommend(row)"><StarFilled /></el-icon>
              </el-tooltip>
              <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small" @change="() => updateField(row, 'status', row.status)" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="$router.push(`/admin/resource/${row.id}/edit`)">编辑</el-button>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowUp, ArrowDown, Star, StarFilled } from '@element-plus/icons-vue'
import api from '@/api'

const list = ref([])
const categories = ref([])
const keyword = ref('')
const categoryId = ref(null)
const statusFilter = ref(null)
const page = ref(1)
const pageSize = ref(15)
const total = ref(0)
const loading = ref(false)
const catStats = ref([])

const catTotal = computed(() => catStats.value.reduce((s, c) => s + (c.total || 0), 0))
const catShown = computed(() => catStats.value.reduce((s, c) => s + (c.shown || 0), 0))

async function loadCatStats() {
  try {
    const data = await api.get('/admin/stats')
    catStats.value = data.category_stats || []
  } catch (e) {}
}

function quickFilter(id) {
  categoryId.value = categoryId.value === id ? null : id
  page.value = 1
  load()
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (categoryId.value) params.category_id = categoryId.value
    if (statusFilter.value !== null && statusFilter.value !== undefined) params.status = statusFilter.value
    const data = await api.get('/admin/resources', { params })
    list.value = data.list || []
    total.value = data.total || 0
  } catch (e) { ElMessage.error(e) }
  loading.value = false
}

async function moveUp(i) {
  const cur = list.value[i], prev = list.value[i - 1]
  const tmp = cur.sort
  try {
    await Promise.all([
      api.put(`/admin/resources/${cur.id}`, { sort: prev.sort }),
      api.put(`/admin/resources/${prev.id}`, { sort: tmp })
    ])
    ElMessage.success('已上移')
    load()
  } catch (e) { ElMessage.error('操作失败') }
}

async function moveDown(i) {
  const cur = list.value[i], next = list.value[i + 1]
  const tmp = cur.sort
  try {
    await Promise.all([
      api.put(`/admin/resources/${cur.id}`, { sort: next.sort }),
      api.put(`/admin/resources/${next.id}`, { sort: tmp })
    ])
    ElMessage.success('已下移')
    load()
  } catch (e) { ElMessage.error('操作失败') }
}

async function toggleTop(row) {
  try {
    await api.put(`/admin/resources/${row.id}/toggle-top`)
    ElMessage.success(row.is_top ? '已置顶' : '已取消置顶')
  } catch (e) { row.is_top = row.is_top ? 0 : 1 }
}

async function toggleRecommend(row) {
  try {
    await api.put(`/admin/resources/${row.id}/toggle-recommend`)
    ElMessage.success(row.is_recommend ? '已标记推荐' : '已取消推荐')
  } catch (e) { row.is_recommend = row.is_recommend ? 0 : 1 }
}

async function updateField(row, field, value) {
  try {
    await api.put(`/admin/resources/${row.id}`, { [field]: value })
    if (field === 'status') ElMessage.success(value ? '已展示' : '已隐藏')
    else if (field === 'sort') ElMessage.success('排序已更新')
  } catch (e) { ElMessage.error('更新失败'); load() }
}

function onSort() { load() }

async function remove(row) {
  await ElMessageBox.confirm(`确定删除 "${row.title}" 吗？`, '提示', { type: 'warning' })
  await api.delete(`/admin/resources/${row.id}`)
  ElMessage.success('已删除')
  load()
}

onMounted(async () => {
  categories.value = await api.get('/categories') || []
  loadCatStats()
  load()
})
</script>
