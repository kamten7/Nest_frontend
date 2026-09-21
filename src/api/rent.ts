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
  /** 从押金中扣除、归房东的金额（物品损坏赔偿等） */
  deductAmount: number
  /** 实际退回租客的押金金额（不含预付租金退款） */
  refundAmount: number
  /** 未住租期的月数（申请退租时后端算好并冻结） */
  prepaidMonths: number
  /** 未住租期的预付租金退回金额，与押金退款分两笔入账 */
  prepaidRefundAmount: number
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
  /** 房东身份（租客侧「联系房东」用；房东侧为自己的 ID） */
  landlordId: number | null
  landlordName: string | null
  /** 租客身份（房东侧「联系租客」用） */
  tenantId: number | null
  tenantName: string | null
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

/** 退租结算请求体 */
export interface RefundDepositPayload {
  /** 从押金中扣除、归房东的金额；不传或 0 = 全额退回租客 */
  deductAmount?: number
  /** 扣款说明 */
  remark?: string
}

/**
 * 退回押金（退租申请中且租期结束）。
 *
 * <p>可带扣款金额：租客损坏房屋内物品时从押金中扣除，扣除部分归房东（留在房东钱包，
 * 结算后即可提现），剩余押金退回租客钱包；不传则全额退回。
 */
export function refundDeposit(orderId: number, payload: RefundDepositPayload = {}) {
  return request.post<{ data: RentOrder }>(`/admin/rent/${orderId}/refund`, payload)
}
