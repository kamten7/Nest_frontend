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

    <!-- 操作 -->
    <div class="ops" v-if="order.status === 3">
      <el-button type="warning" @click="refund">退回押金 {{ money(order.deposit) }}元</el-button>
      <span class="ops-tip">仅当已购租期结束后可退回</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRentDetail, refundDeposit, type RentOrder } from '@/api/rent'

const route = useRoute()
const router = useRouter()
const order = ref<RentOrder | null>(null)

const STATUS_TEXT: Record<number, string> = { 1: '待缴押金', 2: '租房中', 3: '退租申请中', 4: '已退租', 5: '已取消' }

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const res: any = await getRentDetail(id)
    order.value = res.data
  } catch {
    /* 拦截器已提示 */
  }
})

function refund() {
  if (!order.value) return
  ElMessageBox.confirm(`确认将押金 ${money(order.value.deposit)} 元退回租客钱包？`, '退回押金', {
    confirmButtonText: '确认退回',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await refundDeposit(order.value!.id)
      ElMessage.success('押金已退回')
      const res: any = await getRentDetail(order.value!.id)
      order.value = res.data
    } catch {
      /* 拦截器已提示 */
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
  min-height: 100%;
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

.ops {
  margin-top: 8px;
}

.ops-tip {
  margin-left: 12px;
  font-size: 13px;
  color: #909399;
}
</style>
