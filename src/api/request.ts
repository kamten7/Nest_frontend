import axios from 'axios'
import { ElMessage } from 'element-plus'

/** 后端 HTTP 接口地址（Spring Boot / Tomcat，见 application.yml 的 server.port） */
export const apiBaseUrl = 'http://localhost:8080'

/** 聊天 WebSocket 地址 —— ★ 由 Netty 提供，是独立端口，与 HTTP 不是同一个，不能由 apiBaseUrl 派生 */
export const wsBaseUrl = 'ws://localhost:8081'

const request = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
})

// 请求拦截器 —— 注入房东端 JWT Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers['token'] = token
  }
  return config
})

// 响应拦截器 —— 统一错误处理
request.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body.code === 1) {
      return body
    }
    ElMessage.error(body.msg || '请求失败')
    return Promise.reject(new Error(body.msg))
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('adminToken')
      window.location.href = '/landlord/login'
      ElMessage.error('登录已过期，请重新登录')
    } else if (err.response?.status === 403) {
      ElMessage.error('无权限操作')
    } else {
      ElMessage.error(err.message || '网络异常')
    }
    return Promise.reject(err)
  }
)

export default request
