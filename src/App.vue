<template>
  <router-view />
</template>

<script setup lang="ts">
// App 根组件 —— 仅渲染 router-view
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #303133;
  background: #f5f7fa;
}

#app {
  height: 100%;
}
</style>
