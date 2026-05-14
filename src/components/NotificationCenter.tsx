"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getTicketTypeName, getStatusName, formatRelativeTime } from '@/lib/utils'
import type { Ticket } from '@/types'
import { Bell, X, MessageCircle, Ticket as TicketIcon } from 'lucide-react'

interface NotificationCenterProps {
  onViewTicket?: (ticketId: string) => void
}

export function NotificationCenter({ onViewTicket }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'new_ticket' | 'new_message'
    ticket: Ticket
    message?: string
    timestamp: Date
    read: boolean
  }>>([])

  // 请求通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // 显示浏览器通知
  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      })
    }
  }

  // 添加通知
  const addNotification = (
    type: 'new_ticket' | 'new_message',
    ticket: Ticket,
    message?: string
  ) => {
    const id = `${ticket.id}-${Date.now()}`
    const notification = {
      id,
      type,
      ticket,
      message,
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [notification, ...prev].slice(0, 20))

    // 显示浏览器通知
    if (type === 'new_ticket') {
      showBrowserNotification(
        '新工单提醒',
        `收到一个新的${getTicketTypeName(ticket.type)}工单`
      )
    } else {
      showBrowserNotification(
        '工单回复提醒',
        `${ticket.title} 有新的回复消息`
      )
    }
  }

  // 标记已读
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  // 标记全部已读
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // 清除通知
  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知中心
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              全部已读
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>暂无通知</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                  !notification.read ? 'bg-blue-50 border-blue-100' : 'bg-card'
                }`}
                onClick={() => {
                  markAsRead(notification.id)
                  onViewTicket?.(notification.ticket.id)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {notification.type === 'new_ticket' ? (
                        <TicketIcon className="h-5 w-5 text-blue-500" />
                      ) : (
                        <MessageCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {notification.type === 'new_ticket'
                          ? `新${getTicketTypeName(notification.ticket.type)}工单`
                          : '新消息'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.ticket.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearNotification(notification.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
