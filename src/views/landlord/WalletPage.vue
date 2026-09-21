<template>
  <div class="wallet-page">
    <!-- 余额卡 -->
    <div class="balance-card">
      <div class="balance-label">钱包余额（元）</div>
      <div class="balance-num">{{ money(balance) }}</div>
      <div class="balance-tip">租客缴纳的押金与房租会自动到账（在租押金与预付租金需退租结算后方可提现）</div>
      <div class="balance-split">
        <span class="split-item">
          在租押金与预付租金（不可提现）<b class="locked">{{ money(lockedAmount) }}</b>
        </span>
        <span class="split-item">
          可提现余额<b class="available">{{ money(availableBalance) }}</b>
        </span>
      </div>
      <el-button type="primary" size="large" @click="openWithdraw">提现到微信零钱</el-button>
    </div>

    <!-- 收款流水 -->
    <el-card shadow="never" class="txn-card">
      <template #header>
        <div class="card-header">收款流水</div>
      </template>
      <el-table :data="txns" stripe>
        <el-table-column label="类型" min-width="120">
          <template #default="{ row }">{{ bizTypeText(row.bizType) }}</template>
        </el-table-column>
        <el-table-column label="金额" min-width="120">
          <template #default="{ row }">
            <span :class="row.direction === 1 ? 'in' : 'out'">
              {{ row.direction === 1 ? '+' : '-' }}{{ money(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="余额" prop="balanceAfter" min-width="110">
          <template #default="{ row }">{{ money(row.balanceAfter) }}</template>
        </el-table-column>
        <el-table-column label="状态" min-width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="total > pageSize"
        class="pager"
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPage"
      />
    </el-card>

    <!-- 提现弹窗 -->
    <el-dialog v-model="withdrawVisible" title="提现到微信零钱" width="380px">
      <el-input v-model="withdrawAmount" type="number" placeholder="请输入提现金额" />
      <div class="dialog-tip">可提现余额 {{ money(availableBalance) }} 元（余额 {{ money(balance) }} 元中，{{ money(lockedAmount) }} 元为在租押金与预付租金，退租结算后方可提现）</div>
      <div class="dialog-tip">当前为预留接口：扣除余额、状态=处理中，未对接实际到账</div>
      <template #footer>
        <el-button @click="withdrawVisible = false">取消</el-button>
        <el-button type="primary" @click="doWithdraw">确认提现</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getWallet, getWalletTransactions, withdrawWallet, genIdempotencyKey, type WalletTransaction } from '@/api/wallet'

const balance = ref(0)
/** 锁定金额 = 在租订单押金 + 未消耗的预付租金：房东可见但不可提现 */
const lockedAmount = ref(0)
/** 可提现余额 = balance − lockedAmount */
const availableBalance = ref(0)
const txns = ref<WalletTransaction[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const withdrawVisible = ref(false)
const withdrawAmount = ref('')
/** 幂等键：打开弹窗时生成一次，弹窗内重复提交命中同一键 ⇒ 后端只扣一次款 */
const withdrawIdemKey = ref('')

const BIZ_TEXT: Record<string, string> = {
  RECHARGE: '充值', WITHDRAW: '提现',
  DEPOSIT_PAY: '租客缴纳押金', DEPOSIT_INCOME: '收取押金', DEPOSIT_REFUND: '退回押金',
  RENT_PAY: '租客缴纳房租', RENT_INCOME: '收取房租',
}

onMounted(async () => {
  await loadWallet()
  await loadTxns()
})

async function loadWallet() {
  try {
    const res: any = await getWallet()
    balance.value = Number(res.data?.balance || 0)
    const locked = Number(res.data?.lockedAmount || 0)
    lockedAmount.value = locked
    // 后端已算好可提现余额；兼容老接口（无该字段）时用余额−锁定兜底
    const available = res.data?.availableBalance
    availableBalance.value = available == null
      ? Math.max(balance.value - locked, 0)
      : Number(available)
  } catch {
    /* 拦截器已提示 */
  }
}

async function loadTxns() {
  try {
    const res: any = await getWalletTransactions({ page: page.value, pageSize: pageSize.value })
    txns.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {
    /* 拦截器已提示 */
  }
}

function onPage(p: number) {
  page.value = p
  loadTxns()
}

function openWithdraw() {
  withdrawAmount.value = ''
  // 每次打开弹窗都换新键：同一次"提现意图"内重试会被幂等拦下，关掉重开则是新的合法提现
  withdrawIdemKey.value = genIdempotencyKey()
  withdrawVisible.value = true
}

async function doWithdraw() {
  const amount = Number(withdrawAmount.value)
  if (!amount || amount <= 0) {
    ElMessage.warning('请输入正确的提现金额')
    return
  }
  // 只能提「可提现余额」：在租订单的押金要等退租结算后才可用
  if (amount > Number(availableBalance.value)) {
    ElMessage.warning(
      lockedAmount.value > 0
        ? `提现金额不能超过可提现余额（${money(availableBalance.value)} 元，另有 ${money(lockedAmount.value)} 元为在租押金与预付租金不可提现）`
        : '提现金额不能超过余额',
    )
    return
  }
  try {
    const res: any = await withdrawWallet(amount, withdrawIdemKey.value)
    balance.value = Number(res.data?.balance || 0)
    if (res.data?.availableBalance != null) {
      availableBalance.value = Number(res.data.availableBalance)
    }
    if (res.data?.lockedAmount != null) {
      lockedAmount.value = Number(res.data.lockedAmount)
    }
    withdrawVisible.value = false
    ElMessage.success('提现申请已提交')
    loadTxns()
  } catch {
    /* 拦截器已提示 */
  }
}

function bizTypeText(t: string) {
  return BIZ_TEXT[t] || t
}
function statusText(s: number) {
  return { 1: '成功', 0: '处理中', 2: '失败' }[s] || '未知'
}
function statusType(s: number) {
  return s === 1 ? 'success' : s === 0 ? 'warning' : 'danger'
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
.wallet-page {
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

.balance-card {
  background: linear-gradient(135deg, #1a56db, #667eea);
  border-radius: 16px;
  padding: 32px;
  color: #fff;
  margin-bottom: 20px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.85;
}

.balance-num {
  font-size: 52px;
  font-weight: 700;
  margin: 10px 0 6px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.balance-tip {
  font-size: 13px;
  opacity: 0.8;
  margin-bottom: 16px;
}

.balance-split {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  font-size: 13px;
  opacity: 0.95;
}

.split-item {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.split-item .locked {
  font-size: 18px;
  color: #ffe08a;
}

.split-item .available {
  font-size: 18px;
  color: #b7f7c2;
}

.txn-card {
  border-radius: 12px;
}

.card-header {
  font-weight: 600;
  color: #303133;
}

.in {
  color: #67c23a;
  font-weight: 600;
}

.out {
  color: #303133;
}

.pager {
  margin-top: 16px;
  justify-content: flex-end;
}

.dialog-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}
</style>
