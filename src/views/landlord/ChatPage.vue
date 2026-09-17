<template>
  <div class="chat-page">
    <!-- 左：会话列表 -->
    <div class="conversation-list">
      <div class="list-header">会话列表</div>

      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="conversation-item"
        :class="{ active: currentConvId === conv.id }"
        @click="openConversation(conv.id)"
      >
        <div class="conv-avatar">{{ (conv.otherName || '?').charAt(0) }}</div>
        <div class="conv-info">
          <div class="conv-name">{{ conv.otherName }}</div>
          <div class="conv-preview">{{ conv.lastMessage || '暂无消息' }}</div>
        </div>
        <div class="conv-right">
          <div class="conv-time">{{ formatTime(conv.lastMessageTime) }}</div>
          <div v-if="conv.unreadCount > 0" class="unread-badge">{{ conv.unreadCount }}</div>
        </div>
      </div>

      <div v-if="conversations.length === 0" class="list-empty">
        <p>暂无会话</p>
        <p class="list-hint">等租客联系你或发起预约后，会显示在这里</p>
      </div>
    </div>

    <!-- 右：聊天窗口 -->
    <div class="chat-window">
      <template v-if="currentConv">
        <div class="window-header">{{ currentConv.otherName }}</div>

        <div class="message-list" ref="messageList">
          <div
            v-for="(msg, idx) in messages"
            :key="msg.id"
            class="message-row"
            :class="msg.mine ? 'mine' : 'theirs'"
          >
            <div class="bubble">{{ msg.content }}</div>
            <div
              v-if="msg.mine && (msg.isRead === 1 || idx === lastOwnMsgIndex)"
              class="msg-status"
              :class="{ read: msg.isRead === 1 }"
            >
              {{ msg.isRead === 1 ? '已读' : idx === lastOwnMsgIndex ? '未读' : '' }}
            </div>
          </div>
        </div>

        <div class="input-bar">
          <el-input v-model="inputText" placeholder="输入消息…" @keyup.enter="sendMessage" />
          <el-button type="primary" @click="sendMessage">发送</el-button>
        </div>
      </template>

      <div v-else class="window-empty">
        <el-icon :size="48" color="#c0c4cc"><ChatDotRound /></el-icon>
        <p>选择一个会话开始聊天</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { getConversations, getMessages, type Conversation, type ChatMessage } from '@/api/chat'
import { wsBaseUrl } from '@/api/request'
import { decodeJwt } from '@/utils/jwt'

const conversations = ref<Conversation[]>([])
const currentConvId = ref<number | null>(null)
const currentConv = ref<Conversation | null>(null)
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const messageList = ref<HTMLDivElement>()
const route = useRoute()

let ws: WebSocket | null = null

/** 最后一条自己发出的消息下标（用于气泡显示 未读/已读） */
const lastOwnMsgIndex = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].mine) return i
  }
  return -1
})

onMounted(async () => {
  await loadConversations()
  connectSocket()
  openFromQuery()
})

// 弹窗/角标深链：/landlord/chat?conversationId=xxx 自动打开对应会话
function openFromQuery() {
  const q = Number(route.query.conversationId)
  if (!q || currentConvId.value === q) return
  if (!conversations.value.some((c) => c.id === q)) return
  openConversation(q)
}

watch(
  () => route.query.conversationId,
  () => {
    if (conversations.value.length) openFromQuery()
  }
)

onBeforeUnmount(() => {
  if (ws) ws.close()
})

async function loadConversations() {
  try {
    const res: any = await getConversations()
    conversations.value = res.data?.records || []
  } catch {
    // 拦截器已提示
  }
}

async function openConversation(id: number) {
  currentConvId.value = id
  currentConv.value = conversations.value.find((c) => c.id === id) || null
  try {
    const res: any = await getMessages(id)
    messages.value = res.data?.records || []
    scrollToBottom()
    // 打开会话后重拉列表：后端已标记该会话已读，刷新会话列表让未读角标清零
    await loadConversations()
  } catch {
    // 拦截器已提示
  }
}

/** 连接 WebSocket（房东端）。重复调用安全：已连上/连接中则跳过，否则丢弃旧连接再重建。 */
function connectSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
  if (ws) {
    ws.onclose = null
    ws.close()
  }

  const token = localStorage.getItem('adminToken')
  const payload = token ? decodeJwt(token) : null
  if (!payload?.userId) return

  const url = `${wsBaseUrl}/ws/chat/landlord/${payload.userId}?token=${token}`
  ws = new WebSocket(url)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'chat') {
        // 收到新消息：刷新会话列表 + 若是当前会话则追加
        loadConversations()
        if (currentConvId.value && String(data.conversationId) === String(currentConvId.value)) {
          messages.value.push({
            id: data.msgId,
            conversationId: data.conversationId,
            senderType: data.fromType,
            senderId: data.fromId,
            senderName: data.senderName,
            content: data.content,
            msgType: data.msgType,
            mine: false,
            isRead: 0,
            createTime: new Date(data.timestamp).toISOString(),
          })
          scrollToBottom()
          // 正在读该会话 → 立即回已读回执，并稍后刷新列表让角标清零
          sendReadReceipt(data.conversationId, data.msgId)
          setTimeout(() => loadConversations(), 250)
        }
      } else if (data.type === 'read_receipt') {
        // 对方已读：把己方消息置为已读（本地乐观消息没有服务端 id，整会话置读）
        if (
          currentConvId.value &&
          String(data.conversationId) === String(currentConvId.value)
        ) {
          messages.value = messages.value.map((m) => (m.mine ? { ...m, isRead: 1 } : m))
        }
      }
    } catch (e) {
      console.error('WebSocket 消息解析失败', e)
    }
  }
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text || !currentConv.value) return

  // ⚠️ 不能只判 !ws：socket 对象存在但未 OPEN 时 ws.send 会静默丢消息（或抛 InvalidStateError），
  // 用户只看到"点了发送但没反应"。这里显式校验并尝试重连。
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    ElMessage.warning('聊天连接未就绪，正在重连，请稍后再试')
    connectSocket()
    return
  }

  // 本地追加自己的消息
  messages.value.push({
    id: Date.now(),
    conversationId: currentConv.value.id,
    senderType: 'landlord',
    senderId: 0,
    senderName: '我',
    content: text,
    msgType: 'text',
    mine: true,
    isRead: 0,
    createTime: new Date().toISOString(),
  })
  inputText.value = ''
  scrollToBottom()

  ws.send(JSON.stringify({
    type: 'chat',
    toType: currentConv.value.otherType,
    toId: currentConv.value.otherId,
    content: text,
    msgType: 'text',
  }))
}

/** 当前正在看会话时，收到对方新消息 → 回传已读回执 */
function sendReadReceipt(conversationId: number, lastReadMsgId: number) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  ws.send(JSON.stringify({ type: 'read_receipt', conversationId, lastReadMsgId }))
}

function formatTime(t: string | null) {
  if (!t) return ''
  return t.replace('T', ' ').slice(5, 16)
}

function scrollToBottom() {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
}

.conversation-list {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  background: #fff;
  overflow-y: auto;
  flex-shrink: 0;
}

.list-header {
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #f0f2f5;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.conversation-item:hover {
  background: #f5f7fa;
}

.conversation-item.active {
  background: #ecf3ff;
}

.conv-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1a56db;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.conv-preview {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.conv-time {
  font-size: 11px;
  color: #c0c4cc;
}

.unread-badge {
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #e74c3c;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.list-empty {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.list-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 8px;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.window-header {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  font-size: 15px;
  color: #303133;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-row {
  display: flex;
  flex-direction: column;
}

.message-row.mine {
  justify-content: flex-end;
  align-items: flex-end;
}

.message-row.theirs {
  justify-content: flex-start;
  align-items: flex-start;
}

.bubble {
  max-width: 60%;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.mine .bubble {
  background: #1a56db;
  color: #fff;
  border-top-right-radius: 2px;
}

.theirs .bubble {
  background: #fff;
  color: #303133;
  border-top-left-radius: 2px;
}

.msg-status {
  font-size: 11px;
  line-height: 1;
  margin-top: 3px;
  color: #b0b3b8;
}

.msg-status.read {
  color: #909399;
}

.input-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}

.window-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}
</style>
