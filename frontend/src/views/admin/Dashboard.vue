<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="6" v-for="s in topStats" :key="s.label">
        <div class="bg-white rounded-xl p-5 border border-slate-200/60 shadow-card">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs text-slate-400 mb-1">{{ s.label }}</div>
              <div class="text-2xl font-bold text-slate-900">{{ s.value }}</div>
              <div v-if="s.change !== undefined" class="text-[11px] mt-0.5" :class="s.change >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                {{ s.change >= 0 ? '↑' : '↓' }} 较昨日 {{ Math.abs(s.change) }}%
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl flex items-center justify-center" :style="{ background: s.bg, color: s.color }">
              <el-icon :size="22"><component :is="s.icon" /></el-icon>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-4">
      <el-col :span="6" v-for="s in resourceStats" :key="s.label">
        <div class="bg-white rounded-xl p-5 border border-slate-200/60 shadow-card">
          <div class="text-xs text-slate-400 mb-1">{{ s.label }}</div>
          <div class="text-2xl font-bold text-slate-900">{{ s.value }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-4">
      <el-col :span="16">
        <div class="bg-white rounded-xl p-5 border border-slate-200/60">
          <h3 class="font-bold text-slate-800 mb-4">📊 近7天访问趋势</h3>
          <div class="flex items-end gap-3 h-40 px-2">
            <div v-for="(d, i) in visitChart" :key="i" class="flex-1 flex flex-col items-center gap-1">
              <div class="text-[10px] text-slate-400 font-medium">{{ d.visits }}</div>
              <div class="w-full rounded-t bg-gradient-to-t from-primary-400 to-primary-500 transition-all"
                :style="{ height: getBarHeight(d.visits) + '%' }"></div>
              <div class="text-[11px] text-slate-500">{{ d.date }}</div>
            </div>
          </div>
          <div class="mt-2 text-xs text-slate-400 text-center">总访问 / 独立IP</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="bg-white rounded-xl p-5 border border-slate-200/60">
          <h3 class="font-bold text-slate-800 mb-4">🕐 最近访问</h3>
          <div class="space-y-2 max-h-52 overflow-y-auto">
            <div v-for="(v, i) in recentVisits" :key="i" class="flex items-center gap-2 text-xs py-1 border-b border-slate-50 last:border-0">
              <span class="shrink-0 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono w-[110px] truncate">{{ v.ip }}</span>
              <span class="flex-1 text-slate-600 truncate">{{ v.path }}</span>
            </div>
            <div v-if="!recentVisits.length" class="text-center text-xs text-slate-400 py-4">暂无访问记录</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-4">
      <el-col :span="16">
        <div class="bg-white rounded-xl p-5 border border-slate-200/60">
          <h3 class="font-bold text-slate-800 mb-4">📌 最新资源</h3>
          <el-table :data="recent" stripe size="small">
            <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="category_name" label="分类" width="120" />
            <el-table-column prop="views" label="浏览" width="80" />
            <el-table-column prop="publish_time" label="时间" width="160" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="bg-white rounded-xl p-5 border border-slate-200/60">
          <h3 class="font-bold text-slate-800 mb-4">💬 最新留言</h3>
          <div class="space-y-3">
            <div v-for="c in comments" :key="c.id" class="pb-3 border-b border-slate-100 last:border-0">
              <div class="flex items-center gap-2 text-sm">
                <span class="font-bold text-slate-700">{{ c.nickname }}</span>
                <span class="text-xs text-slate-400">{{ c.created_at }}</span>
              </div>
              <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ c.content }}</p>
            </div>
            <div v-if="!comments.length" class="text-center text-xs text-slate-400 py-4">暂无留言</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Box, User, ChatDotRound, View, TrendCharts } from '@element-plus/icons-vue'
import api from '@/api'

const topStats = ref([
  { label: '今日访问', value: 0, icon: TrendCharts, bg: '#f5f3ff', color: '#6c5ce7', change: 0 },
  { label: '今日IP', value: 0, icon: User, bg: '#fff0f3', color: '#ff4d6d', change: 0 },
  { label: '总浏览量', value: 0, icon: View, bg: '#dffff1', color: '#00b894' },
  { label: '今日新增', value: 0, icon: Box, bg: '#fff8d6', color: '#d19e00' }
])

const resourceStats = ref([
  { label: '资源总数', value: 0 },
  { label: '留言待审', value: 0 },
  { label: '历史总访问', value: 0 },
  { label: '昨日访问', value: 0 }
])

const visitChart = ref([])
const recentVisits = ref([])
const recent = ref([])
const comments = ref([])

function getBarHeight(v) {
  const max = Math.max(...visitChart.value.map(d => d.visits), 1)
  return Math.max((v / max) * 100, v > 0 ? 8 : 2)
}

function calcChange(today, yesterday) {
  if (!yesterday) return today > 0 ? 100 : 0
  return Math.round(((today - yesterday) / yesterday) * 100)
}

onMounted(async () => {
  try {
    const data = await api.get('/admin/stats')
    topStats.value[0].value = data.visit_today || 0
    topStats.value[0].change = calcChange(data.visit_today, data.visit_yesterday)
    topStats.value[1].value = data.ip_today || 0
    topStats.value[1].change = calcChange(data.ip_today, data.ip_yesterday)
    topStats.value[2].value = data.views_total || 0
    topStats.value[3].value = data.today_new || 0

    resourceStats.value[0].value = data.resource_total || 0
    resourceStats.value[1].value = data.comment_pending || 0
    resourceStats.value[2].value = data.visit_total || 0
    resourceStats.value[3].value = data.visit_yesterday || 0

    visitChart.value = data.visit_chart || []
    recentVisits.value = data.recent_visits || []
    recent.value = data.hot_resources || []
  } catch (e) { console.error(e) }
  try {
    comments.value = await api.get('/comments?limit=5') || []
  } catch (e) {}
})
</script>
