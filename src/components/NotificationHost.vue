<template>
  <!-- 固定在右上角的通知容器，每弹一条通知在这里显示 -->
  <div class="notification-host">
    <transition-group name="notif">
      <div
        v-for="n in store.notifications"
        :key="n.id"
        class="notification-card"
        :class="n.type"
        @click="handleClick(n)"
      >
        <div class="notif-icon">{{ n.type === 'appointment' ? '📅' : '💬' }}</div>
        <div class="notif-body">
          <div class="notif-title">{{ n.title }}</div>
          <div class="notif-content">{{ n.content }}</div>
        </div>
        <div class="notif-close" @click.stop="store.dismiss(n.id)">✕</div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore, type NotificationItem } from '@/stores/notification'

const store = useNotificationStore()

function handleClick(n: NotificationItem) {
  // 点击通知 → 执行注册的跳转逻辑，然后关闭
  n.onClick?.()
  store.dismiss(n.id)
}
</script>

<style scoped>
.notification-host {
  position: fixed;
  top: 68px; /* 避开顶部导航栏 56px + 间距 */
  right: 16px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none; /* 容器不挡点击，卡片自己可点 */
}

.notification-card {
  pointer-events: auto;
  width: 320px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: flex;
  gap: 10px;
  align-items: flex-start;
  cursor: pointer;
  border-left: 4px solid;
  transition: transform 0.2s, box-shadow 0.2s;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

.notification-card.chat {
  border-left-color: #1a56db;
}

.notification-card.appointment {
  border-left-color: #e6a23c;
}

.notif-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.notif-content {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  /* 两行省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-close {
  color: #c0c4cc;
  font-size: 12px;
  flex-shrink: 0;
  padding: 2px;
}

.notif-close:hover {
  color: #909399;
}

/* 进入/离开动画 */
.notif-enter-active,
.notif-leave-active {
  transition: all 0.3s ease;
}

.notif-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.notif-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
