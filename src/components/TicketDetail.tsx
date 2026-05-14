"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TICKET_TYPES, TICKET_STATUS, type Ticket, type User } from '@/types'
import { formatDate, getTicketTypeName } from '@/lib/utils'
import { ChatBox } from '@/components/ChatBox'
import { Building2, User as UserIcon, Clock, FileText, Image as ImageIcon, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface TicketDetailProps {
  ticket: Ticket
  currentUser: User
  isAdmin?: boolean
}

export function TicketDetail({ ticket, currentUser, isAdmin = false }: TicketDetailProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const typeConfig = TICKET_TYPES[ticket.type];
  const statusConfig = TICKET_STATUS[ticket.status];

  const handleStatusChange = async (newStatus: 'completed' | 'closed') => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // 渲染表单数据
  const renderFormData = () => {
    const formData = ticket.form_data as Record<string, unknown>;

    return (
      <div className="space-y-4">
        {Object.entries(formData).map(([key, value]) => {
          // 跳过附件数组
          if (key === 'attachments' || key === 'attachmentUrls') {
            if (Array.isArray(value) && value.length > 0) {
              return (
                <div key={key}>
                  <label className="text-sm font-medium text-muted-foreground">
                    附件
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(value as string[]).map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        {decodeURIComponent(url.split('/').pop() || '附件')}
                      </a>
                    ))}
                  </div>
                </div>
              )
            }
            return null
          }

          // 跳过空值
          if (!value) return null

          // 格式化键名
          const labelMap: Record<string, string> = {
            description: '描述说明',
            reason: '申请原因',
            taxId: '税号',
            enterpriseName: '企业名称',
            contactName: '企业联系人',
            contactPhone: '联系人电话',
            salesName: '销售姓名',
            salesPhone: '销售电话',
          }

          return (
            <div key={key}>
              <label className="text-sm font-medium text-muted-foreground">
                {labelMap[key] || key}
              </label>
              <p className="mt-1">{String(value)}</p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：工单信息 */}
      <div className="lg:col-span-1 space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">工单信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="info">{getTicketTypeName(ticket.type)}</Badge>
              <Badge className={`ml-2 ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">工单标题</p>
              <p className="font-medium">{ticket.title}</p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{ticket.store?.name || '未知门店'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>{ticket.creator?.name || '未知用户'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(ticket.created_at)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <StatusChange className="h-4 w-4 text-muted-foreground" />
              <span>更新时间：{formatDate(ticket.updated_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 表单数据 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              申请内容
            </CardTitle>
          </CardHeader>
          <CardContent>{renderFormData()}</CardContent>
        </Card>

        {/* 管理员操作 */}
        {isAdmin && ticket.status !== 'closed' && ticket.status !== 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">管理操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.status === 'pending' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('processing')}
                  disabled={isUpdating}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  标记为处理中
                </Button>
              )}
              <Button
                variant="default"
                className="w-full"
                onClick={() => handleStatusChange('completed')}
                disabled={isUpdating}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                标记为已完成
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleStatusChange('closed')}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-2" />
                关闭工单
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 右侧：对话区域 */}
      <div className="lg:col-span-2">
        <ChatBox
          ticketId={ticket.id}
          currentUser={currentUser}
        />
      </div>
    </div>
  )
}
