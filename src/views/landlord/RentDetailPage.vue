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
        <el-descriptions-item label="扣除押金">
          <span class="deduct">{{ money(order.termination.deductAmount) }}元</span>
        </el-descriptions-item>
        <el-descriptions-item label="退回租客">{{ money(order.termination.refundAmount) }}元</el-descriptions-item>
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
            押金 {{ money(order.deposit) }}元 − 扣除 <b>{{ money(deductAmount) }}</b>元 =
            退回租客 <b class="refund">{{ money(refundPreview) }}</b>元
          </span>
        </el-form-item>
        <el-form-item>
          <el-button type="warning" :loading="submitting" @click="refund">
            确认退租并退回押金
          </el-button>
          <span class="form-tip">仅当已购租期结束后可结算；超 7 天未结算系统将自动全额退回</span>
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

const route = useRoute()
const router = useRouter()
const order = ref<RentOrder | null>(null)

/** 退租结算：从押金中扣除的金额（归房东），默认 0 = 全额退回租客 */
const deductAmount = ref(0)
/** 退租结算：扣款原因 */
const deductRemark = ref('')
const submitting = ref(false)

/** 结算预览：退回租客金额 = 押金 − 扣除 */
const refundPreview = computed(() => {
  const deposit = Number(order.value?.deposit || 0)
  const deduct = Number(deductAmount.value || 0)
  return Math.max(deposit - deduct, 0)
})

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
  const deposit = Number(order.value.deposit || 0)
  const deduct = Number(deductAmount.value || 0)
  if (deduct < 0 || deduct > deposit) {
    ElMessage.warning('扣除金额不能为负数，也不能超过押金总额')
    return
  }
  const refundAmount = deposit - deduct
  const tip = deduct > 0
    ? `确认从押金中扣除 ${money(deduct)} 元归您所有，并退回租客 ${money(refundAmount)} 元？`
    : `确认将押金 ${money(deposit)} 元全额退回租客钱包？`
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

.settle-form {
  max-width: 760px;
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
</style>
