<template>
  <footer class="mt-16 bg-white border-t border-slate-200/80 text-xs text-slate-500 py-8">
    <div class="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-md bg-primary-500 text-white flex items-center justify-center">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/></svg>
          </div>
          <span class="font-bold text-slate-800">资源仓库</span>
          <span class="text-slate-300">|</span>
          <span>{{ settings.site_desc || '免费网络资源分享平台，每日更新，无需注册' }}</span>
        </div>
        <div class="flex items-center gap-4 text-slate-400">
          <router-link to="/page/about" class="hover:text-slate-600 transition-colors">关于我们</router-link>
          <router-link to="/page/disclaimer" class="hover:text-slate-600 transition-colors">免责声明</router-link>
          <router-link to="/page/infringement" class="hover:text-slate-600 transition-colors">侵权投诉</router-link>
          <router-link to="/page/contact" class="hover:text-slate-600 transition-colors">联系我们</router-link>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-slate-100 text-center text-slate-400 text-[11px]">
        © {{ new Date().getFullYear() }} 资源仓库 Resource Depot
        <span v-if="settings.site_icp" class="ml-3">{{ settings.site_icp }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const settings = ref({})
onMounted(async () => {
  try {
    const data = await api.get('/settings/public')
    settings.value = data.settings || {}
  } catch (e) {}
})
</script>
