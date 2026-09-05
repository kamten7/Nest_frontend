<template>
  <div class="house-list-page">
    <div class="page-header">
      <h2>🏠 我的房源</h2>
      <el-button type="primary" @click="router.push('/landlord/house/create')">➕ 发布新房源</el-button>
    </div>

    <el-table :data="records" v-loading="loading" empty-text="还没有房源，点击右上角发布">
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.coverImage"
            :src="row.coverImage"
            fit="cover"
            style="width: 80px; height: 60px; border-radius: 6px"
          />
          <div v-else class="no-cover">🏠</div>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="价格" width="110">
        <template #default="{ row }">
          <span class="price">¥{{ row.price }}/月</span>
        </template>
      </el-table-column>
      <el-table-column prop="district" label="区域" width="100">
        <template #default="{ row }">{{ row.city }}·{{ row.district }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '已上架' : '已下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="viewCount" label="浏览量" width="80" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="goDetail(row.id)">详情</el-button>
          <el-button size="small" type="primary" @click="goEdit(row.id)">编辑</el-button>
          <el-button
            size="small"
            :type="row.status === 1 ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 1 ? '下架' : '上架' }}
          </el-button>
          <el-popconfirm title="确定删除该房源吗？" confirm-button-text="删除" @confirm="removeHouse(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMyHouses, updateHouseStatus, deleteHouse, type HouseVO } from '@/api/house'

const router = useRouter()
const records = ref<HouseVO[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)

async function loadList() {
  loading.value = true
  try {
    const res: any = await getMyHouses(page.value, pageSize)
    records.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

function goDetail(id: number) {
  router.push(`/landlord/house/detail/${id}`)
}

function goEdit(id: number) {
  router.push(`/landlord/house/edit/${id}`)
}

async function toggleStatus(row: HouseVO) {
  try {
    const newStatus = row.status === 1 ? 0 : 1
    await updateHouseStatus(row.id, newStatus)
    ElMessage.success(newStatus === 1 ? '已上架' : '已下架')
    loadList()
  } catch {
    // 拦截器已提示
  }
}

async function removeHouse(id: number) {
  try {
    await deleteHouse(id)
    ElMessage.success('删除成功')
    // 若删的是最后一页最后一条，页码回落避免空页
    if (records.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadList()
  } catch {
    // 拦截器已提示
  }
}

onMounted(loadList)
</script>

<style scoped>
.house-list-page {
  padding: 20px 24px;
  background: #f5f7fa;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.no-cover {
  width: 80px;
  height: 60px;
  background: #f0f2f5;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.price {
  color: #e74c3c;
  font-weight: 600;
}

.pagination-bar {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
}
</style>
