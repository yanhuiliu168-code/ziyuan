<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div class="card p-6">
        <h2 class="font-bold text-lg text-slate-800 mb-4">🔍 搜索结果</h2>
        <div class="flex gap-3">
          <input v-model="q" @keyup.enter="doSearch" class="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-base" placeholder="输入关键词搜索资源..." />
          <button @click="doSearch" class="btn-primary px-6">搜索</button>
        </div>
        <p v-if="keyword" class="mt-4 text-sm text-slate-500">关键词 "<span class="text-primary-600 font-medium">{{ keyword }}</span>" 相关结果 {{ total }} 条</p>
      </div>

      <div class="mt-6 space-y-4">
        <router-link v-for="r in resources" :key="r.id" :to="`/resource/${r.id}`" class="card card-hover p-5 flex gap-5 items-start">
          <div class="w-32 h-24 rounded-lg shrink-0 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
            <img v-if="r.cover" :src="r.cover" class="w-full h-full object-cover" loading="lazy" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded bg-primary-50 text-primary-600 text-xs font-bold">{{ r.category_name }}</span>
              <span class="text-xs text-slate-400">{{ r.publish_time }} · {{ r.views }} 浏览</span>
            </div>
            <h3 class="font-bold text-slate-800 hover:text-primary-600 transition-colors line-clamp-1">{{ r.title }}</h3>
            <p class="mt-1 text-sm text-slate-500 line-clamp-2">{{ r.summary }}</p>
          </div>
        </router-link>
        <div v-if="!resources.length && keyword" class="card p-16 text-center text-slate-400">
          <div class="text-6xl mb-4">😔</div>
          <p>没有找到相关资源，换个关键词试试吧</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const q = ref('')
const keyword = ref('')
const resources = ref([])
const total = ref(0)

async function doSearch() {
  keyword.value = q.value.trim()
  if (!keyword.value) { resources.value = []; total.value = 0; return }
  router.replace({ path: '/search', query: { q: keyword.value } })
  try {
    const data = await api.get('/resources/search', { params: { q: keyword.value } })
    resources.value = data.list || data || []
    total.value = data.total || resources.value.length
  } catch (e) { console.error(e) }
}

watch(() => route.query.q, v => { q.value = v || ''; if (v) doSearch() })
onMounted(() => { q.value = route.query.q || ''; if (q.value) doSearch() })
</script>
