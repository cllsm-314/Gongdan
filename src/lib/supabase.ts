import { createBrowserClient } from '@supabase/ssr'
import type { Store, User, Ticket, TicketMessage } from '@/types'

// 创建浏览器端 Supabase 客户端
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 获取用户信息
export async function getUser(userId: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  return data
}

// 根据飞书用户ID获取用户
export async function getUserByFeishuId(feishuUserId: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('feishu_user_id', feishuUserId)
    .single()
  
  if (error) {
    console.error('Error fetching user by feishu id:', error)
    return null
  }
  return data
}

// 创建或更新用户
export async function upsertUser(userData: {
  feishu_user_id: string
  name: string
  avatar_url?: string
  role?: 'admin' | 'store'
  store_id?: string
}): Promise<User | null> {
  const supabase = createClient()
  
  // 检查是否是管理员
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('*')
    .eq('feishu_user_id', userData.feishu_user_id)
    .single()
  
  const role = adminData ? 'admin' : (userData.role || 'store')
  
  // 查找现有用户
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('feishu_user_id', userData.feishu_user_id)
    .single()
  
  if (existingUser) {
    // 更新用户
    const { data, error } = await supabase
      .from('users')
      .update({
        name: userData.name,
        avatar_url: userData.avatar_url,
        role: existingUser.role === 'admin' ? 'admin' : role,
        store_id: userData.store_id || existingUser.store_id,
      })
      .eq('id', existingUser.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user:', error)
      return null
    }
    return data
  } else {
    // 创建新用户
    const { data, error } = await supabase
      .from('users')
      .insert({
        feishu_user_id: userData.feishu_user_id,
        name: userData.name,
        avatar_url: userData.avatar_url,
        role: role,
        store_id: userData.store_id,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user:', error)
      return null
    }
    return data
  }
}

// 获取所有门店
export async function getStores(): Promise<Store[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching stores:', error)
    return []
  }
  return data || []
}

// 获取用户的工单列表
export async function getTickets(userId: string, isAdmin: boolean = false): Promise<Ticket[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('tickets')
    .select(`
      *,
      store:stores(*),
      creator:users(*)
    `)
    .order('created_at', { ascending: false })
  
  if (!isAdmin) {
    query = query.eq('created_by', userId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching tickets:', error)
    return []
  }
  return data || []
}

// 获取单个工单
export async function getTicket(ticketId: string): Promise<Ticket | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      store:stores(*),
      creator:users(*)
    `)
    .eq('id', ticketId)
    .single()
  
  if (error) {
    console.error('Error fetching ticket:', error)
    return null
  }
  return data
}

// 创建工单
export async function createTicket(ticketData: {
  type: string
  store_id: string
  created_by: string
  title: string
  form_data: Record<string, unknown>
}): Promise<Ticket | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticketData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating ticket:', error)
    return null
  }
  return data
}

// 更新工单状态
export async function updateTicketStatus(
  ticketId: string,
  status: 'pending' | 'processing' | 'completed' | 'closed'
): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)
  
  if (error) {
    console.error('Error updating ticket status:', error)
    return false
  }
  return true
}

// 获取工单消息
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ticket_messages')
    .select(`
      *,
      sender:users(*)
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }
  return data || []
}

// 发送消息
export async function sendMessage(messageData: {
  ticket_id: string
  sender_id: string
  content: string
  attachment_type?: 'text' | 'image' | 'file'
  attachment_url?: string
}): Promise<TicketMessage | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert(messageData)
    .select(`
      *,
      sender:users(*)
    `)
    .single()
  
  if (error) {
    console.error('Error sending message:', error)
    return null
  }
  return data
}

// 更新用户门店绑定
export async function updateUserStore(userId: string, storeId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .update({ store_id: storeId })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating user store:', error)
    return false
  }
  return true
}

// 订阅工单消息
export function subscribeToMessages(
  ticketId: string,
  onMessage: (message: TicketMessage) => void
) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel(`ticket-messages-${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`,
      },
      (payload) => {
        onMessage(payload.new as TicketMessage)
      }
    )
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}

// 订阅新工单（管理员用）
export function subscribeToNewTickets(onTicket: (ticket: Ticket) => void) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('new-tickets')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tickets',
      },
      (payload) => {
        onTicket(payload.new as Ticket)
      }
    )
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}
