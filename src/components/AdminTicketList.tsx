"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TICKET_TYPES, TICKET_STATUS, type Ticket, type TicketStatus } from '@/types'
import { formatDate, formatRelativeTime, getTicketTypeName } from '@/lib/utils'
import { NotificationCenter } from '@/components/NotificationCenter'
import {
  Ticket as TicketIcon,
  Building2,
  User,
  Search,
  Filter,
  RefreshCw,
  Bell,
} from 'lucide-react'

interface AdminTicketListProps {
  tickets: Ticket[]
}

export function AdminTicketList({ tickets: initialTickets }: AdminTicketListProps) {
  const [tickets, setTickets] = useState(initialTickets)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNotifications, setShowNotifications] = useState(false)

  // 过滤工单
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.store?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleViewTicket = (ticketId: string) => {
    window.location.href = `/admin/ticket/${ticketId}`
  }

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索工单标题、门店名称、提交人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="closed">已关闭</option>
              </select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 工单列表 */}
        <div className="lg:col-span-2 space-y-4">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TicketIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-medium mb-2">暂无工单</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all'
                    ? '没有找到符合条件的工单'
                    : '暂时没有门店提交工单'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map((ticket) => {
              const statusConfig = TICKET_STATUS[ticket.status]
              const typeConfig = TICKET_TYPES[ticket.type]

              return (
                <Card
                  key={ticket.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                  onClick={() => handleViewTicket(ticket.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base line-clamp-1">
                          {ticket.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color} text-white`}>
                            {typeConfig.title}
                          </span>
                          {ticket.status === 'pending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                              需要处理
                            </span>
                          )}
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
                        <User className="h-4 w-4" />
                        <span>{ticket.creator?.name || '未知用户'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TicketIcon className="h-4 w-4" />
                        <span>提交时间：{formatDate(ticket.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4" />
                        <span>更新时间：{formatRelativeTime(ticket.updated_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* 通知中心 */}
        {showNotifications && (
          <div className="lg:col-span-1">
            <NotificationCenter onViewTicket={handleViewTicket} />
          </div>
        )}
      </div>
    </div>
  )
}
