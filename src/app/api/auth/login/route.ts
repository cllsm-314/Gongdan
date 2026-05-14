import { NextResponse } from 'next/server'
import { generateState, getFeishuAuthUrl } from '@/lib/feishu'
import { saveOAuthState } from '@/lib/auth'

export async function GET() {
  try {
    // 生成随机的 state 参数
    const state = generateState()
    
    // 将 state 保存到 session 中用于 CSRF 防护
    await saveOAuthState(state)
    
    // 生成飞书授权 URL
    const authUrl = getFeishuAuthUrl(state)
    
    // 重定向到飞书授权页面
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.redirect('/login?error=auth_failed')
  }
}
