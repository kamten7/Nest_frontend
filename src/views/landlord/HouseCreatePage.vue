<template>
  <div class="create-page">
    <!-- 左：表单 -->
    <div class="form-panel">
      <h2 class="page-title">{{ pageTitle }}</h2>

      <!-- 图片上传 -->
      <div class="section">
        <div class="section-title">房源图片（第一张为封面）</div>
        <el-upload
          list-type="picture-card"
          v-model:file-list="fileList"
          :http-request="doUpload"
          :on-remove="handleImageRemove"
          :on-preview="handleImagePreview"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </div>

      <!-- 基本信息 -->
      <!-- label-width="auto"：标签宽度按内容自适应，避免'月租金'占太多导致输入框变窄 -->
      <el-form :model="form" label-width="auto" size="large">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="如：朝阳精装两居室，近地铁" />
        </el-form-item>

        <!-- 位置：城市 + 区域 各占一半 -->
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="城市" required>
              <el-input v-model="form.city" placeholder="湛江市" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域">
              <el-input v-model="form.district" placeholder="霞山区" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 月租金：核心字段，独占一行，醒目 -->
        <el-form-item label="月租金" required>
          <el-input-number v-model="form.price" :min="0" :precision="0" :controls="false"
            placeholder="元 / 月" style="width: 100%" />
        </el-form-item>

        <!-- 押金 + 面积 各占一半 -->
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="押金">
              <el-input-number v-model="form.deposit" :min="0" :controls="false"
                placeholder="元" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面积㎡">
              <el-input-number v-model="form.area" :min="0" :precision="0" :controls="false"
                placeholder="㎡" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 出租方式 + 朝向 各占一半 -->
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="出租方式">
              <el-select v-model="form.rentType" style="width: 100%">
                <el-option label="整租" value="整租" />
                <el-option label="合租" value="合租" />
                <el-option label="短租" value="短租" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="朝向">
              <el-select v-model="form.orientation" style="width: 100%">
                <el-option v-for="o in ['南', '北', '东', '西', '东南', '西南', '东北', '西北']" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 户型：室厅卫 三个短输入并排 -->
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="室">
              <el-input-number v-model="form.roomCount" :min="0" :precision="0" :controls="false"
                placeholder="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="厅">
              <el-input-number v-model="form.hallCount" :min="0" :precision="0" :controls="false"
                placeholder="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="卫">
              <el-input-number v-model="form.bathroomCount" :min="0" :precision="0" :controls="false"
                placeholder="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细地址">
          <el-input v-model="form.address" placeholder="填地址后点右侧『定位到地图』" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="form.tags" multiple filterable allow-create default-first-option style="width: 100%" placeholder="如：近地铁 / 朝南 / 精装修">
            <el-option v-for="t in ['近地铁', '朝南', '精装修', '有电梯', '可短租', '拎包入住']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="房源描述、家具家电情况" />
        </el-form-item>
        <el-form-item label="租客要求">
          <el-input v-model="form.requirements" placeholder="如：限女生 / 不可养宠物" />
        </el-form-item>
      </el-form>

      <!-- 坐标提示 + 提交 -->
      <div class="submit-bar">
        <div class="coordinate-text" v-if="form.latitude != null && form.longitude != null">
          📍 已选坐标：{{ form.latitude.toFixed(6) }}, {{ form.longitude.toFixed(6) }}
        </div>
        <div class="coordinate-text muted" v-else>⚠️ 还没选位置，去右侧地图上点一下</div>
        <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
          {{ editId ? '保存修改' : '发布房源' }}
        </el-button>
      </div>
    </div>

    <!-- 右：地图选点 -->
    <div class="map-panel">
      <div class="map-toolbar">
        <span class="map-hint">👆 点击地图选位置</span>
        <el-button size="small" @click="locateAddress">📍 定位到地图</el-button>
      </div>
      <div ref="mapContainer" class="mini-map" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { UploadFile, UploadRequestOptions } from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createHouse, updateHouse, getHouseById, geocodeAddress, reverseGeocode, uploadImage, type HouseCreateData } from '@/api/house'

const route = useRoute()
const router = useRouter()

const mapContainer = ref<HTMLDivElement>()
const fileList = ref<UploadFile[]>([])
const imageUrls = ref<string[]>([])
const submitting = ref(false)
const editId = ref<number | null>(null)   // 非空 = 编辑模式

// 页面标题：新增 vs 编辑
const pageTitle = ref('📝 发布房源')

const form = reactive<HouseCreateData>({
  title: '',
  city: '',
  district: '',
  address: '',
  price: 0,
  deposit: undefined,
  area: undefined,
  roomCount: undefined,
  hallCount: undefined,
  bathroomCount: undefined,
  orientation: '',
  rentType: '整租',
  description: '',
  requirements: '',
  tags: [],
  images: [],
  latitude: undefined,
  longitude: undefined,
})

let map: L.Map
let marker: L.Marker | null = null

// 自定义图标（同地图页）
const pickIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

onMounted(async () => {
  await nextTick()
  initMap()

  // 编辑模式：/landlord/house/edit/:id
  const editIdParam = route.params.id
  if (editIdParam) {
    editId.value = Number(editIdParam)
    pageTitle.value = '✏️ 编辑房源'
    await loadForEdit(editId.value)
    return
  }

  // 从地图页 "+" 按钮跳转时预填中心坐标
  const qLat = Number(route.query.lat)
  const qLng = Number(route.query.lng)
  if (qLat && qLng) {
    form.latitude = qLat
    form.longitude = qLng
    placeMarker(qLat, qLng)
  }
})

/** 编辑模式：加载房源详情回填表单 */
async function loadForEdit(id: number) {
  try {
    const res: any = await getHouseById(id)
    const h = res.data
    Object.assign(form, {
      title: h.title,
      description: h.description,
      address: h.address,
      province: h.province,
      city: h.city,
      district: h.district,
      latitude: h.latitude,
      longitude: h.longitude,
      price: h.price,
      deposit: h.deposit,
      area: h.area,
      roomCount: h.roomCount,
      hallCount: h.hallCount,
      bathroomCount: h.bathroomCount,
      floor: h.floor,
      totalFloor: h.totalFloor,
      orientation: h.orientation,
      rentType: h.rentType,
      availableDate: h.availableDate,
      utilities: h.utilities,
      requirements: h.requirements,
      tags: h.tags || [],
      images: h.images || [],
    })
    imageUrls.value = h.images || []
    // 回填 fileList（用于 el-upload 显示已传图片）
    fileList.value = (h.images || []).map((url: string, i: number) => ({
      uid: -i - 1,
      name: `image-${i}`,
      status: 'success' as const,
      url,
    }))
    // 地图定位到房源坐标
    if (h.latitude && h.longitude) {
      placeMarker(h.latitude, h.longitude)
    }
  } catch {
    ElMessage.error('加载房源失败')
  }
}

onBeforeUnmount(() => {
  if (map) map.remove() // 销毁地图，防止内存泄漏
})

function initMap() {
  map = L.map(mapContainer.value!).setView([21.27, 110.4], 13)

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    attribution: '&copy; 高德地图',
    maxZoom: 18,
  }).addTo(map)

  // 点击地图 → 放标记 + 反向地理编码填地址
  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    placeMarker(lat, lng)
    reverseGeocode(lat, lng)
      .then((res: any) => {
        const addr = res.data?.displayName
        if (addr) {
          form.address = addr.split(' ')[0] || addr
        }
      })
      .catch(() => {})
  })
}

function placeMarker(lat: number, lng: number) {
  form.latitude = lat
  form.longitude = lng
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], { icon: pickIcon }).addTo(map)
  }
  map.setView([lat, lng], Math.max(map.getZoom(), 15))
}

/** 输入地址 → 正向地理编码 → 地图定位 */
async function locateAddress() {
  if (!form.address) {
    ElMessage.warning('请先输入详细地址')
    return
  }
  try {
    const res: any = await geocodeAddress(form.address)
    const geo = res.data
    if (!geo) {
      ElMessage.error('无法定位该地址')
      return
    }
    form.latitude = geo.latitude
    form.longitude = geo.longitude
    placeMarker(geo.latitude, geo.longitude)
    ElMessage.success('已在地图上定位')
  } catch {
    // 拦截器已提示
  }
}

/** 自定义上传：调后端 uploadImage */
async function doUpload(options: UploadRequestOptions) {
  try {
    const res: any = await uploadImage(options.file as File)
    const url = res.data
    imageUrls.value.push(url)
    form.images = [...imageUrls.value]
    ElMessage.success('图片上传成功')
  } catch (e) {
    ElMessage.error('图片上传失败')
    throw e   // 重新抛出，让 el-upload 标记为失败（而不是显示成功）
  }
}

function handleImageRemove(file: UploadFile, newFileList: UploadFile[]) {
  // 用 v-model:file-list 同步后的 newFileList 按 URL 重建 images（顺序与显示一致）
  imageUrls.value = newFileList
    .map((f) => f.url || (f.response as any)?.data)
    .filter((u): u is string => !!u)
  form.images = [...imageUrls.value]
}

function handleImagePreview() {
  // 预览已由 picture-card 自带放大，无需处理
}

/** 提交发布 */
async function handleSubmit() {
  if (!form.title) return ElMessage.warning('请填写房源标题')
  if (!form.city) return ElMessage.warning('请填写城市')
  if (!form.price || form.price <= 0) return ElMessage.warning('请填写月租金')
  if (form.latitude == null || form.longitude == null) {
    return ElMessage.warning('请在地图上选一个位置')
  }

  submitting.value = true
  try {
    if (editId.value) {
      await updateHouse(editId.value, form)
      ElMessage.success('编辑成功')
    } else {
      const res: any = await createHouse(form)
      ElMessage.success(`发布成功！房源 ID：${res.data}`)
    }
    router.push('/landlord/house/list')
  } catch {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-page {
  height: 100%;
  display: flex;
}

.form-panel {
  width: 560px;
  padding: 20px 24px;
  overflow-y: auto;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.page-title {
  margin: 0 0 16px;
  font-size: 18px;
  color: #303133;
}

.section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.submit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}

.coordinate-text {
  font-size: 13px;
  color: #1a56db;
}

.coordinate-text.muted {
  color: #e6a23c;
}

.map-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.map-toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-hint {
  font-size: 13px;
  color: #606266;
}

.mini-map {
  flex: 1;
  width: 100%;
}
</style>
