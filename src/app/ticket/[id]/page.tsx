import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, isLoggedIn } from '@/lib/auth'
import { getUser, getTicket } from '@/lib/supabase'
import { Header } from '@/components/Header'
import { TicketDetail } from '@/components/TicketDetail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface TicketDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const loggedIn = await isLoggedIn()
  
  if (!loggedIn) {
    redirect('/login')
  }

  const session = await getSession()
  const user = session.data.userId ? await getUser(session.data.userId) : null

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const ticket = await getTicket(id)

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header user={user} isAdmin={false} />
        <div className="container px-4 py-8 mx-auto">
          <Link href="/ticket/my">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回我的工单
            </Button>
          </Link>
          <div className="max-w-2xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4">工单不存在</h1>
            <p className="text-muted-foreground">
              该工单可能已被删除或您没有权限查看。
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 检查权限：只能查看自己的工单
  const isAdmin = session.data.role === 'admin'
  const isCreator = ticket.created_by === user.id

  if (!isAdmin && !isCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header user={user} isAdmin={false} />
        <div className="container px-4 py-8 mx-auto">
          <Link href="/ticket/my">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回我的工单
            </Button>
          </Link>
          <div className="max-w-2xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4">无权访问</h1>
            <p className="text-muted-foreground">
              您没有权限查看此工单。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header user={user} isAdmin={isAdmin} />
      <div className="container px-4 py-8 mx-auto">
        <Link href={isAdmin ? '/admin' : '/ticket/my'}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isAdmin ? '返回管理后台' : '返回我的工单'}
          </Button>
        </Link>

        <TicketDetail ticket={ticket} currentUser={user} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
