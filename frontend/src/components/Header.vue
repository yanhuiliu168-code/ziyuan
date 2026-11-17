<template>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-sm">
    <div class="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
      <div class="flex items-center gap-8">
        <router-link to="/" class="flex items-center gap-2.5 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
          </div>
          <div>
            <span class="text-lg font-bold text-slate-900 tracking-tight">{{ settings.site_name || '资源仓库' }}</span>
            <p class="text-[10px] text-slate-400 tracking-wider leading-none">RESOURCE DEPOT</p>
          </div>
        </router-link>
        <nav class="hidden md:flex items-center gap-1 font-medium text-sm">
          <router-link v-for="nav in navs" :key="nav.id" :to="nav.link" :target="nav.target === 1 ? '_blank' : undefined"
            class="px-3.5 py-2 rounded-lg transition-colors"
            :class="$route.path === nav.link ? 'text-primary-600 bg-primary-50/70 font-semibold' : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'">
            {{ nav.name }}
          </router-link>
        </nav>
      </div>
      <div class="flex items-center gap-3">
        <form @submit.prevent="goSearch" class="relative w-56 lg:w-72">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input v-model="searchKeyword" class="w-full pl-9 pr-14 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400" placeholder="搜项目、资源、关键词..." type="text">
          <button type="submit" class="absolute inset-y-1 right-1 px-3 bg-primary-500 text-white rounded-md text-xs hover:bg-primary-600 transition-colors">搜索</button>
        </form>
      </div>
    </div>
    <div v-if="announcement" class="py-2 px-4 text-sm flex items-center justify-center gap-2" :style="{ background: announcementColor + '20', borderTop: '1px solid ' + announcementColor + '40' }">
      <span class="px-2 py-0.5 rounded-full text-xs font-bold text-white" :style="{ background: announcementColor }">公告</span>
      <span class="text-slate-700">{{ announcement }}</span>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const navs = ref([])
const settings = ref({})
const announcement = ref('')
const announcementColor = ref('#6c5ce7')
const searchKeyword = ref('')

onMounted(async () => {
  try {
    const data = await api.get('/settings/public')
    navs.value = data.navs || []
    settings.value = data.settings || {}
    announcement.value = data.announcement || ''
    announcementColor.value = data.announcement_color || '#6c5ce7'
  } catch (e) {
    console.error(e)
  }
})

function goSearch() {
  if (searchKeyword.value.trim()) {
    window.location.href = '/search?q=' + encodeURIComponent(searchKeyword.value)
  }
}
</script>
