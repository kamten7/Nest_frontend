<template>
  <div class="rent-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>名下租房订单</span>
          <el-radio-group v-model="status" size="small" @change="reload">
            <el-radio-button :value="0">全部</el-radio-button>
            <el-radio-button :value="1">待缴押金</el-radio-button>
            <el-radio-button :value="2">租房中</el-radio-button>
            <el-radio-button :value="3">退租申请中</el-radio-button>
            <el-radio-button :value="4">已退租</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="orders" stripe>
        <el-table-column label="房源" min-width="180">
          <template #default="{ row }">
            <div class="house-cell">
              <img v-if="row.houseCover" :src="row.houseCover" class="house-cover" />
              <div>{{ row.houseTitle || '房源' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单号" prop="orderNo" min-width="200" show-overflow-tooltip />
        <el-table-column label="月租" min-width="100">
          <template #default="{ row }">{{ money(row.monthlyRent) }}元</template>
        </el-table-column>
        <el-table-column label="押金" min-width="100">
          <template #default="{ row }">{{ money(row.deposit) }}元</template>
        </el-table-column>
        <el-table-column label="状态" min-width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下期待缴" min-width="110">
          <template #default="{ row }">{{ row.nextDuePeriod || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">查看</el-button>
            <el-button v-if="row.status === 3" link type="warning" @click="refund(row)">退押金</el-button>
          </template>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listRentOrders, refundDeposit, type RentOrder } from '@/api/rent'

const router = useRouter()
const orders = ref<RentOrder[]>([])
const status = ref(0)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const STATUS_TEXT: Record<number, string> = { 1: '待缴押金', 2: '租房中', 3: '退租申请中', 4: '已退租', 5: '已取消' }

onMounted(load)

async function load() {
  try {
    const params: Record<string, any> = { page: page.value, pageSize: pageSize.value }
    if (status.value !== 0) params.status = status.value
    const res: any = await listRentOrders(params)
    orders.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {
    /* 拦截器已提示 */
  }
}

function reload() {
  page.value = 1
  load()
}

function onPage(p: number) {
  page.value = p
  load()
}

function goDetail(row: RentOrder) {
  router.push(`/landlord/rent/detail/${row.id}`)
}

function refund(row: RentOrder) {
  ElMessageBox.confirm(`确认将该订单押金 ${money(row.deposit)} 元退回租客钱包？`, '退回押金', {
    confirmButtonText: '确认退回',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await refundDeposit(row.id)
      ElMessage.success('押金已退回')
      load()
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
function money(n: number | string | null | undefined) {
  const v = Number(n || 0)
  return v % 1 === 0 ? String(v) : v.toFixed(2)
}
</script>

<style scoped>
.rent-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100%;
  box-sizing: border-box;
  max-width: 1100px;
  margin: 0 auto;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.house-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.house-cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: #f0f2f5;
  flex-shrink: 0;
}

.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
