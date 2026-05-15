import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

// 创建 Supabase 服务端客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - 获取工单列表
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const isAdmin = session.role === 'admin'

    let query = supabase
      .from('tickets')
      .select(`
        *,
        store:stores(*),
        creator:users(*)
      `)
      .order('created_at', { ascending: false })

    // 非管理员只能查看自己的工单
    if (!isAdmin) {
      query = query.eq('created_by', session.userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建工单
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, store_id, title, form_data } = body

    // 验证必填字段
    if (!type || !store_id || !title || !form_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 验证工单类型
    const validTypes = ['switch_room', 'price_adjustment', 'enterprise_card', 'whitelist']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid ticket type' }, { status: 400 })
    }

    // 创建工单
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        type,
        store_id,
        created_by: session.userId,
        title,
        status: 'pending',
        form_data,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
