<template>
  <el-container class="h-screen">
    <el-aside width="220px" class="bg-white border-r border-slate-200 shadow-sm">
      <div class="h-14 flex items-center justify-center border-b border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center text-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/></svg>
          </div>
          <span class="text-slate-800 font-bold text-sm">资源仓库管理</span>
        </div>
      </div>
      <el-menu :default-active="activeMenu" class="border-r-0 bg-white text-slate-700" active-text-color="#6c5ce7" background-color="transparent">
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path" @click="go(m.path)">
          <el-icon><component :is="m.icon" /></el-icon>
          <template #title>{{ m.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="bg-white border-b border-slate-200 flex items-center justify-between px-6">
        <div class="text-slate-500 text-sm font-medium">{{ currentTitle }}</div>
        <div class="flex items-center gap-4">
          <a href="/" target="_blank" class="text-sm text-slate-500 hover:text-primary-600 flex items-center gap-1">
            <el-icon><View /></el-icon> 查看前台
          </a>
          <el-dropdown @command="handleCommand">
            <span class="flex items-center gap-2 cursor-pointer text-sm">
              <div class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">{{ user?.username?.charAt(0).toUpperCase() }}</div>
              <span class="text-slate-700 font-medium">{{ user?.username }}</span>
              <el-icon class="text-slate-400"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="bg-slate-50 p-5 overflow-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { View, ArrowDown, Odometer, Box, Menu, PriceTag, ChatDotRound, Document, Link, Picture, Connection, Setting, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const menus = [
  { path: '/admin/dashboard', title: '仪表盘', icon: Odometer },
  { path: '/admin/resources', title: '资源管理', icon: Box },
  { path: '/admin/categories', title: '分类管理', icon: Menu },
  { path: '/admin/tags', title: '标签管理', icon: PriceTag },
  { path: '/admin/comments', title: '留言管理', icon: ChatDotRound },
  { path: '/admin/pages', title: '单页管理', icon: Document },
  { path: '/admin/nav', title: '导航菜单', icon: Link },
  { path: '/admin/ad-cards', title: '广告卡片', icon: Picture },
  { path: '/admin/links', title: '友情链接', icon: Connection },
  { path: '/admin/admins', title: '管理员', icon: User },
  { path: '/admin/settings', title: '站点设置', icon: Setting }
]

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => menus.find(m => route.path.startsWith(m.path) && m.path !== '/admin/resources')?.title || menus.find(m => route.path.startsWith('/admin/resources'))?.title || '')

const user = computed(() => {
  try { return JSON.parse(localStorage.getItem('admin_user') || 'null') } catch { return null }
})

function go(path) { router.push(path) }

async function handleCommand(cmd) {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/admin/login')
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<style>
.el-aside .el-menu.el-menu--inline { background: transparent; }
.el-aside .el-menu-item {
  color: #334155 !important;
  font-weight: 500;
  margin: 2px 8px;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
}
.el-aside .el-menu-item:hover {
  background-color: #f1f5f9 !important;
  color: #6c5ce7 !important;
}
.el-aside .el-menu-item.is-active {
  background: linear-gradient(135deg, #6c5ce7, #8b7bfa) !important;
  color: #fff !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(108, 92, 231, 0.3);
}
.el-aside .el-menu-item.is-active .el-icon {
  color: #fff !important;
}
</style>
