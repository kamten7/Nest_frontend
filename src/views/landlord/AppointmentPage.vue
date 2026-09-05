<template>
  <div class="appointment-page">
    <!-- 状态筛选 Tabs -->
    <el-tabs v-model="activeTab" class="appointment-tabs" @tab-change="loadList">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待确认" name="1" />
      <el-tab-pane label="已确认" name="2" />
      <el-tab-pane label="已看房" name="3" />
      <el-tab-pane label="已取消" name="4" />
      <el-tab-pane label="已成交" name="5" />
    </el-tabs>

    <!-- 预约表格 -->
    <el-table :data="records" v-loading="loading" empty-text="暂无预约">
      <el-table-column prop="tenantName" label="租客" width="110">
        <template #default="{ row }">
          <span class="tenant-cell">👤 {{ row.tenantName }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="houseTitle" label="房源" min-width="160">
        <template #default="{ row }">
          <div class="house-cell">
            <img v-if="row.houseCover" :src="row.houseCover" class="house-thumb" />
            <span class="house-title">{{ row.houseTitle }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="appointmentTime" label="看房时间" width="170">
        <template #default="{ row }">{{ formatTime(row.appointmentTime) }}</template>
      </el-table-column>
      <el-table-column prop="contactPhone" label="联系电话" width="130" />
      <el-table-column prop="statusText" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 1" size="small" type="primary" @click="handleConfirm(row)">
            确认
          </el-button>
          <el-button v-if="row.status === 2" size="small" type="success" @click="handleComplete(row)">
            完成看房
          </el-button>
          <el-button
            v-if="row.status === 1 || row.status === 2"
            size="small"
            type="danger"
            plain
            @click="handleCancel(row)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="loadList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listAppointments,
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  type Appointment,
} from '@/api/appointment'

const activeTab = ref('all')
const records = ref<Appointment[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)

/** 状态 → Tag 颜色 */
function statusTagType(status: number) {
  switch (status) {
    case 1: return 'warning'   // 待确认
    case 2: return 'primary'   // 已确认
    case 3: return 'success'   // 已看房
    case 4: return 'info'      // 已取消
    case 5: return 'success'   // 已成交
    default: return 'info'
  }
}

function formatTime(t: string | null) {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 16)
}

async function loadList() {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? undefined : Number(activeTab.value)
    const res: any = await listAppointments(status, page.value, pageSize)
    records.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

async function handleConfirm(row: Appointment) {
  try {
    await confirmAppointment(row.id)
    ElMessage.success(`已确认 ${row.tenantName} 的预约`)
    loadList()
  } catch { /* 拦截器已提示 */ }
}

async function handleComplete(row: Appointment) {
  try {
    await completeAppointment(row.id)
    ElMessage.success('已标记看房完成')
    loadList()
  } catch { /* 拦截器已提示 */ }
}

async function handleCancel(row: Appointment) {
  try {
    const { value } = await ElMessageBox.prompt(
      `确认取消 ${row.tenantName} 的预约吗？可填取消原因`,
      '取消预约',
      { confirmButtonText: '确认取消', cancelButtonText: '再想想', inputPlaceholder: '取消原因（可选）' }
    )
    await cancelAppointment(row.id, value || undefined)
    ElMessage.success('已取消预约')
    loadList()
  } catch {
    // 用户点了"再想想"或取消，静默
  }
}

onMounted(loadList)
</script>

<style scoped>
.appointment-page {
  height: 100%;
  padding: 16px 24px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.appointment-tabs {
  background: #fff;
  padding: 0 16px;
  border-radius: 8px 8px 0 0;
}

.el-table {
  background: #fff;
  border-radius: 0 0 8px 8px;
  flex: 1;
}

.tenant-cell {
  font-size: 13px;
}

.house-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.house-thumb {
  width: 40px;
  height: 30px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.house-title {
  font-size: 13px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-bar {
  padding: 12px 0;
  display: flex;
  justify-content: flex-end;
}
</style>
