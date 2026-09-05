import request from './request'

/** 预约展示数据 */
export interface Appointment {
  id: number
  houseId: number
  houseTitle: string
  houseCover: string | null
  landlordId: number
  landlordName: string
  tenantId: number
  tenantName: string
  contactPhone: string
  appointmentTime: string | null
  remark: string | null
  status: number
  statusText: string
  cancelReason: string | null
  createTime: string
}

/** 获取房东收到的预约（status 为空 = 全部） */
export function listAppointments(status?: number, page = 1, pageSize = 10) {
  return request.get<{ data: { total: number; records: Appointment[] } }>('/admin/appointment', {
    params: { status, page, pageSize },
  })
}

/** 确认预约 */
export function confirmAppointment(id: number) {
  return request.put(`/admin/appointment/${id}/confirm`)
}

/** 完成看房 */
export function completeAppointment(id: number) {
  return request.put(`/admin/appointment/${id}/complete`)
}

/** 取消预约 */
export function cancelAppointment(id: number, reason?: string) {
  return request.put(`/admin/appointment/${id}/cancel`, { reason })
}
