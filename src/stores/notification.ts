import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 一条通知 */
export interface NotificationItem {
  id: number
  title: string
  content: string
  type: 'chat' | 'appointment'
  /** 自动关闭时长（毫秒），默认 4000 */
  duration?: number
  /** 点击通知跳转的路由 */
  onClick?: () => void
}

/**
 * 通知 store —— 管理右上角弹窗列表。
 *
 * 为什么不用 Element Plus 的 ElNotification？
 * 它在 WebSocket 消息回调里调用时（无组件实例上下文）会被秒移除，不稳定。
 * 自己实现一个：数组 + 定时器 + 固定定位，完全可控，也方便学习。
 */
export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationItem[]>([])
  let nextId = 1

  /** 弹出一条通知，duration 毫秒后自动消失 */
  function push(item: Omit<NotificationItem, 'id'>) {
    const notification: NotificationItem = { ...item, id: nextId++ }
    notifications.value.push(notification)

    const duration = item.duration ?? 4000
    // 到达时长后自动移除
    setTimeout(() => {
      dismiss(notification.id)
    }, duration)

    return notification.id
  }

  /** 移除一条通知 */
  function dismiss(id: number) {
    const idx = notifications.value.findIndex((n) => n.id === id)
    if (idx >= 0) {
      notifications.value.splice(idx, 1)
    }
  }

  return { notifications, push, dismiss }
})
