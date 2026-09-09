import axios from 'axios'

const service = axios.create({
  baseURL: '/api/om',
  timeout: 15000
})

// 请求拦截器：从 localStorage 获取 token
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('om_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default service