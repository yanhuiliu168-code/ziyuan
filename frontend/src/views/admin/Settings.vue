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
  community_status: '1', community_title: '', community_desc: '', community_link: ''
})

async function load() {
  try {
    const data = await api.get('/settings/public')
    Object.assign(basic, data.settings || {})
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
