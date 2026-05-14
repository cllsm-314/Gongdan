// 飞书 API 配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// 飞书 API 基础 URL
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis'

// 生成随机 state 用于 OAuth 状态校验
export function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// 获取飞书 OAuth 授权 URL
export function getFeishuAuthUrl(state: string): string {
  const redirectUri = encodeURIComponent(`${APP_URL}/api/auth/callback`)
  const scope = 'contact:user.employee_id:readonly user.id:readonly user.name:readonly user.avatar:readonly'
  
  return `${FEISHU_API_BASE}/authen/v1/authorize?app_id=${FEISHU_APP_ID}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`
}

// 通过 code 获取用户访问令牌
export async function getAccessToken(code: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  refresh_expires_in: number
  scope: string
} | null> {
  try {
    const response = await fetch(`${FEISHU_API_BASE}/authen/v1/oidc/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_access_token: await getAppAccessToken(),
        grant_type: 'authorization_code',
        code,
      }),
    })
    
    const data = await response.json()
    
    if (data.code !== 0) {
      console.error('Feishu get access token error:', data)
      return null
    }
    
    return data.data
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}

// 获取应用访问令牌
async function getAppAccessToken(): Promise<string> {
  try {
    const response = await fetch(`${FEISHU_API_BASE}/auth/v3/app_access_token/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: FEISHU_APP_ID,
        app_secret: FEISHU_APP_SECRET,
      }),
    })
    
    const data = await response.json()
    
    if (data.code !== 0) {
      console.error('Feishu get app access token error:', data)
      throw new Error('Failed to get app access token')
    }
    
    return data.app_access_token
  } catch (error) {
    console.error('Error getting app access token:', error)
    throw error
  }
}

// 获取用户信息
export async function getFeishuUserInfo(accessToken: string): Promise<{
  id: string
  name: string
  avatar_url?: string
  email?: string
  employee_id?: string
} | null> {
  try {
    const response = await fetch(`${FEISHU_API_BASE}/authen/v1/user_info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    const data = await response.json()
    
    if (data.code !== 0) {
      console.error('Feishu get user info error:', data)
      return null
    }
    
    return {
      id: data.data.open_id,
      name: data.data.name || '未知用户',
      avatar_url: data.data.avatar_url,
      email: data.data.email,
      employee_id: data.data.employee_id,
    }
  } catch (error) {
    console.error('Error getting user info:', error)
    return null
  }
}

// 获取用户详细信息（通过手机号或邮箱）
export async function getUserDetailByUnionId(unionId: string): Promise<{
  user_id: string
  name: string
  avatar_url?: string
  mobile?: string
  email?: string
} | null> {
  try {
    const appAccessToken = await getAppAccessToken()
    
    const response = await fetch(`${FEISHU_API_BASE}/contact/v3/users/${unionId}?user_id_type=union_id`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${appAccessToken}`,
      },
    })
    
    const data = await response.json()
    
    if (data.code !== 0) {
      console.error('Feishu get user detail error:', data)
      return null
    }
    
    const user = data.data.user
    return {
      user_id: user.user_id,
      name: user.name,
      avatar_url: user.avatar?.avatar_72,
      mobile: user.mobile,
      email: user.email,
    }
  } catch (error) {
    console.error('Error getting user detail:', error)
    return null
  }
}

// 发送通知消息（可选，用于实时通知）
export async function sendFeishuMessage(userId: string, message: string): Promise<boolean> {
  try {
    const appAccessToken = await getAppAccessToken()
    
    const response = await fetch(`${FEISHU_API_BASE}/im/v1/messages?receive_id_type=open_id`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receive_id: userId,
        msg_type: 'text',
        content: JSON.stringify({ text: message }),
      }),
    })
    
    const data = await response.json()
    
    return data.code === 0
  } catch (error) {
    console.error('Error sending Feishu message:', error)
    return false
  }
}
