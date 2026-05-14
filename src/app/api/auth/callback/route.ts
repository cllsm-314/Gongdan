import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, getFeishuUserInfo } from '@/lib/feishu'
import { getSession, sessionOptions, defaultSession, getAndClearOAuthState } from '@/lib/auth'
import { upsertUser } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // 处理错误情况
    if (error) {
      console.error('Feishu OAuth error:', error)
      return NextResponse.redirect('/login?error=auth_denied')
    }

    // 检查必要的参数
    if (!code) {
      return NextResponse.redirect('/login?error=missing_code')
    }

    // 验证 state 参数（CSRF 防护）
    if (!state || !(await getAndClearOAuthState(state))) {
      console.error('OAuth state validation failed')
      return NextResponse.redirect('/login?error=invalid_state')
    }

    // 用 code 换取 access_token
    const tokenData = await getAccessToken(code)
    
    if (!tokenData) {
      return NextResponse.redirect('/login?error=token_failed')
    }

    // 获取用户信息
    const userInfo = await getFeishuUserInfo(tokenData.access_token)
    
    if (!userInfo) {
      return NextResponse.redirect('/login?error=user_info_failed')
    }

    // 在数据库中创建或更新用户
    const user = await upsertUser({
      feishu_user_id: userInfo.id,
      name: userInfo.name,
      avatar_url: userInfo.avatar_url,
    })

    if (!user) {
      return NextResponse.redirect('/login?error=user_create_failed')
    }

    // 获取 session 并设置用户信息
    const cookieStore = await cookies()
    const { getIronSession } = await import('iron-session')
    const session = await getIronSession(cookieStore, sessionOptions)

    session.data = {
      userId: user.id,
      feishuUserId: userInfo.id,
      name: userInfo.name,
      avatarUrl: userInfo.avatar_url,
      role: user.role,
      storeId: user.store_id || '',
    }
    
    await session.save()

    // 根据角色重定向
    if (user.role === 'admin') {
      return NextResponse.redirect('/admin')
    } else {
      return NextResponse.redirect('/')
    }
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect('/login?error=callback_failed')
  }
}
