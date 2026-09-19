import request from './request'

/** 钱包信息 */
export interface WalletInfo {
  walletId: number
  /** 钱包余额（含在租订单的押金） */
  balance: number
  /** 锁定金额：在租订单押金，房东可见但不可提现 */
  lockedAmount: number
  /** 可提现余额 = balance − lockedAmount */
  availableBalance: number
}

/** 钱包流水 */
export interface WalletTransaction {
  id: number
  bizType: string
  amount: number
  direction: number
  balanceAfter: number
  status: number
  remark: string | null
  createTime: string
}

/** 我的钱包（余额） */
export function getWallet() {
  return request.get<{ data: WalletInfo }>('/admin/wallet')
}

/** 钱包流水（收款记录，可按业务类型筛选） */
export function getWalletTransactions(params: Record<string, any> = {}) {
  return request.get<{ data: { total: number; records: WalletTransaction[] } }>('/admin/wallet/transactions', { params })
}

/**
 * 提现到微信零钱（预留）。
 * @param idempotencyKey 幂等键：调用方在「打开提现弹窗」时生成一次，
 *                       同一弹窗内重复提交命中同一键 ⇒ 后端只受理一次（防双击重复扣款）
 */
export function withdrawWallet(amount: number, idempotencyKey: string) {
  return request.post<{ data: WalletInfo }>('/admin/wallet/withdraw', { amount, idempotencyKey })
}

/** 生成幂等键：优先用原生 crypto.randomUUID，非安全上下文（http）下退化为时间戳+随机数 */
export function genIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
