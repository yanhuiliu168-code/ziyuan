<template>
  <div>
    <div class="bg-white rounded-xl p-5 border border-slate-200/60 mb-4">
      <el-form :inline="true" :model="form" label-width="70px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="分类名称" />
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="form.alias" placeholder="英文别名（可选）" />
        </el-form-item>
        <el-form-item label="图标">
          <el-popover placement="bottom-start" :width="420" trigger="click" v-model:visible="iconPopVisible">
            <template #reference>
              <div class="flex items-center gap-2 cursor-pointer select-none">
                <div class="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:border-primary-400 hover:bg-primary-50 transition-colors">
                  <CatIcon :name="form.icon" :size="18" />
                </div>
                <span class="text-xs text-slate-500">{{ form.icon || '选择图标' }}</span>
              </div>
            </template>
            <div class="max-h-[360px] overflow-y-auto">
              <div class="text-xs text-slate-400 mb-2 flex items-center gap-1">
                <span class="w-1 h-3 bg-primary-500 rounded"></span>矢量图标
              </div>
              <div class="grid grid-cols-8 gap-1.5">
                <button v-for="ic in iconList" :key="ic" @click="pickIcon(ic)"
                  class="aspect-square rounded-lg flex items-center justify-center text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-colors border border-transparent"
                  :class="form.icon === ic ? 'bg-primary-100 text-primary-700 border-primary-300' : ''">
                  <CatIcon :name="ic" :size="18" />
                </button>
              </div>
              <div class="mt-3 text-xs text-slate-400 mb-2 flex items-center gap-1">
                <span class="w-1 h-3 bg-secondary-500 rounded"></span>Emoji
              </div>
              <div class="grid grid-cols-10 gap-1">
                <button v-for="em in emojiList" :key="em" @click="pickIcon(em)"
                  class="aspect-square rounded-lg flex items-center justify-center text-lg hover:bg-primary-50 transition-colors"
                  :class="form.icon === em ? 'bg-primary-100' : ''">{{ em }}</button>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
              <el-input v-model="form.icon" size="small" placeholder="或手动输入图标名" />
              <el-button size="small" @click="iconPopVisible = false">确定</el-button>
            </div>
          </el-popover>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="save">{{ isEdit ? '更新' : '新增' }}</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="图标" width="80">
          <template #default="{ row }">
            <div class="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 mx-auto">
              <CatIcon :name="row.icon" :size="18" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="alias" label="别名" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="resource_count" label="资源数" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="edit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CatIcon from '@/components/CatIcon.vue'
import api from '@/api'

const list = ref([])
const isEdit = ref(false)
const iconPopVisible = ref(false)
const form = reactive({ id: null, name: '', alias: '', icon: 'FolderOpen', sort: 0, status: 1 })

const iconList = [
  'FolderOpen', 'Folder', 'File', 'Files', 'Archive', 'Package', 'Grid', 'LayoutGrid',
  'Film', 'Clapperboard', 'Video', 'Youtube', 'Play', 'Tent', 'Tv', 'Monitor',
  'Music', 'Headphones', 'Disc', 'Album', 'Microphone', 'Radio',
  'BookOpen', 'BookMarked', 'Library', 'GraduationCap', 'School', 'PenTool', 'Pencil',
  'Gamepad2', 'Gamepad', 'Trophy', 'Controller',
  'Image', 'Images', 'Camera', 'Photo', 'Palette', 'Brush', 'Type',
  'Download', 'CloudDownload', 'HardDrive', 'Save', 'Share2', 'Link',
  'Cpu', 'Laptop', 'Smartphone', 'Tablet', 'Code', 'Terminal', 'Database', 'Server',
  'ShoppingBag', 'ShoppingCart', 'Store', 'Banknote', 'Wallet', 'CreditCard', 'Receipt',
  'Settings', 'Sparkles', 'Rocket', 'Zap', 'Flame', 'Star', 'Gift', 'Tag',
  'Heart', 'Users', 'User', 'UserPlus', 'MessageCircle', 'Mail', 'Bell',
  'Coffee', 'Utensils', 'Car', 'Plane', 'Home', 'Building', 'Map', 'Globe',
  'Leaf', 'TreePine', 'Bug', 'Dices', 'Brain', 'Lightbulb', 'Wrench', 'Hammer'
]

const emojiList = ['📁', '🎬', '📺', '🎮', '🎵', '📚', '💻', '📷', '🎨', '🛒', '📦', '🏷️', '🔥', '⭐', '💎', '🚀', '✨', '💡', '🎯', '📱']

function pickIcon(ic) { form.icon = ic; iconPopVisible.value = false }

async function load() { list.value = await api.get('/categories') || [] }

function edit(row) { Object.assign(form, row); isEdit.value = true }
function reset() { Object.assign(form, { id: null, name: '', alias: '', icon: 'FolderOpen', sort: 0, status: 1 }); isEdit.value = false }

async function save() {
  if (!form.name) { ElMessage.warning('请输入名称'); return }
  if (isEdit.value) {
    await api.put(`/admin/categories/${form.id}`, form)
    ElMessage.success('已更新')
  } else {
    await api.post('/admin/categories', form)
    ElMessage.success('已添加')
  }
  reset(); load()
}

async function toggleStatus(row) { await api.put(`/admin/categories/${row.id}`, { status: row.status }) }
async function remove(row) {
  await ElMessageBox.confirm(`删除分类 "${row.name}"?`, '提示', { type: 'warning' })
  await api.delete(`/admin/categories/${row.id}`)
  ElMessage.success('已删除'); load()
}

onMounted(load)
</script>
