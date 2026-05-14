import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, isLoggedIn } from '@/lib/auth'
import { getUser, getStores } from '@/lib/supabase'
import { TicketForm } from '@/components/TicketForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { TicketType } from '@/types'

interface NewTicketPageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function NewTicketPage({ searchParams }: NewTicketPageProps) {
  const loggedIn = await isLoggedIn()
  
  if (!loggedIn) {
    redirect('/login')
  }

  const session = await getSession()
  const user = session.data.userId ? await getUser(session.data.userId) : null

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const ticketType = (params.type as TicketType) || 'switch_room'

  // 验证工单类型
  const validTypes = ['switch_room', 'price_adjustment', 'enterprise_card', 'whitelist']
  if (!validTypes.includes(ticketType)) {
    redirect('/')
  }

  // 获取门店列表
  const stores = await getStores()

  // 如果用户没有绑定门店，显示提示
  if (!user.store_id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container px-4 py-8 mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>

          <div className="max-w-2xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4">请先绑定门店</h1>
            <p className="text-muted-foreground mb-6">
              您还没有绑定门店，请联系管理员为您分配门店权限。
            </p>
            <p className="text-sm text-muted-foreground">
              管理员：张春雷 / 门店总经理
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container px-4 py-8 mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <TicketForm
            ticketType={ticketType}
            storeId={user.store_id}
            userId={user.id}
          />
        </div>
      </div>
    </div>
  )
}
