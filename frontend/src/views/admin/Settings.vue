<template>
  <div class="bg-white rounded-xl p-6 border border-slate-200/60">
    <el-tabs v-model="tab">
      <el-tab-pane label="基础设置" name="basic">
        <el-form :model="basic" label-width="130px" class="max-w-xl">
          <el-form-item label="站点名称">
            <el-input v-model="basic.site_name" />
          </el-form-item>
          <el-form-item label="站点描述">
            <el-input v-model="basic.site_desc" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="ICP 备案号">
            <el-input v-model="basic.site_icp" placeholder="可选" />
          </el-form-item>
          <el-form-item label="公告">
            <el-input v-model="basic.announcement" type="textarea" :rows="2" placeholder="顶部滚动公告，留空则不显示" />
          </el-form-item>
          <el-form-item label="公告颜色">
            <el-color-picker v-model="basic.announcement_color" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="首页模块" name="home">
        <el-form :model="basic" label-width="130px" class="max-w-xl">
          <el-form-item label="友情链接">
            <el-switch v-model="basic.friend_links_status" :active-value="'1'" :inactive-value="'0'" />
            <div class="text-xs text-slate-400 mt-1">关闭后前台首页右侧友情链接模块将隐藏</div>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="访问限制" name="limit">
        <el-alert class="mb-5" type="info" :closable="false" show-icon>
          <template #title>
            <span class="font-semibold">功能说明</span>
          </template>
          <div class="text-sm leading-relaxed">
            开启后，未登录访客在前台查看资源详情页会按以下规则消耗观看次数：<br>
            ① 免费观看 N 个资源后触发限制<br>
            ② 看一次激励视频广告解锁额外配额，第 1 次解锁 X 个、第 2 次解锁 Y 个、第 3 次及以后每次解锁 Z 个<br>
            ③ 管理员登录后不受任何限制
          </div>
        </el-alert>

        <el-form :model="basic" label-width="180px" class="max-w-xl">
          <el-form-item label="开启访问限制">
            <el-switch v-model="basic.view_limit_status" :active-value="'1'" :inactive-value="'0'" />
            <div class="text-xs text-slate-400 mt-1">关闭后所有用户无限制浏览全部资源</div>
          </el-form-item>

          <template v-if="basic.view_limit_status === '1'">
            <el-form-item label="免费观看次数">
              <el-input-number v-model="basic.view_limit_free" :min="1" :max="999" />
              <div class="text-xs text-slate-400 mt-1">新用户进来默认能免费看多少个资源</div>
            </el-form-item>

            <el-divider content-position="left">看广告解锁配额</el-divider>

            <el-form-item label="第 1 次看广告解锁">
              <el-input-number v-model="basic.view_limit_ad1" :min="1" :max="99" />
              <span class="ml-3 text-sm text-slate-500">个</span>
            </el-form-item>
            <el-form-item label="第 2 次看广告解锁">
              <el-input-number v-model="basic.view_limit_ad2" :min="1" :max="99" />
              <span class="ml-3 text-sm text-slate-500">个</span>
            </el-form-item>
            <el-form-item label="第 3 次及以后每次解锁">
              <el-input-number v-model="basic.view_limit_ad3" :min="1" :max="99" />
              <span class="ml-3 text-sm text-slate-500">个（此后每次看广告都解锁这么多）</span>
            </el-form-item>

            <el-divider content-position="left">效果预览</el-divider>
            <div class="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm space-y-2 text-slate-600">
              <div>🔓 新用户 = <b class="text-primary-600">{{ basic.view_limit_free }}</b> 次免费</div>
              <div>📺 看第 1 个广告 → 额外 +<b class="text-secondary-600">{{ basic.view_limit_ad1 }}</b> 次，累计 <b>{{ Number(basic.view_limit_free) + Number(basic.view_limit_ad1) }}</b></div>
              <div>📺 看第 2 个广告 → 额外 +<b class="text-secondary-600">{{ basic.view_limit_ad2 }}</b> 次，累计 <b>{{ Number(basic.view_limit_free) + Number(basic.view_limit_ad1) + Number(basic.view_limit_ad2) }}</b></div>
              <div>📺 看第 3 个广告 → 额外 +<b class="text-secondary-600">{{ basic.view_limit_ad3 }}</b> 次，累计 <b>{{ Number(basic.view_limit_free) + Number(basic.view_limit_ad1) + Number(basic.view_limit_ad2) + Number(basic.view_limit_ad3) }}</b></div>
              <div>♾️ 此后每看 1 个广告 → 再 +<b class="text-secondary-600">{{ basic.view_limit_ad3 }}</b> 次</div>
            </div>
          </template>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="广告设置" name="ad">
        <el-alert class="mb-5" type="warning" :closable="false" show-icon>
          <template #title>
            <span class="font-semibold">关于真实激励视频</span>
          </template>
          <div class="text-sm leading-relaxed">
            穿山甲官方只支持移动原生 App（iOS/Android/Unity/鸿蒙），优量汇 H5 激励视频也只允许在其 Android SDK 的 WebView 内播放。<br>
            纯网站建议用「直投视频广告」直接播放 MP4 广告，或用「自定义广告代码」接入支持网页的视频联盟。
          </div>
        </el-alert>

        <el-form :model="basic" label-width="180px" class="max-w-2xl">
          <el-form-item label="广告平台">
            <el-select v-model="basic.ad_provider" style="width: 100%">
              <el-option label="模拟广告（不接真实平台，仅演示流程）" value="simulation" />
              <el-option label="直投视频广告（配置 MP4，网站直接播放）" value="direct_video" />
              <el-option label="自定义广告代码（iframe + postMessage 回调）" value="custom" />
              <el-option label="优量汇 H5 激励视频（仅 App WebView 内可播放）" value="gdt_h5" />
              <el-option label="穿山甲（仅原生 App，网页不支持）" value="pangle" />
            </el-select>
          </el-form-item>

          <template v-if="basic.ad_provider === 'direct_video'">
            <el-form-item label="广告视频地址">
              <el-input v-model="basic.ad_video_url" placeholder="https://.../ad.mp4（需可直接访问的 MP4 直链）" />
            </el-form-item>
            <el-form-item label="广告标题">
              <el-input v-model="basic.ad_video_title" placeholder="例如：限时活动推荐（可不填）" />
            </el-form-item>
            <el-form-item label="点击跳转地址">
              <el-input v-model="basic.ad_video_click_url" placeholder="用户点击「了解详情」后跳转的链接（可不填）" />
            </el-form-item>
            <el-alert class="mb-4" type="info" :closable="false" show-icon>
              视频需完整播放结束才发放奖励，建议 15~30 秒；格式用 MP4（H.264），不要用 m3u8。
            </el-alert>
          </template>

          <template v-if="basic.ad_provider === 'gdt_h5'">
            <el-form-item label="优量汇 AppID">
              <el-input v-model="basic.gdt_app_id" placeholder="例如 110xxxxxxx" />
            </el-form-item>
            <el-form-item label="优量汇广告位 ID">
              <el-input v-model="basic.gdt_placement_id" placeholder="激励视频广告位 ID" />
            </el-form-item>
            <el-alert class="mb-4" type="info" :closable="false" show-icon>
              需先在优量汇后台创建「激励视频」广告位并申请 H5 激励视频权限；播放依赖 App 壳的 WebView 环境。
            </el-alert>
          </template>

          <template v-if="basic.ad_provider === 'pangle'">
            <el-form-item label="穿山甲 AppID">
              <el-input v-model="basic.pangle_app_id" placeholder="仅原生 App 使用" />
            </el-form-item>
            <el-form-item label="穿山甲广告位 ID">
              <el-input v-model="basic.pangle_slot_id" placeholder="仅原生 App 使用" />
            </el-form-item>
          </template>

          <template v-if="basic.ad_provider === 'custom'">
            <el-form-item label="自定义广告代码">
              <el-input v-model="basic.custom_ad_html" type="textarea" :rows="8" placeholder="粘贴广告联盟提供的 HTML / JS 代码（可含 script 标签）" />
              <div class="text-xs text-slate-500 mt-1 leading-relaxed">
                代码会在隔离 iframe 中执行。播放完成后请调用
                <code class="px-1 bg-slate-100 rounded">parent.postMessage('rewarded_ad_complete', '*')</code>
                通知本站发放奖励；播放失败可调用
                <code class="px-1 bg-slate-100 rounded">parent.postMessage({type:'rewarded_ad_error', message:'原因'}, '*')</code>。
              </div>
            </el-form-item>
          </template>

          <el-divider content-position="left">播放与回退策略</el-divider>

          <el-form-item label="最短观看时长">
            <el-input-number v-model="basic.ad_min_seconds" :min="1" :max="120" />
            <span class="ml-3 text-sm text-slate-500">秒，服务端校验，未达标不发奖励</span>
          </el-form-item>
          <el-form-item label="模拟广告时长">
            <el-input-number v-model="basic.ad_simulation_seconds" :min="1" :max="120" />
            <span class="ml-3 text-sm text-slate-500">秒，建议不小于最短观看时长</span>
          </el-form-item>
          <el-form-item label="真实广告失败时">
            <el-radio-group v-model="basic.ad_fallback_mode">
              <el-radio value="simulation">回退模拟广告并发放奖励</el-radio>
              <el-radio value="none">不发奖励，提示重新观看</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="basic.ad_fallback_mode !== 'none'" label="回退广告时长">
            <el-input-number v-model="basic.ad_fallback_seconds" :min="1" :max="120" />
            <span class="ml-3 text-sm text-slate-500">秒</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <div class="mt-4 pt-4 border-t border-slate-100 flex gap-3">
      <el-button type="primary" @click="save" :loading="saving">保存设置</el-button>
      <el-button @click="load">重置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

const tab = ref('basic')
const saving = ref(false)
const basic = reactive({
  site_name: '', site_desc: '', site_icp: '', announcement: '', announcement_color: '#6c5ce7',
  community_status: '1', community_title: '', community_desc: '', community_link: '',
  friend_links_status: '1',
  view_limit_status: '0',
  view_limit_free: 10,
  view_limit_ad1: 5,
  view_limit_ad2: 3,
  view_limit_ad3: 1,
  ad_provider: 'simulation',
  ad_min_seconds: 5,
  ad_simulation_seconds: 5,
  ad_fallback_mode: 'simulation',
  ad_fallback_seconds: 5,
  gdt_app_id: '',
  gdt_placement_id: '',
  pangle_app_id: '',
  pangle_slot_id: '',
  ad_video_url: '',
  ad_video_title: '',
  ad_video_click_url: '',
  custom_ad_html: ''
})

async function load() {
  try {
    const data = await api.get('/settings')
    Object.assign(basic, data || {})
    if (!basic.view_limit_status) basic.view_limit_status = '0'
    if (!basic.view_limit_free) basic.view_limit_free = 10
    if (!basic.view_limit_ad1) basic.view_limit_ad1 = 5
    if (!basic.view_limit_ad2) basic.view_limit_ad2 = 3
    if (!basic.view_limit_ad3) basic.view_limit_ad3 = 1
    if (!basic.ad_provider) basic.ad_provider = 'simulation'
    if (!basic.ad_fallback_mode) basic.ad_fallback_mode = 'simulation'
    basic.ad_min_seconds = Number(basic.ad_min_seconds) || 5
    basic.ad_simulation_seconds = Number(basic.ad_simulation_seconds) || 5
    basic.ad_fallback_seconds = Number(basic.ad_fallback_seconds) || 5
    basic.gdt_app_id = basic.gdt_app_id || ''
    basic.gdt_placement_id = basic.gdt_placement_id || ''
    basic.pangle_app_id = basic.pangle_app_id || ''
    basic.pangle_slot_id = basic.pangle_slot_id || ''
    basic.ad_video_url = basic.ad_video_url || ''
    basic.ad_video_title = basic.ad_video_title || ''
    basic.ad_video_click_url = basic.ad_video_click_url || ''
    basic.custom_ad_html = basic.custom_ad_html || ''
  } catch (e) {}
}

async function save() {
  saving.value = true
  try {
    await api.put('/admin/settings', basic)
    ElMessage.success('已保存')
  } catch (e) { ElMessage.error(e) }
  saving.value = false
}

onMounted(load)
</script>
