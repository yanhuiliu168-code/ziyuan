import api from '@/api'

const GDT_SDK_URL = 'https://qzs.gdtimg.com/union/res/union_sdk/page/h5_sdk/i.js'

const PROVIDER_NAMES = {
  simulation: '模拟激励视频',
  direct_video: '视频广告',
  gdt_h5: '优量汇激励视频',
  custom: '合作方激励视频',
  pangle: '穿山甲激励视频'
}

export function providerLabel(provider, simulated) {
  const name = PROVIDER_NAMES[provider] || '激励视频'
  return simulated && provider !== 'simulation' ? `${name}（模拟回退）` : name
}

// 向服务端申请一次广告播放会话，返回广告位配置与最短观看时长
export async function createAdSession() {
  return api.post('/visitor/ad-session')
}

// 广告播放完成后凭会话领取观看配额
export async function completeRewardedAd(sessionId) {
  return api.post('/visitor/watch-ad', { session_id: sessionId })
}

/**
 * 播放激励视频
 * session: createAdSession() 的返回值
 * opts.mountEl: 自定义广告使用的 iframe 容器
 * opts.onStatus(msg): 状态文案回调
 * opts.onTick(left, total): 模拟广告倒计时回调
 * 返回 { simulated: boolean, error?: string }
 */
export async function playRewardedAd(session, opts = {}) {
  const { mountEl, onStatus = () => {}, onTick = () => {} } = opts
  const provider = session.provider || 'simulation'
  try {
    if (provider === 'gdt_h5') {
      await playGdtH5(session, onStatus)
      return { simulated: false }
    }
    if (provider === 'custom') {
      await playCustom(session, mountEl, onStatus)
      return { simulated: false }
    }
    if (provider === 'direct_video') {
      await playDirectVideo(session, mountEl, onStatus, onTick)
      return { simulated: false }
    }
    if (provider === 'pangle') {
      throw new Error('穿山甲仅支持移动原生 App，普通网页无法播放')
    }
    await simulateAd(session.simulation_seconds || 5, onStatus, onTick)
    return { simulated: true }
  } catch (err) {
    if (session.fallback === 'none') throw err
    onStatus(`真实广告加载失败，已切换模拟广告（${err.message}）`)
    await simulateAd(session.fallback_seconds || 5, onStatus, onTick)
    return { simulated: true, error: err.message }
  }
}

function simulateAd(totalSeconds, onStatus, onTick) {
  onStatus('正在播放激励视频…')
  return new Promise(resolve => {
    let left = totalSeconds
    onTick(left, totalSeconds)
    const timer = setInterval(() => {
      left -= 1
      onTick(left, totalSeconds)
      if (left <= 0) {
        clearInterval(timer)
        onTick(0, totalSeconds)
        resolve()
      }
    }, 1000)
  })
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('广告 SDK 加载失败，请检查网络或域名白名单'))
    document.head.appendChild(s)
  })
}

async function playGdtH5(session, onStatus) {
  const cfg = session.ad_config || {}
  if (!cfg.gdt_app_id || !cfg.gdt_placement_id) {
    throw new Error('后台未配置优量汇 AppID / 广告位 ID')
  }
  onStatus('正在加载优量汇广告 SDK…')
  await loadScript(GDT_SDK_URL)

  return new Promise((resolve, reject) => {
    let settled = false
    let timer = null
    let ad = null

    const finish = (res, err) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      err ? reject(err) : resolve(res)
    }

    const handle = res => {
      const data = (res && res.data) || {}
      const action = data.action || ''
      if (action === 'onADLoad' || action === 'onADLoaded') {
        onStatus('广告加载完成，正在播放…')
        try {
          ad && ad.showAd()
        } catch (e) {
          finish(null, e)
        }
      } else if (action === 'onReward' || action === 'onVideoComplete') {
        finish({ rewarded: true })
      } else if (action === 'onADClose' || action === 'onClose') {
        finish(null, new Error('广告未观看完成'))
      } else if (action === 'onError' || res.ret) {
        finish(null, new Error(data.message || `广告播放失败（${res.ret || action}）`))
      }
    }

    try {
      window.TencentGDT = window.TencentGDT || []
      window.TencentGDT.push({
        app_id: cfg.gdt_app_id,
        placement_id: cfg.gdt_placement_id,
        type: 'rewardVideo',
        onComplete: handle
      })
      const factory = window.TencentGDT.NATIVE && window.TencentGDT.NATIVE.rewardVideoAd
      if (!factory) throw new Error('优量汇 H5 SDK 未就绪，当前环境可能不支持')
      ad = new factory(handle)
      ad.loadAd()
      onStatus('正在请求优量汇广告…')
      timer = setTimeout(() => {
        finish(null, new Error('广告加载超时，普通浏览器可能不支持优量汇 H5 广告'))
      }, 15000)
    } catch (e) {
      finish(null, e)
    }
  })
}

function playCustom(session, mountEl, onStatus) {
  const cfg = session.ad_config || {}
  const html = (cfg.custom_html || '').trim()
  if (!html) return Promise.reject(new Error('后台未配置自定义广告代码'))
  if (!mountEl) return Promise.reject(new Error('广告容器不可用'))

  onStatus('正在加载广告…')
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox')
    iframe.style.cssText = 'width:100%;height:100%;border:0;background:#000;'
    iframe.srcdoc = html

    let settled = false
    let timer = null
    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      if (timer) clearTimeout(timer)
      iframe.remove()
    }
    const finish = (res, err) => {
      if (settled) return
      settled = true
      cleanup()
      err ? reject(err) : resolve(res)
    }
    function onMessage(e) {
      const d = e.data
      if (!d) return
      const type = typeof d === 'string' ? d : (d.type || d.event || '')
      if (type === 'rewarded_ad_complete' || type === 'rewardAdComplete' || d.rewarded === true) {
        finish({ rewarded: true })
      } else if (type === 'rewarded_ad_error' || type === 'rewardAdError') {
        finish(null, new Error(d.message || '广告播放失败'))
      }
    }
    window.addEventListener('message', onMessage)
    timer = setTimeout(() => finish(null, new Error('广告播放超时（90 秒）')), 90000)
    mountEl.innerHTML = ''
    mountEl.appendChild(iframe)
  })
}

// 直投视频广告：在网站内播放后台配置的真实视频，播完才发奖励
function playDirectVideo(session, mountEl, onStatus, onTick) {
  const cfg = session.ad_config || {}
  const url = (cfg.video_url || '').trim()
  if (!url) return Promise.reject(new Error('后台未配置广告视频地址'))
  if (!mountEl) return Promise.reject(new Error('广告容器不可用'))

  return new Promise((resolve, reject) => {
    mountEl.innerHTML = ''
    const wrap = document.createElement('div')
    wrap.className = 'relative w-full h-full bg-black'

    const video = document.createElement('video')
    video.src = url
    video.muted = true
    video.playsInline = true
    video.controls = false
    video.setAttribute('playsinline', '')
    video.className = 'w-full h-full object-contain bg-black'

    const badge = document.createElement('div')
    badge.textContent = cfg.video_title ? `广告 · ${cfg.video_title}` : '广告'
    badge.className = 'absolute left-2.5 top-2.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[11px] pointer-events-none'

    const more = document.createElement('a')
    if (cfg.video_click_url) {
      more.href = cfg.video_click_url
      more.target = '_blank'
      more.rel = 'noopener noreferrer'
      more.textContent = '了解详情 ›'
      more.className = 'absolute right-2.5 top-2.5 px-2.5 py-1 rounded-full bg-white/90 text-slate-900 text-[11px] font-bold'
      wrap.appendChild(more)
    }

    const playBtn = document.createElement('button')
    playBtn.textContent = '▶ 点击播放广告'
    playBtn.className = 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-2.5 rounded-full bg-white text-slate-900 text-sm font-bold'
    playBtn.style.display = 'none'

    let settled = false
    let timer = null

    const cleanup = () => {
      if (timer) clearTimeout(timer)
      video.pause()
      video.removeAttribute('src')
      video.load()
      mountEl.innerHTML = ''
    }
    const finish = err => {
      if (settled) return
      settled = true
      cleanup()
      err ? reject(err) : resolve({ rewarded: true })
    }

    const syncProgress = () => {
      const total = Math.ceil(video.duration || 0)
      if (total > 0) onTick(Math.max(0, Math.ceil(total - video.currentTime)), total)
    }
    video.addEventListener('loadedmetadata', syncProgress)
    video.addEventListener('timeupdate', syncProgress)
    video.addEventListener('ended', () => finish())
    video.addEventListener('error', () => finish(new Error('广告视频加载失败，请检查视频地址是否可访问')))

    playBtn.addEventListener('click', () => {
      playBtn.style.display = 'none'
      video.play().catch(() => finish(new Error('广告视频无法播放')))
    })

    wrap.appendChild(video)
    wrap.appendChild(badge)
    wrap.appendChild(playBtn)
    mountEl.appendChild(wrap)

    onStatus('广告播放中…')
    video.play().catch(() => {
      onStatus('浏览器阻止自动播放，请点击播放广告')
      playBtn.style.display = ''
    })
    timer = setTimeout(() => finish(new Error('广告播放超时')), 300000)
  })
}
