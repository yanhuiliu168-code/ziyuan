<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1 max-w-[1680px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      <div v-if="loading" class="py-20 text-center text-slate-400">加载中...</div>
      <div v-else-if="!resource" class="py-20 text-center text-slate-400">资源不存在</div>
      <template v-else>
        <div class="flex flex-col lg:flex-row gap-6 items-start">
          <aside class="w-full lg:w-60 shrink-0 space-y-4">
            <div class="card p-3">
              <div class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-2">资源分类</div>
              <nav class="space-y-0.5">
                <router-link to="/resources" class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors text-sm font-medium">
                  <span>全部资源</span>
                </router-link>
                <router-link v-for="cat in categories" :key="cat.id" :to="`/category/${cat.id}`"
                  class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  :class="cat.id === resource.category_id ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'">
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

          <section class="flex-1 w-full min-w-0 space-y-5">
            <nav class="text-sm text-slate-400 flex items-center gap-1.5 flex-wrap">
              <router-link to="/" class="hover:text-primary-600">首页</router-link>
              <span>/</span>
              <router-link to="/resources" class="hover:text-primary-600">全部资源</router-link>
              <span>/</span>
              <span class="text-slate-600">{{ resource.category_name }}</span>
            </nav>

            <article class="card p-6 md:p-8">
              <div class="flex items-center gap-2 mb-3 flex-wrap">
                <span v-if="resource.is_top" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary-50 text-secondary-600">🔥 置顶推荐</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-600">{{ resource.category_name }}</span>
                <span v-for="tag in resource.tags" :key="tag.id" class="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">#{{ tag.name }}</span>
              </div>

              <h1 class="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{{ resource.title }}</h1>

              <div class="mt-4 flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                <span class="flex items-center gap-1">
                  <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-400 text-white flex items-center justify-center text-[11px] font-bold">{{ resource.author?.charAt(0) || '匿' }}</div>
                  {{ resource.author || '匿名' }}
                </span>
                <span>📅 {{ resource.publish_time }}</span>
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  {{ resource.views.toLocaleString() }} 次浏览
                </span>
                <span class="text-secondary-500">📦 共 {{ resource.pans?.length || 0 }} 份网盘</span>
              </div>

              <div v-if="gallery.length" class="mt-6 rounded-xl overflow-hidden bg-slate-100">
                <el-carousel v-if="gallery.length > 1" height="420px" :interval="4000" indicator-position="outside">
                  <el-carousel-item v-for="(img, i) in gallery" :key="i">
                    <img :src="img" :alt="resource.title" class="w-full h-full object-contain bg-slate-50" />
                  </el-carousel-item>
                </el-carousel>
                <img v-else :src="gallery[0]" :alt="resource.title" class="w-full h-auto object-contain" />
              </div>

              <div class="mt-6 p-5 rounded-xl bg-amber-50 border border-amber-100">
                <div class="flex items-start gap-2">
                  <span class="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">!</span>
                  <div>
                    <h4 class="text-sm font-bold text-amber-700">💡 资源简介</h4>
                    <p class="mt-1 text-sm text-amber-700/90 leading-relaxed">{{ resource.summary }}</p>
                  </div>
                </div>
              </div>

              <div v-if="resource.content" class="mt-6 prose prose-slate max-w-none">
                <div class="text-slate-700 leading-relaxed" v-html="resource.content"></div>
              </div>
            </article>

            <div v-if="resource.pans?.length" class="rounded-2xl overflow-hidden ring-2 ring-secondary-200 shadow-xl shadow-secondary-100/60">
              <div class="bg-gradient-to-r from-secondary-500 via-orange-500 to-amber-500 px-6 py-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <svg class="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </div>
                <div>
                  <div class="font-bold text-white text-base">⬇️ 立即下载资源</div>
                  <div class="text-[12px] text-white/80 mt-0.5">本站资源永久免费，点击下方按钮直达下载</div>
                </div>
                <span class="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white">{{ resource.pans.length }} 份可用网盘</span>
              </div>
              <div class="bg-white p-5 space-y-4">
                <div v-for="(pan, i) in resource.pans" :key="i" class="group">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shrink-0">{{ (pan.pan_type || pan.pan_name || '网盘').slice(0,2) }}</div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-bold text-slate-800">{{ pan.pan_type || pan.pan_name || '网盘' }}</div>
                      <div class="text-[11px] text-emerald-500 font-medium">✓ 官方渠道 · 真实有效</div>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button @click.prevent="copy(pan.url)" class="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-2 transition-all">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      复制下载链接
                    </button>
                    <a :href="pan.url" target="_blank" class="py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-200 hover:shadow-lg hover:shadow-primary-300">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      立即前往下载
                    </a>
                  </div>
                  <div v-if="pan.code" class="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <span>提取码：</span>
                    <code class="px-2 py-0.5 rounded bg-primary-50 text-primary-600 font-bold tracking-wider border border-primary-100">{{ pan.code }}</code>
                    <button @click="copy(pan.code)" class="text-[10px] text-primary-500 hover:text-primary-600 underline">点我复制</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="card p-4 flex items-center justify-between gap-3">
              <router-link v-if="resource.prev?.id" :to="`/resource/${resource.prev.id}`" class="flex-1 min-w-0 group">
                <div class="text-xs text-slate-400 mb-1">← 上一篇</div>
                <div class="text-sm font-medium text-slate-700 group-hover:text-primary-600 line-clamp-1">{{ resource.prev.title }}</div>
              </router-link>
              <div v-else class="text-sm text-slate-300 flex-1 text-center">没有上一篇了</div>
              <div class="w-px h-10 bg-slate-200 shrink-0"></div>
              <router-link v-if="resource.next?.id" :to="`/resource/${resource.next.id}`" class="flex-1 min-w-0 group text-right">
                <div class="text-xs text-slate-400 mb-1">下一篇 →</div>
                <div class="text-sm font-medium text-slate-700 group-hover:text-primary-600 line-clamp-1">{{ resource.next.title }}</div>
              </router-link>
              <div v-else class="text-sm text-slate-300 flex-1 text-center">没有下一篇了</div>
            </div>

            <section class="card p-6">
              <h3 class="font-bold text-slate-800 mb-5 flex items-center gap-2">💬 资源评论 <span class="text-xs font-normal text-slate-400">({{ comments.length }})</span></h3>
              <form @submit.prevent="submitComment" class="space-y-3">
                <textarea v-model="form.content" rows="3" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm resize-none" placeholder="说点什么..." required></textarea>
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <input v-model="form.nickname" class="flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="昵称" />
                  <button type="submit" class="btn-primary">发表评论</button>
                </div>
              </form>

              <div class="mt-6 space-y-4">
                <div v-for="c in comments" :key="c.id" class="p-4 rounded-lg bg-slate-50">
                  <div class="flex items-center gap-2 text-sm">
                    <span class="font-bold text-slate-700">{{ c.nickname }}</span>
                    <span v-if="c.is_admin" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-50 text-secondary-600">管理员</span>
                    <span class="text-slate-400 text-xs">{{ c.created_at }}</span>
                  </div>
                  <p class="mt-2 text-sm text-slate-700 leading-relaxed">{{ c.content }}</p>
                </div>
                <div v-if="!comments.length" class="text-center text-sm text-slate-400 py-6">暂无评论，快来抢沙发吧</div>
              </div>
            </section>
          </section>

          <aside class="w-full lg:w-80 shrink-0 space-y-5">
            <div class="card overflow-hidden ring-2 ring-secondary-200 shadow-lg shadow-secondary-100/50">
              <div class="bg-gradient-to-r from-secondary-500 via-orange-500 to-amber-500 text-white px-5 py-4 flex items-center gap-2">
                <div class="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <svg class="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </div>
                <div>
                  <span class="font-bold text-base">资源下载</span>
                  <span class="ml-2 text-xs opacity-90">点击下方按钮获取</span>
                </div>
                <span class="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur">{{ resource.pans?.length || 0 }} 份网盘</span>
              </div>

              <div class="p-5 space-y-4">
                <div v-if="resource.pans?.length" class="space-y-4">
                  <div v-for="(pan, i) in resource.pans" :key="i" class="space-y-2">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{{ (pan.pan_type || pan.pan_name || '网盘').slice(0,2) }}</div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-semibold text-slate-700">{{ pan.pan_type || pan.pan_name || '网盘' }}</div>
                        <div class="text-[11px] text-slate-400">官方渠道，真实有效</div>
                      </div>
                      <span class="inline-flex items-center gap-0.5 text-[11px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>有货
                      </span>
                    </div>

                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div class="text-xs text-slate-400 mb-1">下载链接</div>
                      <div class="text-sm text-slate-600 font-medium break-all line-clamp-1">{{ pan.url }}</div>
                      <div v-if="pan.code" class="mt-2 flex items-center gap-2">
                        <span class="text-xs text-slate-400">提取码</span>
                        <code class="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-primary-600 tracking-wider">{{ pan.code }}</code>
                      </div>
                    </div>

                    <div class="flex gap-2">
                      <button v-if="pan.url" @click.prevent="copy(pan.url)" class="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        复制链接
                      </button>
                      <a v-if="pan.url" :href="pan.url" target="_blank" class="flex-[1.3] py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary-200 hover:shadow-lg hover:shadow-primary-300">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        立即下载
                      </a>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center text-sm text-slate-400 py-6">暂无下载地址</div>

                <div class="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div class="flex items-start gap-2">
                    <span class="text-blue-500 font-bold">ℹ️</span>
                    <p class="text-[12px] text-blue-700 leading-relaxed">
                      资源来自网络收集，如有侵权请联系站长删除
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card p-5">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 class="font-bold text-slate-800 flex items-center gap-1.5">🔥 相关推荐</h3>
                <router-link to="/resources?sort=recommend" class="text-xs text-primary-600 hover:underline">更多 →</router-link>
              </div>
              <div class="space-y-3">
                <router-link v-for="r in hotResources" :key="r.id" :to="`/resource/${r.id}`" class="flex gap-2.5 group items-start">
                  <img v-if="r.cover" :src="r.cover" class="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100" />
                  <div v-else class="w-14 h-14 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-xl shrink-0">📦</div>
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold text-slate-700 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">{{ r.title }}</h4>
                    <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span class="text-secondary-500 font-medium">{{ r.views?.toLocaleString() }} 次浏览</span>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import CatIcon from '@/components/CatIcon.vue'
import api from '@/api'

const route = useRoute()
const resource = ref(null)
const loading = ref(true)

const gallery = computed(() => {
  if (!resource.value) return []
  const arr = []
  if (resource.value.cover) arr.push(resource.value.cover)
  if (Array.isArray(resource.value.images)) arr.push(...resource.value.images)
  return arr
})
const comments = ref([])
const categories = ref([])
const adCards = ref([])
const hotResources = ref([])
const form = ref({ nickname: '', content: '' })

async function load() {
  loading.value = true
  try {
    const data = await api.get(`/resources/${route.params.id}`)
    resource.value = data
    comments.value = data.comments || []
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

async function loadSidebar() {
  try {
    const [c, cards, hot] = await Promise.all([
      api.get('/categories'),
      api.get('/ad-cards'),
      api.get('/resources/hot?limit=5')
    ])
    categories.value = c || []
    adCards.value = cards || []
    hotResources.value = hot || []
  } catch (e) {}
}

async function submitComment() {
  try {
    const res = await api.post('/comments', { resource_id: resource.value.id, ...form.value })
    if (res.needReview) {
      ElMessage.success('留言成功，等待审核')
    } else {
      ElMessage.success('留言成功')
      comments.value = await api.get(`/comments?resource_id=${route.params.id}`) || []
    }
    form.value.content = ''
    form.value.nickname = ''
  } catch (e) {
    ElMessage.error(e)
  }
}

function copy(text) {
  navigator.clipboard?.writeText(text).then(() => ElMessage.success('已复制到剪贴板')).catch(() => ElMessage.warning('复制失败'))
}

onMounted(() => {
  load()
  loadSidebar()
})

watch(() => route.params.id, () => {
  load()
})
</script>
