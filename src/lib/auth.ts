import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import type { SessionData } from '@/types'

// Session 配置
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_security',
  name: 'session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 天
  },
}

// 默认 session 数据
export const defaultSession: SessionData = {
  userId: '',
  feishuUserId: '',
  name: '',
  avatarUrl: '',
  role: 'store',
  storeId: '',
}

// 获取 session
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  
  if (!session.isInitialized) {
    session.data = { ...defaultSession }
  }
  
  return session
}

// 检查是否已登录
export async function isLoggedIn(): Promise<boolean> {
  const session = await getSession()
  return !!session.data.userId
}

// 检查是否为管理员
export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  return session.data.role === 'admin'
}

// 清除 session
export async function clearSession(): Promise<void> {
  const session = await getSession()
  session.destroy()
}

// 获取当前用户 ID
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession()
  return session.data.userId || null
}

// 获取当前用户角色
export async function getCurrentUserRole(): Promise<'admin' | 'store' | null> {
  const session = await getSession()
  return session.data.role || null
}

// 保存 OAuth state 到 session
export async function saveOAuthState(state: string): Promise<void> {
  const session = await getSession()
  session.data.oauthState = state
  await session.save()
}

// 获取并清除 OAuth state
export async function getAndClearOAuthState(expectedState: string): Promise<boolean> {
  const session = await getSession()
  const savedState = session.data.oauthState
  
  // 清除 state
  session.data.oauthState = undefined
  await session.save()
  
  // 验证 state
  return savedState === expectedState
}
