import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, getFeishuUserInfo } from '@/lib/feishu'
import { getSession, sessionOptions, defaultSession, getAndClearOAuthState } from '@/lib/auth'
import { upsertUser } from '@/lib/supabase'
import { cookies } from 'next/headers'

// 添加 SessionData 接口定义
interface SessionData {
  userId: string
  feishuUserId: string
  name: string
  avatarUrl: string
  role: string
  storeId: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Feishu OAuth error:', error)
      return NextResponse.redirect('/login?error=auth_denied')
    }

    if (!code) {
      return NextResponse.redirect('/login?error=missing_code')
    }

    if (!state || !(await getAndClearOAuthState(state))) {
      console.error('OAuth state validation failed')
      return NextResponse.redirect('/login?error=invalid_state')
    }

    const tokenData = await getAccessToken(code)
    
    if (!tokenData) {
      return NextResponse.redirect('/login?error=token_failed')
    }

    const userInfo = await getFeishuUserInfo(tokenData.access_token)
    
    if (!userInfo) {
      return NextResponse.redirect('/login?error=user_info_failed')
    }

    const user = await upsertUser({
      feishu_user_id: userInfo.id,
      name: userInfo.name,
      avatar_url: userInfo.avatar_url,
    })

    if (!user) {
      return NextResponse.redirect('/login?error=user_create_failed')
    }

    const cookieStore = await cookies()
    const { getIronSession } = await import('iron-session')
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    session.data = {
      userId: user.id,
      feishuUserId: userInfo.id,
      name: userInfo.name,
      avatarUrl: userInfo.avatar_url,
      role: user.role,
      storeId: user.store_id || '',
    }
    
    await session.save()

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
