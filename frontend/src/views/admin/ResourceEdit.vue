<template>
  <div>
    <div class="mb-4 flex items-center gap-3">
      <el-button @click="$router.push('/admin/resources')">← 返回列表</el-button>
      <h2 class="font-bold text-lg text-slate-800">{{ isEdit ? '编辑资源' : '新建资源' }}</h2>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" scroll-to-error class="bg-white rounded-xl p-6 border border-slate-200/60 max-w-4xl">
      <el-form-item label="分类" prop="category_id">
        <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入资源标题" />
      </el-form-item>
      <el-form-item label="封面图">
        <div class="flex items-center gap-3">
          <el-input v-model="form.cover" placeholder="封面图片URL" style="flex: 1" />
          <div class="flex items-center gap-1">
            <input type="file" ref="fileInput" accept="image/*" @change="handleUploadCover" class="hidden" />
            <el-button @click="$refs.fileInput.click()">上传</el-button>
          </div>
          <img v-if="form.cover" :src="form.cover" class="w-14 h-14 rounded object-cover border" />
        </div>
        <div class="text-xs text-slate-400 mt-1">封面作为列表缩略图，建议方形或横版</div>
      </el-form-item>

      <el-form-item label="相册图片">
        <div class="w-full">
          <div class="flex items-center gap-2 mb-2">
            <input type="file" ref="multiFileInput" accept="image/*" multiple @change="handleUploadImages" class="hidden" />
            <el-button @click="$refs.multiFileInput.click()" :loading="uploading">📷 批量上传图片</el-button>
            <el-button @click="addImageByUrl">🔗 粘贴 URL 添加</el-button>
            <span class="text-xs text-slate-400">支持多张，可拖动调整顺序</span>
          </div>
          <div v-if="form.images.length" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            <div v-for="(img, i) in form.images" :key="i" class="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-video">
              <img :src="img" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                <el-button type="primary" size="small" :icon="ArrowUp" circle @click="moveImageUp(i)" :disabled="i === 0" />
                <el-button type="primary" size="small" :icon="ArrowDown" circle @click="moveImageDown(i)" :disabled="i === form.images.length - 1" />
                <el-button type="danger" size="small" :icon="Delete" circle @click="removeImage(i)" />
              </div>
              <div class="absolute top-1 left-1 bg-primary text-white text-[10px] font-bold rounded px-1.5">{{ i + 1 }}</div>
            </div>
          </div>
          <div v-else class="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
            暂无相册图片，点击上方按钮添加
          </div>
        </div>
      </el-form-item>
      <el-form-item label="标签">
        <el-select v-model="form.tag_ids" multiple filterable allow-create default-first-option placeholder="输入标签" style="width: 100%">
          <el-option v-for="t in allTags" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="简介" prop="summary">
        <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="简要介绍资源（不超过200字）" maxlength="200" show-word-limit />
      </el-form-item>
      <el-form-item label="详情内容">
        <div class="w-full">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <input type="file" ref="contentFileInput" accept="image/*" @change="handleInsertContentImage" class="hidden" />
            <el-button size="small" @click="$refs.contentFileInput.click()" :loading="contentUploading">🖼️ 插入图片</el-button>
            <el-button size="small" @click="insertImageByUrl">🔗 插入图片链接</el-button>
            <span class="text-xs text-slate-400">图片会插入到光标位置，可与文字混排</span>
          </div>
          <el-input ref="contentInput" v-model="form.content" type="textarea" :rows="10"
            placeholder="资源详细介绍，支持纯文本与图片混排；直接输入文字，点上方按钮插入图片" />
          <div v-if="form.content" class="mt-2">
            <div class="text-xs text-slate-400 mb-1">效果预览</div>
            <div class="p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 leading-[1.9] whitespace-pre-wrap break-words content-preview" v-html="form.content"></div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="下载地址">
        <div class="w-full">
          <div v-for="(pan, i) in form.pans" :key="i" class="flex items-center gap-2 mb-2">
            <PanIcon :name="pan.pan_name" :url="pan.url" :size="28" />
            <el-input v-model="pan.pan_name" placeholder="网盘名称（粘贴链接后自动识别）" style="width: 170px" />
            <el-input v-model="pan.url" @input="onPanUrlInput(pan)" @change="onPanUrlInput(pan)" placeholder="链接" style="flex: 1" />
            <el-input v-model="pan.code" placeholder="提取码" style="width: 120px" />
            <el-button type="danger" :icon="Delete" circle @click="form.pans.splice(i,1)" />
          </div>
          <el-button :icon="Plus" @click="form.pans.push({pan_name:'', url:'', code:''})">添加下载地址</el-button>
          <div class="text-xs text-slate-400 mt-1">粘贴百度网盘 / 天翼云盘 / 阿里云盘 / 夸克网盘 / 迅雷云盘链接后，会自动识别网盘名称并显示对应图标</div>
        </div>
      </el-form-item>

      <el-form-item label="作者">
        <el-input v-model="form.author" placeholder="如：站长整理" style="width: 200px" />
      </el-form-item>

      <el-form-item label="置顶">
        <el-switch v-model="form.is_top" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="推荐">
        <el-switch v-model="form.is_recommend" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="展示状态">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        <span class="ml-2 text-xs text-slate-400">关闭后前台将隐藏此资源</span>
      </el-form-item>

      <el-row :gutter="16" class="max-w-xl">
        <el-col :span="12">
          <el-form-item label="浏览量">
            <el-input-number v-model="form.views" :min="0" :step="10" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发布时间">
            <el-date-picker v-model="form.publish_time" type="datetime" placeholder="选择发布时间"
              value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="排序值">
        <el-input-number v-model="form.sort" :min="0" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="save" :loading="saving">{{ isEdit ? '保存修改' : '创建资源' }}</el-button>
        <el-button @click="$router.push('/admin/resources')">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import api from '@/api'
import PanIcon from '@/components/PanIcon.vue'
import { detectPan } from '@/utils/pan'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const formRef = ref(null)
const saving = ref(false)
const uploading = ref(false)
const contentInput = ref(null)
const contentFileInput = ref(null)
const contentUploading = ref(false)
const fileInput = ref(null)
const multiFileInput = ref(null)
const categories = ref([])
const allTags = ref([])

function getNowStr() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function randViews() {
  return Math.floor(Math.random() * 9001) + 1000
}

const form = reactive({
  category_id: null, title: '', cover: '', summary: '', content: '',
  pans: [{ pan_name: '', url: '', code: '' }], tag_ids: [],
  author: '站长整理', views: randViews(), publish_time: getNowStr(),
  is_top: 0, is_recommend: 0, status: 1, sort: 0,
  images: []
})

const rules = {
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  summary: [{ required: true, message: '请输入简介', trigger: 'blur' }]
}

function onPanUrlInput(pan) {
  const provider = detectPan(pan.url)
  if (provider) pan.pan_name = provider.name
}

async function load() {
  if (isEdit.value) {
    const data = await api.get(`/resources/${route.params.id}`)
    Object.assign(form, {
      title: data.title, category_id: data.category_id, cover: data.cover,
      summary: data.summary, content: data.content, tag_ids: (data.tags || []).map(t => t.id),
      pans: data.pans?.length ? data.pans : [{ pan_name: '', url: '', code: '' }],
      author: data.author || '站长整理', views: data.views || 0,
      publish_time: data.publish_time || '',
      is_top: data.is_top, is_recommend: data.is_recommend, status: data.status, sort: data.sort,
      images: Array.isArray(data.images) ? data.images : []
    })
  }
}

async function uploadSingleFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  const data = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data.url
}

function insertContentHtml(html) {
  const ta = contentInput.value?.textarea || contentInput.value?.$el?.querySelector('textarea')
  const text = form.content || ''
  const pos = ta ? ta.selectionStart : text.length
  form.content = text.slice(0, pos) + html + text.slice(pos)
  nextTick(() => {
    if (!ta) return
    ta.focus()
    ta.selectionStart = ta.selectionEnd = pos + html.length
  })
}

async function handleInsertContentImage(e) {
  const file = e.target.files?.[0]
  if (!file) return
  contentUploading.value = true
  try {
    const url = await uploadSingleFile(file)
    insertContentHtml(`\n<img src="${url.replace(/"/g, '&quot;')}" alt="">\n`)
    ElMessage.success('图片已插入到光标位置')
  } catch (err) { ElMessage.error(err) }
  contentUploading.value = false
  e.target.value = ''
}

function insertImageByUrl() {
  const input = window.prompt('请输入图片地址（http/https 链接或 /uploads/...）')
  if (!input || !input.trim()) return
  insertContentHtml(`\n<img src="${input.trim().replace(/"/g, '&quot;')}" alt="">\n`)
}

async function handleUploadCover(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    form.cover = await uploadSingleFile(file)
    ElMessage.success('封面上传成功')
  } catch (err) { ElMessage.error(err) }
  e.target.value = ''
}

async function handleUploadImages(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  uploading.value = true
  let ok = 0, fail = 0
  for (const file of files) {
    try {
      const url = await uploadSingleFile(file)
      form.images.push(url)
      ok++
    } catch (err) { fail++ }
  }
  uploading.value = false
  if (ok) ElMessage.success(`成功上传 ${ok} 张${fail ? `，${fail} 张失败` : ''}`)
  else ElMessage.error('上传失败')
  e.target.value = ''
}

function checkImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ ok: true, width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ ok: false })
    img.src = url
  })
}

async function addImageByUrl() {
  try {
    const { value } = await ElMessageBox.prompt('请输入图片 URL', '添加图片', {
      confirmButtonText: '添加',
      cancelButtonText: '取消',
      inputPattern: /^https?:\/\//,
      inputErrorMessage: '请输入有效的 http/https 链接'
    })
    const url = value.trim()
    const { ok, width, height } = await checkImageUrl(url)
    if (!ok) {
      ElMessageBox.confirm(
        `<div style="line-height:1.8">
          系统无法加载此图片，请确认链接有效<br/>
          <a href="${url}" target="_blank" style="color:#409eff">${url}</a><br/>
          <span style="color:#909399;font-size:12px">提示：URL 必须直接指向图片（通常以 .jpg/.png/.webp 结尾）</span>
        </div>`,
        '⚠️ 图片无法加载',
        { confirmButtonText: '仍然添加', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
      ).then(() => {
        form.images.push(url)
        ElMessage.warning('已添加（图片可能无法显示）')
      }).catch(() => {})
      return
    }
    form.images.push(url)
    ElMessage.success(`已添加图片 ${width}×${height}`)
  } catch (e) {}
}

function moveImageUp(i) {
  if (i <= 0) return
  const arr = [...form.images]
  ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
  form.images = arr
}
function moveImageDown(i) {
  const arr = [...form.images]
  ;[arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]
  form.images = arr
}
function removeImage(i) {
  form.images.splice(i, 1)
}

async function save() {
  try {
    await formRef.value.validate()
  } catch (e) {
    ElMessage.warning('请先填写必填项：分类、标题、简介')
    return
  }
  saving.value = true
  try {
    const payload = {
      category_id: form.category_id, title: form.title, cover: form.cover,
      summary: form.summary, content: form.content, pans: form.pans.filter(p => p.url),
      tag_ids: form.tag_ids, author: form.author, views: form.views,
      publish_time: form.publish_time,
      is_top: form.is_top, is_recommend: form.is_recommend,
      status: form.status, sort: form.sort,
      images: form.images
    }
    if (isEdit.value) {
      await api.put(`/admin/resources/${route.params.id}`, payload)
      ElMessage.success('已保存')
    } else {
      await api.post('/admin/resources', payload)
      ElMessage.success('已创建')
    }
    router.push('/admin/resources')
  } catch (e) { ElMessage.error(e) }
  saving.value = false
}

onMounted(async () => {
  categories.value = await api.get('/categories') || []
  allTags.value = await api.get('/tags') || []
  await load()
})
</script>

<style scoped>
.content-preview :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  border-radius: 10px;
}
</style>
