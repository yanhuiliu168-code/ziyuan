<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1 max-w-[1680px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      <div v-if="quotaBanner" class="mb-4 p-3 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-200 flex items-center gap-3 text-sm">
        <div class="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">{{ quotaBanner.remaining }}</div>
        <div class="flex-1 min-w-0 text-slate-700">
          你今天还可以免费查看 <b class="text-sky-600">{{ quotaBanner.remaining }}</b> 个资源（已看 {{ quotaBanner.viewed }} / 共 {{ quotaBanner.total }}）
        </div>
        <button v-if="quotaBanner.remaining <= 3 && quotaBanner.remaining > 0" @click="showAdModal" class="px-3 py-1.5 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-bold">
          📺 看广告 +{{ quotaBanner.next_ad_grant }}
        </button>
      </div>

      <div v-if="loading" class="py-20 text-center text-slate-400">加载中...</div>
      <div v-else-if="!resource && !quotaBlocked" class="py-20 text-center text-slate-400">资源不存在</div>
      <template v-else-if="!quotaBlocked">
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

              <div v-if="gallery.length" class="mt-6 space-y-3">
                <img v-for="(img, i) in gallery" :key="i" :src="img" :alt="resource.title" class="w-full h-auto rounded-lg object-contain bg-slate-50" />
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

      <div v-else class="py-10 flex items-start justify-center">
        <div class="w-full max-w-md text-center bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-secondary-500 to-orange-500 text-white flex items-center justify-center text-4xl mx-auto shadow-lg shadow-secondary-200">
            🚫
          </div>
          <h2 class="mt-5 text-xl font-bold text-slate-800">今日观看次数已用完</h2>
          <p class="mt-2 text-sm text-slate-500 leading-relaxed">
            你已免费查看 <b class="text-slate-700">{{ quotaInfo.viewed }}</b> 个资源，<br>
            看 1 个激励视频广告即可继续解锁 <b class="text-secondary-600 font-bold">{{ quotaInfo.next_ad_grant }}</b> 次观看
          </p>
          <div class="mt-6 grid grid-cols-2 gap-3 text-xs">
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div class="text-slate-400">已看广告</div>
              <div class="mt-1 text-lg font-bold text-slate-700">{{ quotaInfo.ad_count }} 次</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div class="text-slate-400">看广告解锁</div>
              <div class="mt-1 text-lg font-bold text-secondary-600">+{{ quotaInfo.next_ad_grant }}</div>
            </div>
          </div>
          <button @click="showAdModal" class="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-secondary-500 to-orange-500 hover:from-secondary-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-secondary-200 transition-all flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            观看视频广告解锁
          </button>
          <router-link to="/resources" class="mt-3 inline-block text-sm text-slate-500 hover:text-primary-600">← 返回资源列表</router-link>
        </div>
      </div>
    </main>

    <Teleport to="body">
      <div v-if="adModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" @click.self="adModalVisible = false">
        <div class="relative w-full max-w-lg mx-4 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
          <button @click="adModalVisible = false" class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center text-lg leading-none">×</button>

          <div class="relative aspect-video bg-black overflow-hidden">
            <div v-if="adPlaying" class="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div class="w-20 h-20 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
              <div class="mt-4 text-sm opacity-80">正在播放激励视频...</div>
              <div class="mt-1 text-xs opacity-60">广告剩余 {{ adCountdown }} 秒</div>
              <div class="w-48 h-1 mt-4 rounded-full bg-white/20 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-secondary-500 to-orange-500 transition-all duration-1000" :style="{ width: ((5 - adCountdown) / 5 * 100) + '%' }"></div>
              </div>
            </div>
            <div v-else-if="adCompleted" class="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div class="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-4xl">✓</div>
              <div class="mt-4 font-bold text-lg">观看完成！</div>
              <div class="mt-1 text-sm opacity-80">已为你解锁 +{{ lastGranted }} 次观看</div>
              <button @click="afterAd" class="mt-5 px-8 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors">
                继续查看资源
              </button>
            </div>
            <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-white">
              <svg class="w-20 h-20 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              <div class="mt-4 text-sm opacity-70">模拟激励视频广告</div>
              <button @click="startAd" class="mt-4 px-6 py-2 rounded-full bg-white text-slate-900 font-bold text-sm hover:bg-slate-100">
                ▶ 开始观看
              </button>
              <div class="mt-3 text-[11px] opacity-50">观看完成后可解锁额外配额</div>
            </div>
          </div>

          <div class="p-4 bg-slate-800 text-white flex items-center justify-between text-xs">
            <span class="opacity-60">📺 模拟广告 · 实际部署可对接穿山甲/优量汇</span>
            <span class="opacity-60">预计奖励 +{{ quotaInfo.next_ad_grant || 5 }} 次</span>
          </div>
        </div>
      </div>
    </Teleport>

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

const quotaInfo = ref({ enabled: false, remaining: -1, total: -1, viewed: 0, ad_count: 0, next_ad_grant: 5 })
const quotaBlocked = computed(() => quotaInfo.value.enabled && quotaInfo.value.remaining !== -1 && quotaInfo.value.remaining <= 0)
const quotaBanner = computed(() => {
  if (!quotaInfo.value.enabled || quotaInfo.value.remaining === -1) return null
  return quotaInfo.value
})

const adModalVisible = ref(false)
const adPlaying = ref(false)
const adCompleted = ref(false)
const adCountdown = ref(5)
const lastGranted = ref(0)
let adTimer = null

function showAdModal() {
  adModalVisible.value = true
  adPlaying.value = false
  adCompleted.value = false
  adCountdown.value = 5
}

function startAd() {
  adPlaying.value = true
  adCountdown.value = 5
  adTimer = setInterval(() => {
    adCountdown.value--
    if (adCountdown.value <= 0) {
      clearInterval(adTimer)
      adPlaying.value = false
      adCompleted.value = true
    }
  }, 1000)
}

async function afterAd() {
  adModalVisible.value = false
  adCompleted.value = false
  try {
    const res = await api.post('/visitor/watch-ad')
    lastGranted.value = res.granted
    quotaInfo.value.enabled = true
    quotaInfo.value.remaining = res.remaining
    quotaInfo.value.ad_count = res.ad_count
    ElMessage.success(`成功解锁 +${res.granted} 次观看！`)
    await load()
  } catch (e) {
    ElMessage.error(e)
  }
}

async function load() {
  loading.value = true
  try {
    const data = await api.get(`/resources/${route.params.id}`)
    resource.value = data
    comments.value = data.comments || []
    if (data._quota && data._quota.enabled) {
      quotaInfo.value = data._quota
    } else {
      quotaInfo.value = { enabled: false, remaining: -1, total: -1, viewed: 0, ad_count: 0, next_ad_grant: 5 }
    }
  } catch (e) {
    if (e.status === 403 && e.quota) {
      quotaInfo.value = e.quota
      resource.value = null
    } else {
      console.error(e)
    }
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
