import request from './request'

/** 会话 */
export interface Conversation {
  id: number
  otherType: string
  otherId: number
  otherName: string
  otherAvatar: string | null
  lastMessage: string | null
  lastMessageTime: string | null
  unreadCount: number
}

/** 消息 */
export interface ChatMessage {
  id: number
  conversationId: number
  senderType: string
  senderId: number
  senderName: string
  content: string
  msgType: string
  mine: boolean
  isRead: number
  createTime: string
}

/** 我的会话列表 */
export function getConversations() {
  return request.get<{ data: { total: number; records: Conversation[] } }>('/admin/chat/conversations')
}

/** 历史消息 */
export function getMessages(conversationId: number) {
  return request.get<{ data: { total: number; records: ChatMessage[] } }>(
    `/admin/chat/messages/${conversationId}`
  )
}

/** 房东端总未读数（导航红点） */
export function getAdminUnread() {
  return request.get<{ data: number }>('/admin/chat/unread')
}
