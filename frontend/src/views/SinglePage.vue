<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="py-20 text-center text-slate-400">加载中...</div>
      <div v-else-if="!page" class="py-20 text-center text-slate-400">页面不存在</div>
      <article v-else class="card p-8">
        <h1 class="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{{ page.title }}</h1>
        <div class="text-sm text-slate-400 mb-6">{{ page.updated_at }}</div>
        <div class="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap" v-html="page.content"></div>
      </article>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import api from '@/api'

const route = useRoute()
const page = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    page.value = await api.get(`/pages/${route.params.slug}`)
  } catch (e) {}
  loading.value = false
})
</script>
