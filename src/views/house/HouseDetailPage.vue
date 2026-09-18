<template>
  <div class="detail-page" v-if="house">
    <!-- 顶部操作栏 -->
    <header class="detail-header">
      <el-button text @click="goBack">← 返回</el-button>
      <h1>房源详情</h1>
      <div class="header-actions">
        <el-button size="small" type="primary" @click="goEdit">编辑</el-button>
        <!-- 在租中禁止手动改状态，只允许 1↔0 切换 -->
        <el-button
          v-if="house.status !== 2"
          size="small"
          :type="house.status === 1 ? 'warning' : 'success'"
          @click="toggleStatus"
        >
          {{ house.status === 1 ? '下架' : '重新发布' }}
        </el-button>
        <el-button v-else size="small" type="info" disabled>在租中</el-button>
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
          <el-tag :type="statusTagType(house.status)" class="status-tag">
            {{ statusText(house.status) }}
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

      <!-- 住客评价 / 房源讨论 -->
      <section class="section">
        <h3 class="section-title">
          住客评价
          <span v-if="reviews.ratedCount" class="avg-rating">⭐ {{ reviews.avgRating }}</span>
          <span v-if="reviews.ratedCount" class="review-count">{{ reviews.ratedCount }} 人评分</span>
          <span class="review-count">共 {{ reviews.totalCount }} 条</span>
        </h3>
        <el-empty v-if="!reviews.records.length" description="暂无评价" :image-size="60" />
        <div v-for="r in reviews.records" :key="r.id" class="review-item">
          <div class="review-header">
            <span class="review-name">{{ r.tenantName }}</span>
            <el-rate v-if="r.rating" :model-value="r.rating" disabled size="small" />
            <el-tag v-else size="small" type="info">评论</el-tag>
            <span class="review-time">{{ (r.createTime || '').replace('T', ' ').slice(0, 16) }}</span>
            <span
              class="like-btn"
              :class="{ liked: r.liked }"
              title="点赞 / 取消赞"
              @click="toggleLikeReview(r)"
            >♥ {{ r.likeCount || 0 }}</span>
          </div>
          <p class="review-content">{{ r.content }}</p>
          <div v-if="r.comments && r.comments.length" class="comment-list">
            <div v-for="c in r.comments" :key="c.id" class="comment-item">
              <span class="comment-name">{{ c.userName }}</span>
              <span v-if="c.parentUserName" class="comment-reply-to">回复 {{ c.parentUserName }}</span>
              <span>：{{ c.content }}</span>
              <span class="comment-ops">
                <span
                  class="like-btn"
                  :class="{ liked: c.liked }"
                  title="点赞 / 取消赞"
                  @click="toggleLikeComment(c)"
                >♥ {{ c.likeCount || 0 }}</span>
                <el-button link size="small" @click="reply(r, c)">回复</el-button>
                <el-button v-if="c.mine" link type="danger" size="small" @click="removeComment(c)">删除</el-button>
              </span>
            </div>
          </div>
          <div class="reply-row">
            <el-button link type="primary" size="small" @click="reply(r, null)">
              {{ r.comments && r.comments.length ? '参与讨论' : '回复 / 提问' }}
            </el-button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getHouseById, updateHouseStatus, deleteHouse, type HouseVO } from '@/api/house'
import request from '@/api/request'

const route = useRoute()
const router = useRouter()
const houseId = Number(route.params.id)
const house = ref<HouseVO | null>(null)
const reviews = ref<{
  avgRating: number | null
  ratedCount: number
  totalCount: number
  records: any[]
}>({ avgRating: null, ratedCount: 0, totalCount: 0, records: [] })

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
    // 走房东端通道（/admin/review/house/**）而不是公开的 /user/review/house/**：
    // 后者在租客拦截器的可选认证下会被当成匿名，回不了房东本人的 liked / mine 状态
    const res: any = await request.get(`/admin/review/house/${houseId}`, {
      params: { page: 1, pageSize: 50 },
    })
    const data = res.data || { records: [] }
    const records: any[] = data.records || []
    reviews.value = {
      avgRating: records[0]?.avgRating ?? null,
      ratedCount: records[0]?.ratedCount ?? 0,
      totalCount: records[0]?.totalCount ?? 0,
      records,
    }
  } catch {
    /* 忽略评论加载失败 */
  }
}

/** 点赞 / 取消赞：顶楼评价（房东也可点赞） */
async function toggleLikeReview(review: any) {
  try {
    const liked = !review.liked
    await request.post(`/admin/review/${review.id}/like`, { liked })
    review.liked = liked
    review.likeCount = Math.max(0, (review.likeCount || 0) + (liked ? 1 : -1))
  } catch {
    /* 拦截器已提示 */
  }
}

/** 点赞 / 取消赞：楼中回复 */
async function toggleLikeComment(comment: any) {
  try {
    const liked = !comment.liked
    await request.post(`/admin/review/comment/${comment.id}/like`, { liked })
    comment.liked = liked
    comment.likeCount = Math.max(0, (comment.likeCount || 0) + (liked ? 1 : -1))
  } catch {
    /* 拦截器已提示 */
  }
}

/** 删除自己发的回复 */
async function removeComment(comment: any) {
  try {
    await ElMessageBox.confirm('删除后无法恢复（它下面的追问也会一并删除），确定删除？', '删除回复', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return // 用户取消
  }
  try {
    await request.delete(`/admin/review/comment/${comment.id}`)
    ElMessage.success('已删除')
    loadReviews()
  } catch {
    /* 拦截器已提示 */
  }
}

/**
 * 房东回复：comment 为 null 表示回复整条评价，否则挂在该条回复下（房东也能在别人评论里追问）。
 */
async function reply(review: any, comment: any) {
  const title = comment ? `回复 ${comment.userName}` : `回复 ${review.tenantName} 的评价`
  try {
    const { value } = await ElMessageBox.prompt('输入你的回复内容', title, {
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '例如：感谢入住，有任何问题随时联系我～',
      inputValidator: (v: string) => (v && v.trim() ? true : '回复内容不能为空'),
    })
    await request.post(`/admin/review/${review.id}/comment`, {
      content: value.trim(),
      parentId: comment ? comment.id : null,
    })
    ElMessage.success('回复成功')
    loadReviews()
  } catch (e: any) {
    // ElMessageBox 取消会 reject 'cancel'/'close'，不是错误
    if (e === 'cancel' || e === 'close') return
    /* 其余错误拦截器已提示 */
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

// 房源状态：0下架(需重新发布) / 1上架 / 2在租中
function statusText(status: number) {
  return status === 1 ? '上架中' : status === 2 ? '在租中' : '已下架'
}
function statusTagType(status: number): 'success' | 'warning' | 'info' {
  return status === 1 ? 'success' : status === 2 ? 'warning' : 'info'
}

async function toggleStatus() {
  // 仅允许 1↔0 切换；2(在租中) 由按钮 v-if 拦截
  const newStatus = house.value!.status === 1 ? 0 : 1
  try {
    await updateHouseStatus(houseId, newStatus)
    house.value!.status = newStatus
    ElMessage.success(newStatus === 1 ? '已重新发布' : '已下架')
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

.review-count {
  font-size: 13px;
  font-weight: 400;
  color: #909399;
  margin-left: 8px;
}

.review-time {
  font-size: 12px;
  color: #c0c4cc;
}

.like-btn {
  font-size: 12px;
  color: #c0c4cc;
  cursor: pointer;
  user-select: none;
  padding-left: 10px;
}

.like-btn:hover {
  color: #e74c3c;
}

.like-btn.liked {
  color: #e74c3c;
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

.comment-reply-to {
  font-size: 12px;
  color: #909399;
  padding: 0 4px;
}

.comment-ops {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.reply-row {
  margin-top: 8px;
}
</style>
