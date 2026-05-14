import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, isLoggedIn, isAdmin } from '@/lib/auth'
import { getUser, getTickets } from '@/lib/supabase'
import { Header } from '@/components/Header'
import { AdminTicketList } from '@/components/AdminTicketList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TICKET_STATUS } from '@/types'
import { Ticket, Users, Clock, CheckCircle2 } from 'lucide-react'

export default async function AdminPage() {
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

  // 获取所有工单
  const tickets = await getTickets(user.id, true)

  // 统计工单
  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    processing: tickets.filter(t => t.status === 'processing').length,
    completed: tickets.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header user={user} isAdmin={true} />
      
      <main className="container px-4 py-8 mx-auto">
        {/* 标题区域 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">工单管理后台</h1>
          <p className="text-muted-foreground mt-1">
            管理所有门店提交的工单
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Ticket className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">全部工单</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">待处理</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-100">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.processing}</p>
                  <p className="text-sm text-muted-foreground">处理中</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">已完成</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 工单列表 */}
        <AdminTicketList tickets={tickets} />
      </main>
    </div>
  )
}
