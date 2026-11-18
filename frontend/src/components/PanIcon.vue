<template>
  <div class="inline-flex items-center justify-center shrink-0 overflow-hidden" :style="boxStyle">
    <img v-if="provider && !failed" :src="provider.icon" :style="imgStyle" alt="" @error="failed = true" />
    <span v-else :style="textStyle">{{ fallbackText }}</span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { detectPan } from '@/utils/pan'

const props = defineProps({
  name: { type: String, default: '' },
  url: { type: String, default: '' },
  size: { type: Number, default: 32 }
})

const failed = ref(false)
const provider = computed(() => detectPan(props.url) || detectPan(props.name))
watch(provider, () => { failed.value = false })

const boxStyle = computed(() => {
  const s = props.size
  return {
    width: s + 'px',
    height: s + 'px',
    borderRadius: Math.round(s * 0.22) + 'px',
    background: provider.value && !failed.value ? '#fff' : (provider.value ? provider.value.color : '#e2e8f0'),
    border: provider.value && !failed.value ? `1px solid ${provider.value.color}33` : 'none'
  }
})

const imgStyle = computed(() => ({
  width: Math.round(props.size * 0.6) + 'px',
  height: Math.round(props.size * 0.6) + 'px',
  objectFit: 'contain'
}))

const fallbackText = computed(() => {
  const label = provider.value ? provider.value.name : (props.name || '网盘')
  return label.replace('网盘', '').replace('云盘', '').slice(0, 1) || '盘'
})

const textStyle = computed(() => ({
  color: provider.value ? '#fff' : '#64748b',
  fontSize: Math.round(props.size * 0.42) + 'px',
  fontWeight: 700,
  lineHeight: 1
}))
</script>
