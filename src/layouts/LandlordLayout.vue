<template>
  <div class="landlord-layout">
    <!-- 顶部导航栏 -->
    <header class="nav-bar">
      <div class="nav-brand">🏠 Nest 安居</div>

      <nav class="nav-links">
        <router-link to="/landlord/map" class="nav-link" active-class="active">
          🗺️ 房源地图
        </router-link>
        <router-link to="/landlord/house/list" class="nav-link" active-class="active">
          🏠 我的房源
        </router-link>
        <router-link to="/landlord/house/create" class="nav-link" active-class="active">
          ➕ 添加房源
        </router-link>
        <router-link to="/landlord/appointment" class="nav-link" active-class="active">
          📅 预约管理
        </router-link>
        <router-link to="/landlord/chat" class="nav-link" active-class="active">
          💬 消息
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="nav-badge" />
        </router-link>
        <router-link to="/landlord/wallet" class="nav-link" active-class="active">
          💰 钱包
        </router-link>
        <router-link to="/landlord/rent" class="nav-link" active-class="active">
          📋 租房订单
        </router-link>
      </nav>

      <div class="nav-right">
        <router-link to="/landlord/profile" class="nav-link profile-link" active-class="active">
          👤 {{ landlordName }}
        </router-link>
        <el-button text size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </header>

    <!-- 子页面 -->
    <main class="nav-main">
      <router-view />
    </main>

    <!-- 右上角通知弹窗 -->
    <NotificationHost />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminUnread } from '@/api/chat'
import { wsBaseUrl } from '@/api/request'
import { decodeJwt } from '@/utils/jwt'
import { useNotificationStore } from '@/stores/notification'
import NotificationHost from '@/components/NotificationHost.vue'

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

const landlordName = ref('房东')
const unreadCount = ref(0)

/** 从后端拉真实总未读数（登录/重连/收到新消息/离开聊天页时校准） */
async function refreshUnread() {
  try {
    const res: any = await getAdminUnread()
    unreadCount.value = Number(res.data || 0)
  } catch {
    // 拦截器已提示，保持原值
  }
}

// ==================== WebSocket 通知 ====================
let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let reconnectAttempts = 0
const MAX_RECONNECT = 5

/** 连接 WebSocket —— 监听租客的消息/预约推送 */
function connectWebSocket(landlordId: number) {
  // 先断开旧连接（重连场景）
  if (ws) ws.close()

  // 关键：后端握手鉴权强制校验 token，URL 必须带 ?token=，否则连接被拒、收不到推送
  const token = localStorage.getItem('adminToken') || ''
  const url = `${wsBaseUrl}/ws/chat/landlord/${landlordId}?token=${token}`
  ws = new WebSocket(url)

  ws.onopen = () => {
    console.log('WebSocket 已连接:', url)
    reconnectAttempts = 0
    refreshUnread()
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      // 只处理聊天/预约类通知
      if (data.type !== 'chat' && data.type !== 'appointment') return

      const title = data.title || (data.type === 'appointment' ? '有新的预约看房请求' : '租客来消息了')
      const content = data.content || ''
      const inChat = route.path.startsWith('/landlord/chat')
      const inCreate = route.path.startsWith('/landlord/house/create')

      // 聊天页内不弹“来消息”弹窗（会话内已实时显示）；发布页统一静默
      const silent = inCreate || (data.type === 'chat' && inChat)
      if (!silent) {
        // 右上角弹窗；chat 深链到对应会话，appointment 去预约管理
        const isChat = data.type === 'chat'
        notificationStore.push({
          title,
          content,
          type: isChat ? 'chat' : 'appointment',
          duration: 4000,
          onClick: () => {
            if (isChat) {
              router.push({
                path: '/landlord/chat',
                query: data.conversationId ? { conversationId: String(data.conversationId) } : {},
              })
            } else {
              router.push('/landlord/appointment')
            }
          },
        })
      }
      // 消息角标以服务端为准（不在聊天页时校准）；预约通知不计入聊天红点
      if (data.type === 'chat' && !inChat) {
        refreshUnread()
      }
    } catch (e) {
      console.error('WebSocket 消息解析失败:', e)
    }
  }

  ws.onclose = () => {
    console.log('WebSocket 已断开')
    // 简单断线重连
    if (reconnectAttempts < MAX_RECONNECT) {
      reconnectAttempts++
      reconnectTimer = window.setTimeout(() => {
        const token = localStorage.getItem('adminToken')
        const payload = token ? decodeJwt(token) : null
        if (payload?.userId) connectWebSocket(payload.userId)
      }, 3000)
    }
  }

  ws.onerror = (e) => {
    console.error('WebSocket 错误:', e)
  }
}

// ==================== 未读清零 ====================
// 进入聊天页 → 清零导航红点；离开聊天页 → 重新校准真实未读
watch(
  () => route.path,
  (path, oldPath) => {
    if (path.startsWith('/landlord/chat')) {
      unreadCount.value = 0
    } else if (oldPath && oldPath.startsWith('/landlord/chat')) {
      refreshUnread()
    }
  }
)

// ==================== 生命周期 ====================
onMounted(() => {
  const token = localStorage.getItem('adminToken')
  const payload = token ? decodeJwt(token) : null
  if (payload?.userId) {
    // 从 JWT 里拿名字（若存在），否则显示 id
    landlordName.value = '房东' + (payload.userId ?? '')
    connectWebSocket(payload.userId)
    refreshUnread()
  }
})

onBeforeUnmount(() => {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (ws) ws.close()
})

// ==================== 退出登录 ====================
function handleLogout() {
  if (ws) ws.close()
  localStorage.removeItem('adminToken')
  router.push('/landlord/login')
}
</script>

<style scoped>
.landlord-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  gap: 32px;
  flex-shrink: 0;
  z-index: 1001;
}

.nav-brand {
  font-size: 18px;
  font-weight: 700;
  color: #1a56db;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  gap: 8px;
  flex: 1;
}

.nav-link {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f5f7fa;
  color: #1a56db;
}

.nav-link.active {
  background: #ecf3ff;
  color: #1a56db;
  font-weight: 600;
}

.nav-badge {
  margin-left: 4px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.profile-link {
  padding: 8px 12px;
}

.landlord-name {
  font-size: 14px;
  color: #303133;
}

.nav-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
