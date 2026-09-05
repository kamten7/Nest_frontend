<template>
  <div class="profile-page">
    <!-- 房东信息卡 -->
    <div class="profile-card">
      <div class="avatar">{{ (info.name || '🏠').charAt(0) }}</div>
      <div class="info">
        <div class="name">{{ info.name || '房东' }}</div>
        <div class="phone">📱 {{ info.phone || '—' }}</div>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.houseCount }}</div>
        <div class="stat-label">我的房源</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.pendingAppointments }}</div>
        <div class="stat-label">待确认预约</div>
      </div>
    </div>

    <!-- 详细信息 -->
    <div class="detail-card">
      <div class="detail-title">账户信息</div>
      <div class="detail-row">
        <span class="label">房东姓名</span>
        <span class="value">{{ info.name || '—' }}</span>
      </div>
      <div class="detail-row">
        <span class="label">手机号</span>
        <span class="value">{{ info.phone || '—' }}</span>
      </div>
      <div class="detail-row" v-if="info.idNumber">
        <span class="label">身份证号</span>
        <span class="value">{{ maskIdNumber(info.idNumber) }}</span>
      </div>
      <div class="detail-row">
        <span class="label">账户状态</span>
        <span class="value">
          <el-tag :type="info.status === 1 ? 'success' : 'danger'">
            {{ info.status === 1 ? '正常' : '已禁用' }}
          </el-tag>
        </span>
      </div>
    </div>

    <el-button type="danger" plain class="logout-btn" @click="logout">退出登录</el-button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLandlordMe, getMyHouses, type LandlordInfo } from '@/api/house'
import { listAppointments } from '@/api/appointment'

const router = useRouter()
const info = ref<LandlordInfo>({ id: 0, name: '', phone: '', avatar: null, idNumber: null, status: 1 })
const stats = ref({ houseCount: 0, pendingAppointments: 0 })

onMounted(async () => {
  try {
    const res: any = await getLandlordMe()
    info.value = res.data || info.value
  } catch {
    // 拦截器已提示
  }
  // 统计：我的房源数 + 待确认预约数
  try {
    const houses: any = await getMyHouses(1, 1)
    stats.value.houseCount = houses.data?.total || 0
  } catch {
    /* 忽略 */
  }
  try {
    const appts: any = await listAppointments(1, 1, 1)
    stats.value.pendingAppointments = appts.data?.total || 0
  } catch {
    /* 忽略 */
  }
})

function maskIdNumber(id: string) {
  if (!id || id.length < 8) return id
  return id.slice(0, 4) + '****' + id.slice(-4)
}

function logout() {
  localStorage.removeItem('adminToken')
  ElMessage.success('已退出登录')
  router.push('/landlord/login')
}
</script>

<style scoped>
.profile-page {
  padding: 24px;
  background: #f5f7fa;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  max-width: 720px;
  margin: 0 auto;
}

.profile-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1a56db, #667eea);
  border-radius: 16px;
  padding: 32px 28px;
  color: #fff;
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin-right: 20px;
}

.name {
  font-size: 26px;
  font-weight: 600;
}

.phone {
  font-size: 14px;
  opacity: 0.85;
  margin-top: 6px;
}

.stat-cards {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a56db;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.detail-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-top: 16px;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  color: #909399;
  font-size: 14px;
}

.value {
  color: #303133;
  font-size: 14px;
}

.logout-btn {
  width: 100%;
  margin-top: 20px;
}
</style>
