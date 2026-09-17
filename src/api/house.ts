import request from './request'

/** 房源标记点 */
export interface HouseMarker {
  id: number
  title: string
  price: number
  latitude: number
  longitude: number
  coverImage: string | null
}

/** 发布房源请求体（对应后端 HouseCreateDTO） */
export interface HouseCreateData {
  title: string
  description?: string
  address: string
  province?: string
  city?: string
  district?: string
  latitude?: number
  longitude?: number
  price: number
  deposit?: number
  area?: number
  roomCount?: number
  hallCount?: number
  bathroomCount?: number
  floor?: number
  totalFloor?: number
  orientation?: string
  rentType?: string
  availableDate?: string
  utilities?: string
  requirements?: string
  images?: string[]
  tags?: string[]
}

/** 地理编码结果 */
export interface GeocodeResult {
  latitude: number
  longitude: number
  displayName: string
}

/** 房源完整信息（对应后端 HouseVO） */
export interface HouseVO {
  id: number
  landlordId: number
  landlordName: string | null
  landlordAvatar: string | null
  title: string
  description: string | null
  address: string
  province: string | null
  city: string | null
  district: string | null
  latitude: number | null
  longitude: number | null
  price: number
  deposit: number | null
  area: number | null
  roomCount: number | null
  hallCount: number | null
  bathroomCount: number | null
  floor: number | null
  totalFloor: number | null
  orientation: string | null
  rentType: string | null
  availableDate: string | null
  utilities: string | null
  requirements: string | null
  status: number
  viewCount: number
  coverImage: string | null
  images: string[] | null
  tags: string[] | null
  distanceText: string | null
  createTime: string | null
}

/** 房东信息（对应后端 Landlord 实体，/admin/landlord/me 返回，密码已脱敏） */
export interface LandlordInfo {
  id: number
  name: string
  phone: string
  avatar: string | null
  idNumber: string | null
  status: number
}

/** 房东登录 */
export function landlordLogin(phone: string, password: string) {
  return request.post('/admin/landlord/login', { phone, password })
}

/** 获取房东的地图标记点 */
export function getLandlordMapMarkers() {
  return request.get<{ data: HouseMarker[] }>('/admin/house/map')
}

/** 地址地理编码（正向：地址 → 坐标） */
export function geocodeAddress(address: string) {
  return request.post<{ data: GeocodeResult }>('/admin/house/geocode', { address })
}

/** 反向地理编码（坐标 → 地址，地图选点用） */
export function reverseGeocode(lat: number, lng: number) {
  return request.post<{ data: GeocodeResult }>('/admin/house/geocode/reverse', { lat, lng })
}

/** 上传房源图片到 MinIO，返回完整 URL */
export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<{ data: string }>('/admin/house/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** 发布房源，返回房源 ID */
export function createHouse(data: HouseCreateData) {
  return request.post<{ data: number }>('/admin/house', data)
}

/** 编辑房源 */
export function updateHouse(id: number, data: HouseCreateData) {
  return request.put(`/admin/house/${id}`, data)
}

/** 我的房源列表（分页） */
export function getMyHouses(page = 1, pageSize = 10) {
  return request.get<{ data: { total: number; records: HouseVO[] } }>('/admin/house/my', {
    params: { page, pageSize },
  })
}

/** 我的房源详情（编辑回填用，即使下架） */
export function getHouseById(id: number) {
  return request.get<{ data: HouseVO }>(`/admin/house/${id}`)
}

/** 房源状态切换：0下架(需重新发布) / 1上架 / 2在租中(系统自动，不可手动改) */
export function updateHouseStatus(id: number, status: number) {
  return request.put(`/admin/house/${id}/status`, null, { params: { status } })
}

/** 删除房源 */
export function deleteHouse(id: number) {
  return request.delete(`/admin/house/${id}`)
}

/** 房东个人信息 */
export function getLandlordMe() {
  return request.get<{ data: LandlordInfo }>('/admin/landlord/me')
}

