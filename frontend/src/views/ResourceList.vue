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
                全部资源
              </router-link>
              <router-link v-for="cat in categories" :key="cat.id" :to="`/category/${cat.id}`"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                :class="{ 'bg-primary-50 text-primary-600': categoryId === cat.id }">
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
          <div class="card p-4">
            <div class="flex items-center justify-between">
              <h2 class="font-bold text-lg text-slate-800">
                <template v-if="categoryName">分类：{{ categoryName }}</template>
                <template v-else-if="tagName">标签：#{{ tagName }}</template>
                <template v-else>全部资源</template>
              </h2>
              <span class="text-sm text-slate-400">共 {{ total }} 条</span>
            </div>
          </div>

          <article v-for="r in resources" :key="r.id" class="card card-hover group p-0 overflow-hidden relative" :class="{ 'ring-2 ring-secondary-200': r.is_top }">
            <div v-if="r.is_top" class="h-1.5 bg-gradient-to-r from-secondary-400 via-orange-400 to-amber-400"></div>
            <div class="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
              <div class="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span :class="['px-2 py-0.5 rounded text-xs font-bold', getCatTagColor(r.category_name)]">{{ r.category_name || '未分类' }}</span>
                    <span class="text-xs text-slate-400">{{ r.publish_time }}</span>
                    <span class="text-xs text-slate-400 flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      {{ r.views }}
                    </span>
                    <span v-if="r.is_recommend" class="px-1.5 py-0.5 rounded bg-primary-100 text-primary-600 text-[10px] font-bold">推荐</span>
                  </div>
                  <router-link :to="`/resource/${r.id}`">
                    <h3 class="font-bold text-slate-800 group-hover:text-primary-600 transition-colors leading-snug" :class="r.is_top ? 'text-lg' : 'text-base'">{{ r.title }}</h3>
                  </router-link>
                  <p class="mt-2 text-sm text-slate-500 line-clamp-3 leading-relaxed">{{ r.summary }}</p>
                </div>
                <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span v-for="tag in r.tags?.slice(0,3)" :key="tag.id" class="tag">#{{ tag.name }}</span>
                  </div>
                  <router-link :to="`/resource/${r.id}`" class="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-200 transition-all whitespace-nowrap">
                    立即获取
                    <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                  </router-link>
                </div>
              </div>
              <router-link :to="`/resource/${r.id}`" class="w-28 sm:w-36 lg:w-40 h-20 sm:h-24 rounded-lg overflow-hidden shrink-0 group relative border border-slate-100">
                <img v-if="r.cover" :src="r.cover" :alt="r.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div v-else :class="['w-full h-full bg-gradient-to-br flex items-center justify-center', getCoverTheme(r.category_name).bg]">
                  <span class="text-4xl drop-shadow-sm">{{ getCoverTheme(r.category_name).emoji }}</span>
                </div>
              </router-link>
            </div>
          </article>

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
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import CatIcon from '@/components/CatIcon.vue'
import api from '@/api'

const route = useRoute()
const resources = ref([])
const categories = ref([])
const adCards = ref([])
const tags = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 12

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

const categoryId = computed(() => route.params.id && route.name === 'Category' ? Number(route.params.id) : null)
const tagId = computed(() => route.params.id && route.name === 'Tag' ? Number(route.params.id) : null)

const categoryName = ref('')
const tagName = ref('')

const pageRange = computed(() => {
  const totalPages = Math.ceil(total.value / pageSize)
  const arr = []
  const start = Math.max(1, page.value - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
})

async function loadCategories() {
  categories.value = await api.get('/categories') || []
}

async function loadAdCards() {
  try { adCards.value = await api.get('/ad-cards') || [] } catch (e) {}
}

async function loadResources() {
  const params = { page: page.value, page_size: pageSize }
  if (categoryId.value) params.category_id = categoryId.value
  if (tagId.value) params.tag_id = tagId.value
  const data = await api.get('/resources', { params })
  resources.value = data.list || []
  total.value = data.total || 0

  if (categoryId.value) {
    const cat = categories.value.find(c => c.id === categoryId.value)
    categoryName.value = cat?.name || ''
  } else {
    categoryName.value = ''
  }
  if (tagId.value) {
    tagName.value = ''
    const allTags = await api.get('/tags')
    const t = (allTags || []).find(x => x.id === tagId.value)
    tagName.value = t?.name || ''
  } else {
    tagName.value = ''
  }
}

watch(() => route.params.id, () => { page.value = 1; loadResources() })
watch(page, () => loadResources())

onMounted(async () => {
  await loadCategories()
  loadAdCards()
  loadResources()
})
</script>
