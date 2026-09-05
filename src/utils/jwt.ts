/** JWT payload 结构（与后端 JwtUtil 签发时一致） */
export interface JwtPayload {
  userId: number
  userType: string
  exp?: number
  iat?: number
}

/**
 * 解码 JWT 的 payload 部分（不校验签名）。
 *
 * JWT 格式：header.payload.signature，payload 是 base64url 编码的 JSON。
 * 前端用它拿 userId 连接 WebSocket，无需额外请求后端。
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // base64url → base64（补齐 padding）
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}
