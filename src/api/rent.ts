import request from './request'

/** 支付记录 */
export interface RentPayment {
  id: number
  payType: string
  period: string | null
  amount: number
  status: number
  bizNo: string | null
  createTime: string
}

/** 退租信息 */
export interface RentTermination {
  id: number
  effectiveEndPeriod: string
  refundStatus: number
  refundTime: string | null
  remark: string | null
}

/** 租房订单 */
export interface RentOrder {
  id: number
  orderNo: string
  houseId: number
  houseTitle: string | null
  houseCover: string | null
  deposit: number
  monthlyRent: number
  status: number
  startDate: string | null
  nextDuePeriod: string | null
  paidMonths: number
  createTime: string
  payments?: RentPayment[]
  termination?: RentTermination | null
}

/** 名下租房订单（可按状态过滤） */
export function listRentOrders(params: Record<string, any> = {}) {
  return request.get<{ data: { total: number; records: RentOrder[] } }>('/admin/rent/my', { params })
}

/** 订单详情（含收款记录 + 退租信息） */
export function getRentDetail(orderId: number) {
  return request.get<{ data: RentOrder }>(`/admin/rent/${orderId}`)
}

/** 退回押金（退租申请中且租期结束） */
export function refundDeposit(orderId: number) {
  return request.post<{ data: RentOrder }>(`/admin/rent/${orderId}/refund`)
}
