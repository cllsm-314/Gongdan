import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, isLoggedIn, isAdmin } from '@/lib/auth'
import { getUser, getTicket } from '@/lib/supabase'
import { Header } from '@/components/Header'
import { TicketDetail } from '@/components/TicketDetail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface AdminTicketDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminTicketDetailPage({ params }: AdminTicketDetailPageProps) {
  const loggedIn = await isLoggedIn()
  
  if (!loggedIn) {
    redirect('/login')
  }

  const admin = await isAdmin()
  
  if (!admin) {
    redirect('/')
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
        <Header user={user} isAdmin={true} />
        <div className="container px-4 py-8 mx-auto">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回管理后台
            </Button>
          </Link>
          <div className="max-w-2xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4">工单不存在</h1>
            <p className="text-muted-foreground">
              该工单可能已被删除。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header user={user} isAdmin={true} />
      <div className="container px-4 py-8 mx-auto">
        <Link href="/admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回管理后台
          </Button>
        </Link>

        <TicketDetail ticket={ticket} currentUser={user} isAdmin={true} />
      </div>
    </div>
  )
}
