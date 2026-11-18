import axios from 'axios'

function getVisitorToken() {
  let t = localStorage.getItem('visitor_token')
  if (!t) {
    t = 'v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('visitor_token', t)
  }
  return t
}

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['X-Visitor-Token'] = getVisitorToken()
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token')
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login'
      }
    }
    const data = err.response?.data || {}
    const e = new Error(data.error || err.message)
    e.status = err.response?.status
    e.quota = data.quota
    throw e
  }
)

export default api
