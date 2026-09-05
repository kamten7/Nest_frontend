<template>
  <div class="detail-page" v-if="house">
    <!-- 顶部操作栏 -->
    <header class="detail-header">
      <el-button text @click="goBack">← 返回</el-button>
      <h1>房源详情</h1>
      <div class="header-actions">
        <el-button size="small" type="primary" @click="goEdit">编辑</el-button>
        <el-button size="small" :type="house.status === 1 ? 'warning' : 'success'" @click="toggleStatus">
          {{ house.status === 1 ? '下架' : '上架' }}
        </el-button>
        <el-popconfirm title="确定删除该房源吗？" confirm-button-text="删除" @confirm="removeHouse">
          <template #reference>
            <el-button size="small" type="danger">删除</el-button>
          </template>
        </el-popconfirm>
      </div>
    </header>

    <main class="detail-body">
      <!-- 图片轮播 -->
      <div class="carousel" v-if="house.images && house.images.length">
        <el-carousel height="360px" indicator-position="outside">
          <el-carousel-item v-for="(img, idx) in house.images" :key="idx">
            <img :src="img" class="carousel-img" alt="房源图片" />
          </el-carousel-item>
        </el-carousel>
      </div>
      <div v-else class="no-image">🏠</div>

      <!-- 基本信息 -->
      <section class="section">
        <div class="price-row">
          <span class="price">¥{{ house.price }}/月</span>
          <span v-if="house.deposit" class="deposit">押金 {{ house.deposit }} 元</span>
          <el-tag :type="house.status === 1 ? 'success' : 'info'" class="status-tag">
            {{ house.status === 1 ? '已上架' : '已下架' }}
          </el-tag>
        </div>
        <h2 class="title">{{ house.title }}</h2>
        <div class="location">📍 {{ house.city }}·{{ house.district }}·{{ house.address }}</div>
        <div class="tags" v-if="house.tags && house.tags.length">
          <el-tag v-for="t in house.tags" :key="t" type="primary" effect="light">{{ t }}</el-tag>
        </div>
      </section>

      <!-- 房屋信息 -->
      <section class="section">
        <h3 class="section-title">房屋信息</h3>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="出租方式">{{ house.rentType || '—' }}</el-descriptions-item>
          <el-descriptions-item label="面积">{{ house.area ? house.area + '㎡' : '—' }}</el-descriptions-item>
          <el-descriptions-item label="户型">{{ house.roomCount }}室{{ house.hallCount }}厅{{ house.bathroomCount }}卫</el-descriptions-item>
          <el-descriptions-item label="朝向">{{ house.orientation || '—' }}</el-descriptions-item>
          <el-descriptions-item label="楼层">{{ house.floor ? house.floor + '/' + (house.totalFloor || '?') + '层' : '—' }}</el-descriptions-item>
          <el-descriptions-item label="可入住">{{ house.availableDate || '—' }}</el-descriptions-item>
          <el-descriptions-item label="浏览量">{{ house.viewCount }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ house.createTime?.slice(0, 10) || '—' }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <!-- 描述 -->
      <section class="section" v-if="house.description">
        <h3 class="section-title">房源描述</h3>
        <p class="description">{{ house.description }}</p>
      </section>

      <!-- 要求 -->
      <section class="section" v-if="house.requirements">
        <h3 class="section-title">租客要求</h3>
        <p class="description">{{ house.requirements }}</p>
      </section>

      <!-- 房东信息 -->
      <section class="section" v-if="house.landlordName">
        <h3 class="section-title">房东信息</h3>
        <div class="landlord-row">
          <div class="landlord-avatar">{{ house.landlordName.charAt(0) }}</div>
          <span class="landlord-name">{{ house.landlordName }}</span>
        </div>
      </section>

      <!-- 住客评价 -->
      <section class="section">
        <h3 class="section-title">
          住客评价
          <span v-if="reviews.avgRating" class="avg-rating">⭐ {{ reviews.avgRating }}</span>
        </h3>
        <el-empty v-if="!reviews.records.length" description="暂无评价" :image-size="60" />
        <div v-for="r in reviews.records" :key="r.id" class="review-item">
          <div class="review-header">
            <span class="review-name">{{ r.tenantName }}</span>
            <el-rate :model-value="r.rating" disabled size="small" />
          </div>
          <p class="review-content">{{ r.content }}</p>
          <div v-if="r.comments && r.comments.length" class="comment-list">
            <div v-for="c in r.comments" :key="c.id" class="comment-item">
              <span class="comment-name">{{ c.userName }}：</span>{{ c.content }}
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getHouseById, updateHouseStatus, deleteHouse, type HouseVO } from '@/api/house'
import request from '@/api/request'

const route = useRoute()
const router = useRouter()
const houseId = Number(route.params.id)
const house = ref<HouseVO | null>(null)
const reviews = ref<{ avgRating: number | null; records: any[] }>({ avgRating: null, records: [] })

onMounted(async () => {
  try {
    const res: any = await getHouseById(houseId)
    house.value = res.data
  } catch {
    // 拦截器已提示
  }
  loadReviews()
})

async function loadReviews() {
  try {
    // 评论列表是公开接口
    const res: any = await request.get(`/user/review/house/${houseId}`)
    const data = res.data || { records: [], avgRating: null }
    reviews.value = {
      avgRating: data.records?.[0]?.avgRating ?? null,
      records: data.records || [],
    }
  } catch {
    /* 忽略评论加载失败 */
  }
}

function goBack() {
  // 有历史记录则返回，否则回我的房源列表（避免直接打开详情无返回）
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/landlord/house/list')
  }
}

function goEdit() {
  router.push(`/landlord/house/edit/${houseId}`)
}

async function toggleStatus() {
  try {
    const newStatus = house.value!.status === 1 ? 0 : 1
    await updateHouseStatus(houseId, newStatus)
    house.value!.status = newStatus
    ElMessage.success(newStatus === 1 ? '已上架' : '已下架')
  } catch {
    // 拦截器已提示
  }
}

async function removeHouse() {
  try {
    await deleteHouse(houseId)
    ElMessage.success('删除成功')
    router.push('/landlord/house/list')
  } catch {
    // 拦截器已提示
  }
}
</script>

<style scoped>
.detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.detail-header h1 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  flex: 1;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.carousel {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  height: 300px;
  background: #e8eaed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  border-radius: 12px;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-top: 16px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.price {
  font-size: 30px;
  font-weight: 700;
  color: #e74c3c;
}

.deposit {
  color: #909399;
  font-size: 13px;
}

.status-tag {
  margin-left: auto;
}

.title {
  font-size: 20px;
  margin: 12px 0 8px;
  color: #303133;
}

.location {
  color: #909399;
  font-size: 14px;
}

.tags {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 16px;
  margin: 0 0 16px;
  color: #303133;
}

.avg-rating {
  color: #e6a23c;
  font-size: 14px;
  margin-left: 8px;
}

.description {
  color: #606266;
  line-height: 1.8;
  margin: 0;
}

.landlord-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.landlord-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1a56db;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.landlord-name {
  font-size: 15px;
  color: #303133;
}

.review-item {
  border-bottom: 1px solid #f0f2f5;
  padding: 12px 0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-name {
  font-weight: 600;
}

.review-content {
  margin: 8px 0;
  color: #606266;
}

.comment-list {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 10px 14px;
}

.comment-item {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.comment-name {
  color: #1a56db;
}
</style>
