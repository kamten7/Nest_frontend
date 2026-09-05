import request from './request'

/** 钱包信息 */
export interface WalletInfo {
  walletId: number
  balance: number
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

/** 提现到微信零钱（预留） */
export function withdrawWallet(amount: number) {
  return request.post<{ data: WalletInfo }>('/admin/wallet/withdraw', { amount })
}
