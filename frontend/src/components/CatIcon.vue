<template>
  <component v-if="isLucide" :is="iconComp" :size="size" :stroke-width="strokeWidth" :class="$attrs.class" />
  <span v-else class="cat-emoji" :style="{ fontSize: size + 'px' }">{{ name }}</span>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  size: { type: [Number, String], default: 16 },
  strokeWidth: { type: Number, default: 2 }
})

function isEmoji(str) {
  if (!str) return false
  if (str.length <= 4 && /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/u.test(str)) return true
  return false
}

const lucideCache = {}

const iconComp = computed(() => {
  const n = props.name?.trim() || ''
  if (!n) return null
  if (isEmoji(n)) return null
  const name = n.charAt(0).toUpperCase() + n.slice(1)
  if (lucideCache[name]) return lucideCache[name]
  lucideCache[name] = defineAsyncComponent(() => import('lucide-vue-next').then(m => m[name]).catch(() => null))
  return lucideCache[name]
})

const isLucide = computed(() => {
  if (!props.name) return false
  if (isEmoji(props.name)) return false
  return true
})
</script>
