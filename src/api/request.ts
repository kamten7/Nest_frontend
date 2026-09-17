import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 后端地址按「当前打开页面的主机名」派生，端口固定（可用 Vite 环境变量覆盖）。
 *
 * ⚠️ 不要写死 localhost：`vite.config.ts` 的 `server.host='0.0.0.0'` 会让 dev server 打印
 * 多个 Network 地址（LAN / VMware / WSL vEthernet…），用哪个地址打开页面，页面里的
 * localhost 就指向哪个环境。写死 localhost 会导致**只有从 localhost 打开时 WebSocket 才连得上**，
 * 换成其它入口地址就表现为「消息发不出去」。
 *
 * 覆盖方式（可选）：.env 里设 VITE_BACKEND_HOST / VITE_HTTP_PORT / VITE_WS_PORT。
 */
const env = ((import.meta as any).env || {}) as Record<string, string | undefined>
const pageHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const backendHost = env.VITE_BACKEND_HOST || pageHost || 'localhost'

/** 后端 HTTP 接口地址（Spring Boot / Tomcat，见 application.yml 的 server.port） */
export const apiBaseUrl = `http://${backendHost}:${env.VITE_HTTP_PORT || '8080'}`

/** 聊天 WebSocket 地址 —— ★ 由 Netty 提供，是独立端口，与 HTTP 不是同一个，不能由 apiBaseUrl 派生 */
export const wsBaseUrl = `ws://${backendHost}:${env.VITE_WS_PORT || '8081'}`

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
