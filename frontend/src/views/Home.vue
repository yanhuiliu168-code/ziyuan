<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1 max-w-[1680px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col lg:flex-row gap-6 items-start">
        <aside class="w-full lg:w-64 shrink-0 space-y-4">
          <div class="card p-3">
            <div class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-2">资源分类</div>
            <nav class="space-y-0.5">
              <router-link to="/" class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors text-sm font-medium">
                <span>全部资源</span>
              </router-link>
              <router-link v-for="cat in categories" :key="cat.id" :to="`/category/${cat.id}`"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors text-sm font-medium">
                <span><CatIcon :name="cat.icon" :size="16" class="inline-block mr-1.5 text-slate-500 -translate-y-0.5" />{{ cat.name }}</span>
              </router-link>
            </nav>
          </div>

          <div v-for="card in adCards" :key="card.id" class="card p-4 relative overflow-hidden">
            <div class="rounded-lg p-4 text-white relative" :style="{ background: `linear-gradient(135deg, ${card.bg_color}, ${card.bg_color}dd)` }">
              <div class="text-xs font-bold opacity-90 mb-1">赞助商推荐</div>
              <h4 class="font-bold text-base leading-tight">{{ card.title }}</h4>
              <p class="text-xs opacity-80 mt-1">{{ card.description }}</p>
              <a :href="card.link" target="_blank" class="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white/20 backdrop-blur text-white font-bold text-xs hover:bg-white/30 transition-colors">
                {{ card.btn_text }}
              </a>
            </div>
          </div>
        </aside>

        <section class="flex-1 w-full min-w-0 space-y-4">
          <div class="card p-3 flex items-center gap-1.5">
            <button @click="sort='latest'" class="px-3.5 py-1.5 rounded-lg font-bold text-sm flex items-center gap-1 transition-colors"
              :class="sort==='latest' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'">
              最新发布
            </button>
            <button @click="sort='hot'" class="px-3.5 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1 transition-colors"
              :class="sort==='hot' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'">
              最热排行
            </button>
            <button @click="sort='recommend'" class="px-3.5 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1 transition-colors"
              :class="sort==='recommend' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'">
              站长力荐
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <router-link v-for="r in resources" :key="r.id" :to="`/resource/${r.id}`" class="card card-hover group p-0 overflow-hidden flex flex-col" :class="{ 'ring-2 ring-secondary-300': r.is_top }">
              <div class="relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
                <img v-if="r.cover" :src="r.cover" :alt="r.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div v-else :class="['w-full h-full bg-gradient-to-br flex items-center justify-center', getCoverTheme(r.category_name).bg]">
                  <span class="text-5xl drop-shadow-sm">{{ getCoverTheme(r.category_name).emoji }}</span>
                </div>
                <span v-if="r.is_top" class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-secondary-500 to-orange-500 text-white shadow">🔥 置顶</span>
                <span v-if="r.is_recommend && !r.is_top" class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-500 text-white shadow">⭐ 推荐</span>
              </div>
              <div class="p-3 flex-1 flex flex-col">
                <div class="flex flex-wrap gap-1.5 mb-2">
                  <span :class="['px-1.5 py-0.5 rounded text-[10px] font-bold', getCatTagColor(r.category_name)]">{{ r.category_name || '未分类' }}</span>
                  <span v-for="tag in (r.tags || []).slice(0,2)" :key="tag.id" class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">#{{ tag.name }}</span>
                </div>
                <h3 class="font-bold text-slate-800 group-hover:text-primary-600 transition-colors leading-snug text-sm line-clamp-2">{{ r.title }}</h3>
                <p class="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">{{ r.summary }}</p>
                <div class="mt-auto pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{{ r.publish_time }}</span>
                  <span class="flex items-center gap-0.5">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    {{ r.views }}
                  </span>
                </div>
              </div>
            </router-link>
          </div>

          <div v-if="!resources.length" class="card p-16 text-center text-slate-400">
            <div class="text-6xl mb-4">📭</div>
            <p>暂无资源</p>
          </div>

          <div class="card p-4 flex items-center justify-center gap-2 flex-wrap">
            <button v-for="p in pageRange" :key="p" @click="page = p"
              class="w-9 h-9 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
              :class="p === page ? 'bg-primary-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'">
              {{ p }}
            </button>
            <span class="text-sm text-slate-400 ml-2">共 {{ total }} 条</span>
          </div>
        </section>

        <aside class="w-full lg:w-72 shrink-0 space-y-5">
          <div class="card p-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 class="font-bold text-slate-800 flex items-center gap-1.5">🔥 热门文章</h3>
            </div>
            <div class="space-y-3">
              <router-link v-for="(r, i) in hotResources" :key="r.id" :to="`/resource/${r.id}`" class="flex gap-2.5 group items-start">
                <span class="w-5 h-5 rounded text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5"
                  :class="i<3 ? 'bg-secondary-500' : 'bg-slate-300'">{{ i + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-semibold text-slate-700 group-hover:text-primary-600 transition-colors line-clamp-1">{{ r.title }}</h4>
                  <div class="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span class="text-secondary-500 font-medium">{{ r.views }} 次浏览</span>
                  </div>
                </div>
              </router-link>
              <div v-if="!hotResources.length" class="text-xs text-slate-400 text-center py-2">暂无数据</div>
            </div>
          </div>

          <div v-if="recommendResources.length" class="card p-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 class="font-bold text-slate-800 flex items-center gap-1.5">⭐ 站长推荐</h3>
            </div>
            <div class="space-y-3">
              <router-link v-for="(r, i) in recommendResources" :key="r.id" :to="`/resource/${r.id}`" class="flex gap-2.5 group items-start">
                <span class="w-5 h-5 rounded text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5"
                  :class="i<3 ? 'bg-primary-500' : 'bg-slate-300'">{{ i + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-semibold text-slate-700 group-hover:text-primary-600 transition-colors line-clamp-1">{{ r.title }}</h4>
                  <div class="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span>{{ r.publish_time }}</span>
                  </div>
                </div>
              </router-link>
            </div>
          </div>

          <div v-if="showFriendLinks && links.length" class="card p-5">
            <h3 class="font-bold text-slate-800 pb-3 border-b border-slate-100 mb-3">🔗 友情链接</h3>
            <div class="space-y-1.5">
              <a v-for="l in links" :key="l.id" :href="l.url" target="_blank" class="text-sm text-slate-500 hover:text-primary-600 transition-colors block">{{ l.name }}</a>
            </div>
          </div>
        </aside>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import CatIcon from '@/components/CatIcon.vue'
import api from '@/api'

const categories = ref([])
const resources = ref([])
const hotResources = ref([])
const recommendResources = ref([])
const adCards = ref([])
const links = ref([])
const showFriendLinks = ref(true)

const coverThemes = {
  '软件区': { emoji: '🖥️', bg: 'from-sky-200 via-cyan-100 to-blue-200' },
  '教程区': { emoji: '📚', bg: 'from-violet-200 via-fuchsia-100 to-pink-200' },
  '图片区': { emoji: '🖼️', bg: 'from-amber-200 via-orange-100 to-yellow-200' },
  '音乐区': { emoji: '🎵', bg: 'from-emerald-200 via-teal-100 to-cyan-200' },
  '视频区': { emoji: '🎬', bg: 'from-rose-200 via-red-100 to-orange-200' },
  '文档区': { emoji: '📄', bg: 'from-slate-200 via-gray-100 to-zinc-200' },
  '源码区': { emoji: '💻', bg: 'from-indigo-200 via-blue-100 to-sky-200' },
  '工具区': { emoji: '🛠️', bg: 'from-lime-200 via-green-100 to-emerald-200' },
  '网盘区': { emoji: '☁️', bg: 'from-blue-200 via-sky-100 to-indigo-200' },
}
function getCoverTheme(catName) {
  return coverThemes[catName] || { emoji: '📦', bg: 'from-primary-100 via-indigo-100 to-secondary-100' }
}

const catTagColors = {
  '软件区': 'bg-sky-50 text-sky-600',
  '教程区': 'bg-violet-50 text-violet-600',
  '图片区': 'bg-amber-50 text-amber-600',
  '音乐区': 'bg-emerald-50 text-emerald-600',
  '视频区': 'bg-rose-50 text-rose-600',
  '文档区': 'bg-slate-100 text-slate-600',
  '源码区': 'bg-indigo-50 text-indigo-600',
  '工具区': 'bg-lime-50 text-lime-600',
  '网盘区': 'bg-blue-50 text-blue-600',
}
function getCatTagColor(catName) {
  return catTagColors[catName] || 'bg-primary-50 text-primary-600'
}

const sort = ref('latest')
const page = ref(1)
const total = ref(0)
const pageSize = 12

const pageRange = computed(() => {
  const totalPages = Math.ceil(total.value / pageSize)
  const arr = []
  const start = Math.max(1, page.value - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
})

async function loadData() {
  try {
    const [c, cards, fs, settingsData] = await Promise.all([
      api.get('/categories'),
      api.get('/ad-cards'),
      api.get('/friend-links'),
      api.get('/settings/public')
    ])
    categories.value = c || []
    adCards.value = cards || []
    links.value = fs || []
    if (settingsData?.settings) {
      showFriendLinks.value = settingsData.settings.friend_links_status !== '0'
    }
  } catch (e) { console.error(e) }
}

async function loadResources() {
  try {
    const data = await api.get('/resources', { params: { sort: sort.value, page: page.value, page_size: pageSize } })
    resources.value = data.list || []
    total.value = data.total || 0
  } catch (e) { console.error(e) }
}

async function loadHot() {
  try {
    hotResources.value = await api.get('/resources/hot?limit=10') || []
  } catch (e) {}
}

async function loadRecommend() {
  try {
    recommendResources.value = await api.get('/resources/recommended?limit=10') || []
  } catch (e) {}
}

watch(sort, () => { page.value = 1; loadResources() })
watch(page, () => loadResources())

onMounted(() => {
  loadData()
  loadResources()
  loadHot()
  loadRecommend()
})
</script>
