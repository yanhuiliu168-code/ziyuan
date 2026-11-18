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
  view_limit_ad3: 1
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
