<template>
  <div class="detail-page" v-if="order">
    <!-- 订单信息 -->
    <el-card shadow="never" class="section">
      <template #header>
        <div class="card-header">
          <span>{{ order.houseTitle || '房源' }}</span>
          <el-tag :type="statusType(order.status)">{{ statusText(order.status) }}</el-tag>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="起租日">{{ order.startDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="月租">{{ money(order.monthlyRent) }}元</el-descriptions-item>
        <el-descriptions-item label="押金">{{ money(order.deposit) }}元</el-descriptions-item>
        <el-descriptions-item label="下期待缴">{{ order.nextDuePeriod || '—' }}</el-descriptions-item>
        <el-descriptions-item label="已缴月数">{{ order.paidMonths }}个月</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 租客信息（可直接发起会话联系租客） -->
    <el-card v-if="order.tenantId" shadow="never" class="section">
      <template #header><span>租客信息</span></template>
      <div class="tenant-row">
        <div class="tenant-main">
          <div class="tenant-name">{{ order.tenantName || '租客' }}</div>
          <div class="tenant-sub">入住、维修、退租等事宜可直接与租客沟通</div>
        </div>
        <el-button type="primary" @click="goChat">联系租客</el-button>
      </div>
    </el-card>

    <!-- 退租信息 -->
    <el-card v-if="order.termination" shadow="never" class="section">
      <template #header><span>退租信息</span></template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="生效租期至">{{ order.termination.effectiveEndPeriod }}</el-descriptions-item>
        <el-descriptions-item label="押金状态">
          <el-tag :type="order.termination.refundStatus === 1 ? 'success' : 'warning'">
            {{ order.termination.refundStatus === 1 ? '已退回' : '待退回' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="退回时间">{{ order.termination.refundTime ? formatTime(order.termination.refundTime) : '—' }}</el-descriptions-item>
        <el-descriptions-item label="扣除押金">
          <span class="deduct">{{ money(order.termination.deductAmount) }}元</span>
        </el-descriptions-item>
        <el-descriptions-item label="押金退回">{{ money(order.termination.refundAmount) }}元</el-descriptions-item>
        <el-descriptions-item label="预付租金退回">
          {{ money(order.termination.prepaidRefundAmount) }}元
          <span v-if="order.termination.prepaidMonths > 0" class="form-tip">（未住 {{ order.termination.prepaidMonths }} 个月）</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ order.termination.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 收款记录 -->
    <el-card shadow="never" class="section">
      <template #header><span>收款记录（押金 + 各期租金）</span></template>
      <el-table :data="order.payments || []" stripe>
        <el-table-column label="类型" min-width="120">
          <template #default="{ row }">{{ row.payType === 'DEPOSIT' ? '押金' : `租金 ${row.period || ''}` }}</template>
        </el-table-column>
        <el-table-column label="金额" min-width="110">
          <template #default="{ row }">{{ money(row.amount) }}元</template>
        </el-table-column>
        <el-table-column label="业务号" prop="bizNo" min-width="220" show-overflow-tooltip />
        <el-table-column label="时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 该房源的评价（房东可直接回复/参与讨论） -->
    <el-card v-if="reviews.records.length" shadow="never" class="section">
      <template #header><span>房源评价与讨论</span></template>
      <div v-for="r in reviews.records" :key="r.id" class="review-item">
        <div class="review-header">
          <span class="review-name">{{ r.tenantName }}</span>
          <el-rate v-if="r.rating" :model-value="r.rating" disabled size="small" />
          <el-tag v-else size="small" type="info">评论</el-tag>
          <span class="review-time">{{ formatTime(r.createTime) }}</span>
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
        <el-button link type="primary" size="small" @click="reply(r, null)">回复 / 参与讨论</el-button>
      </div>
    </el-card>

    <!-- 操作：退租结算 -->
    <el-card v-if="order.status === 3" shadow="never" class="section">
      <template #header><span>退租结算</span></template>
      <el-form label-width="120px" class="settle-form">
        <el-form-item label="扣除押金">
          <el-input-number
            v-model="deductAmount"
            :min="0"
            :max="Number(order.deposit)"
            :precision="2"
            :step="100"
            style="width: 200px"
          />
          <span class="form-tip">租客损坏物品时从押金中扣除，扣除部分归您所有（结算后即可提现）</span>
        </el-form-item>
        <el-form-item label="扣款原因">
          <el-input
            v-model="deductRemark"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            placeholder="例如：墙面破损修缮费 500 元（选填）"
            :disabled="deductAmount <= 0"
            style="max-width: 520px"
          />
        </el-form-item>
        <el-form-item label="结算预览">
          <span class="preview">
            押金 {{ money(order.deposit) }}元 − 扣除 <b>{{ money(deductAmount) }}</b>元<span v-if="prepaidRefund > 0">
              ＋ 预付租金退回 <b>{{ money(prepaidRefund) }}</b>元</span> =
            退回租客 <b class="refund">{{ money(refundPreview) }}</b>元
          </span>
        </el-form-item>
        <el-form-item>
          <el-button type="warning" :loading="submitting" @click="refund">
            确认退租并退回押金与预付租金
          </el-button>
          <span class="form-tip">提交退租申请满 7 天冷却期后方可结算；超期未结算系统将自动全额退回</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRentDetail, refundDeposit, type RentOrder } from '@/api/rent'
import { createConversation } from '@/api/chat'
import request from '@/api/request'

const route = useRoute()
const router = useRouter()
const order = ref<RentOrder | null>(null)

/** 该房源的评价列表（房东可回复） */
const reviews = ref<{ records: any[] }>({ records: [] })

/** 退租结算：从押金中扣除的金额（归房东），默认 0 = 全额退回租客 */
const deductAmount = ref(0)
/** 退租结算：扣款原因 */
const deductRemark = ref('')
const submitting = ref(false)

/** 未住租期的预付租金退回（申请退租时后端已算好并冻结，见 RentTerminationVO.prepaidRefundAmount） */
const prepaidRefund = computed(() => Number(order.value?.termination?.prepaidRefundAmount || 0))

/** 结算预览：退回租客金额 = 押金 − 扣除 + 预付租金退回
 * （漏掉最后一项会让房东看到的金额小于租客实际到账额） */
const refundPreview = computed(() => {
  const deposit = Number(order.value?.deposit || 0)
  const deduct = Number(deductAmount.value || 0)
  return Math.max(deposit - deduct, 0) + prepaidRefund.value
})

const STATUS_TEXT: Record<number, string> = { 1: '待缴押金', 2: '租房中', 3: '退租申请中', 4: '已退租', 5: '已取消' }

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const res: any = await getRentDetail(id)
    const detail = res.data as RentOrder
    order.value = detail
    if (detail?.houseId) {
      loadReviews(detail.houseId)
    }
  } catch {
    /* 拦截器已提示 */
  }
})

/** 读取该房源的评价（走房东端通道，才能拿到房东本人的 liked / mine 状态） */
async function loadReviews(houseId: number) {
  try {
    const res: any = await request.get(`/admin/review/house/${houseId}`, {
      params: { page: 1, pageSize: 50 },
    })
    reviews.value = { records: res.data?.records || [] }
  } catch {
    /* 忽略评价加载失败 */
  }
}

/** 联系租客：找/建与租客的会话 → 跳聊天页并自动打开该会话 */
async function goChat() {
  if (!order.value?.tenantId) {
    ElMessage.warning('无法获取租客信息')
    return
  }
  try {
    const res: any = await createConversation(order.value.tenantId)
    const conversationId = res.data
    router.push({ path: '/landlord/chat', query: { conversationId: String(conversationId) } })
  } catch {
    /* 拦截器已提示 */
  }
}

/** 点赞 / 取消赞：顶楼评价 */
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
    if (order.value?.houseId) {
      loadReviews(order.value.houseId)
    }
  } catch {
    /* 拦截器已提示 */
  }
}

/** 房东回复：comment 为 null 表示回复整条评价，否则挂在该条回复下 */
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
    if (order.value?.houseId) {
      loadReviews(order.value.houseId)
    }
  } catch (e: any) {
    if (e === 'cancel' || e === 'close') return
    /* 其余错误拦截器已提示 */
  }
}

function refund() {
  if (!order.value) return
  const deposit = Number(order.value.deposit || 0)
  const deduct = Number(deductAmount.value || 0)
  if (deduct < 0 || deduct > deposit) {
    ElMessage.warning('扣除金额不能为负数，也不能超过押金总额')
    return
  }
  // 合计退回 = 押金扣除后的余额 + 未住租期的预付租金退回（后者在申请退租时已冻结）
  const refundAmount = Math.max(deposit - deduct, 0) + prepaidRefund.value
  const prepaidTip = prepaidRefund.value > 0
    ? `（含未住租期的预付租金 ${money(prepaidRefund.value)} 元）`
    : ''
  const tip = deduct > 0
    ? `确认从押金中扣除 ${money(deduct)} 元归您所有？本次共退回租客 ${money(refundAmount)} 元${prepaidTip}。`
    : `确认退回租客 ${money(refundAmount)} 元${prepaidTip}？`
  ElMessageBox.confirm(tip, '退租结算', {
    confirmButtonText: '确认结算',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    submitting.value = true
    try {
      await refundDeposit(order.value!.id, {
        deductAmount: deduct,
        remark: deductRemark.value?.trim() || undefined,
      })
      ElMessage.success('押金已结算')
      const res: any = await getRentDetail(order.value!.id)
      order.value = res.data
    } catch {
      /* 拦截器已提示 */
    } finally {
      submitting.value = false
    }
  }).catch(() => {})
}

function statusText(s: number) {
  return STATUS_TEXT[s] || '未知'
}
function statusType(s: number) {
  return { 1: 'warning', 2: 'primary', 3: 'info', 4: 'success', 5: 'info' }[s] || 'info'
}
function formatTime(t: string) {
  return t ? t.replace('T', ' ').slice(0, 16) : ''
}
function money(n: number | string | null | undefined) {
  const v = Number(n || 0)
  return v % 1 === 0 ? String(v) : v.toFixed(2)
}
</script>

<style scoped>
.detail-page {
  padding: 24px;
  background: #f5f7fa;
  /* 必须用 height 而非 min-height：父级 .nav-main 是定高 + overflow:hidden 的 flex 项，
     用 min-height 本页会随内容撑高并被父级裁掉，自身 overflow-y 失效 ⇒ 滚轮滚不到底部 */
  height: 100%;
  box-sizing: border-box;
  max-width: 960px;
  margin: 0 auto;
  overflow-y: auto;
}

.section {
  border-radius: 12px;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.settle-form {
  max-width: 760px;
}

/* ===== 租客信息 / 联系租客 ===== */
.tenant-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.tenant-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.tenant-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.form-tip {
  margin-left: 12px;
  font-size: 13px;
  color: #909399;
}

.preview {
  font-size: 14px;
  color: #303133;
}

.preview .refund {
  color: #e6a23c;
}

.deduct {
  color: #f56c6c;
  font-weight: 600;
}

/* ===== 评价与讨论 ===== */
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

.review-time,
.review-like {
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

.like-btn:hover,
.like-btn.liked {
  color: #e74c3c;
}

.comment-ops {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
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

.comment-like {
  font-size: 12px;
  color: #c0c4cc;
  padding-left: 10px;
}

.comment-reply-btn {
  margin-left: 10px;
}
</style>
