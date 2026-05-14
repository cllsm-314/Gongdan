import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, isLoggedIn } from '@/lib/auth'
import { getUser, getTickets } from '@/lib/supabase'
import { Header } from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TICKET_TYPES, TICKET_STATUS } from '@/types'
import { formatDate, formatRelativeTime, getTicketTypeName } from '@/lib/utils'
import {
  Ticket,
  Building2,
  Clock,
  MessageCircle,
  Plus,
  Filter,
} from 'lucide-react'

export default async function MyTicketsPage() {
  const loggedIn = await isLoggedIn()
  
  if (!loggedIn) {
    redirect('/login')
  }

  const session = await getSession()
  const user = session.data.userId ? await getUser(session.data.userId) : null

  if (!user) {
    redirect('/login')
  }

  const tickets = await getTickets(user.id, false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header user={user} isAdmin={false} />
      
      <main className="container px-4 py-8 mx-auto">
        {/* 标题区域 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">我的工单</h1>
            <p className="text-muted-foreground mt-1">
              共 {tickets.length} 个工单
            </p>
          </div>
          <Link href="/">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建工单
            </Button>
          </Link>
        </div>

        {/* 工单列表 */}
        {tickets.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-2">暂无工单</h3>
              <p className="text-muted-foreground mb-6">
                您还没有提交过任何工单
              </p>
              <Link href="/">
                <Button>提交第一个工单</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((ticket) => {
              const statusConfig = TICKET_STATUS[ticket.status]
              const typeConfig = TICKET_TYPES[ticket.type]

              return (
                <Link key={ticket.id} href={`/ticket/${ticket.id}`}>
                  <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base line-clamp-1">
                            {ticket.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color} text-white`}>
                              {typeConfig.title}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{ticket.store?.name || '未知门店'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          <span>{formatRelativeTime(ticket.updated_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
