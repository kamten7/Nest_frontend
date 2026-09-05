<template>
  <div class="map-page">
    <!-- 房源数量悬浮提示 -->
    <div class="marker-count-badge" v-if="markers.length">{{ markers.length }} 套房源</div>

    <!-- 地图容器 -->
    <div ref="mapContainer" class="map-container" />

    <!-- 右下角 + 按钮 → 跳转发布页（带当前中心坐标） -->
    <el-button class="add-btn" type="primary" size="large" circle :icon="Plus" @click="goCreate" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getLandlordMapMarkers, type HouseMarker } from '@/api/house'

const router = useRouter()
const mapContainer = ref<HTMLDivElement>()
const markers = ref<HouseMarker[]>([])

let map: L.Map

onMounted(async () => {
  await nextTick()
  initMap()
  loadMarkers()
})

onBeforeUnmount(() => {
  if (map) map.remove()
})

// 自定义房源标记图标 —— 用 L.icon() 显式指定本地图标路径。
// 不能用 L.Icon.Default.mergeOptions()（会自动检测路径导致拼接错误）。
const houseIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function initMap() {
  // Leaflet 是什么？--> 前端地图显示的 JavaScript 库
  // 广东湛江市霞山区
  map = L.map(mapContainer.value!).setView([21.27, 110.40], 13)

  // 高德地图瓦片（国内可访问、免费、无需 key、标准地图样式）。
  // {s} 是子域占位符，配合 subdomains 选项实现 webrd01~04 轮换，加快加载。
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    attribution: '&copy; <a href="https://www.amap.com">高德地图</a>',
    maxZoom: 18,
  }).addTo(map)

  // 布局加载完成后地图容器尺寸才就绪，需要刷新 Leaflet 尺寸计算
  setTimeout(() => map.invalidateSize(), 50)
}

async function loadMarkers() {
  try {
    const res: any = await getLandlordMapMarkers()
    markers.value = res.data || []
    renderMarkers()
  } catch {
    ElMessage.error('加载地图标记失败')
  }
}

function renderMarkers() {
  markers.value.forEach((h) => {
    if (!h.latitude || !h.longitude) return

    const coverHtml = h.coverImage
      ? `<img src="${h.coverImage}" alt="封面" style="width:200px;height:130px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />`
      : ''

    const html = `
      <div style="min-width:200px;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
        ${coverHtml}
        <div style="font-size:15px;font-weight:600;color:#303133;margin-bottom:4px;">${h.title}</div>
        <div style="font-size:18px;color:#e74c3c;font-weight:700;margin-bottom:8px;">
          ¥${h.price?.toLocaleString() || '—'}/月
        </div>
        <button
          onclick="window.__navigateToHouse(${h.id})"
          style="width:100%;padding:8px;background:#1a56db;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">
          查看详情
        </button>
      </div>`

    L.marker([h.latitude, h.longitude], { icon: houseIcon })
      .bindPopup(html, { maxWidth: 240 })
      .addTo(map)
  })
}

// 给 window 挂载导航函数（Leaflet popup 中的 onclick 需要全局函数）
;(window as any).__navigateToHouse = (id: number) => {
  router.push('/landlord/house/detail/' + id)
}

/** 跳转发布页，并把当前地图中心坐标带过去预填 */
function goCreate() {
  const center = map.getCenter()
  router.push({
    path: '/landlord/house/create',
    query: { lat: center.lat.toFixed(6), lng: center.lng.toFixed(6) },
  })
}
</script>

<style scoped>
.map-page {
  height: 100%;
  width: 100%;
  position: relative;
}

.marker-count-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  background: #fff;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  color: #303133;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-container {
  height: 100%;
  width: 100%;
}

.add-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  font-size: 24px;
  z-index: 1000;
  box-shadow: 0 4px 16px rgba(26, 86, 219, 0.35);
}
</style>
