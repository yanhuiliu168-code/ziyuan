export const PAN_PROVIDERS = [
  {
    type: 'baidu',
    name: '百度网盘',
    keywords: ['pan.baidu', '百度网盘', '百度云盘'],
    icon: 'https://www.baidu.com/favicon.ico',
    color: '#2b7cff'
  },
  {
    type: 'tianyi',
    name: '天翼云盘',
    keywords: ['cloud.189', '天翼云盘', '天翼云'],
    icon: 'https://www.189.cn/favicon.ico',
    color: '#00a0e9'
  },
  {
    type: 'aliyun',
    name: '阿里云盘',
    keywords: ['aliyundrive', 'alipan', '阿里云盘'],
    icon: 'https://www.alipan.com/favicon.ico',
    color: '#7c5cff'
  },
  {
    type: 'quark',
    name: '夸克网盘',
    keywords: ['pan.quark', '夸克网盘', '夸克云盘'],
    icon: 'https://pan.quark.cn/favicon.ico',
    color: '#5b5bf5'
  },
  {
    type: 'xunlei',
    name: '迅雷云盘',
    keywords: ['pan.xunlei', '迅雷云盘', '迅雷云'],
    icon: 'https://www.xunlei.com/favicon.ico',
    color: '#1e90ff'
  }
]

// 根据链接或网盘名称识别服务商
export function detectPan(input) {
  if (!input) return null
  const text = String(input).toLowerCase()
  return PAN_PROVIDERS.find(p => p.keywords.some(k => text.includes(k.toLowerCase()))) || null
}

// 根据链接自动生成网盘名称，未识别时返回空字符串
export function detectPanName(url) {
  const provider = detectPan(url)
  return provider ? provider.name : ''
}
