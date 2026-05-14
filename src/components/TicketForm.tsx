"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TICKET_TYPES, type TicketType } from '@/types'
import { validateTaxId, validatePhone } from '@/lib/utils'
import { Upload, X, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react'

interface TicketFormProps {
  ticketType: TicketType
  storeId: string
  userId: string
}

export function TicketForm({ ticketType, storeId, userId }: TicketFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])

  // 表单数据状态
  const [description, setDescription] = useState('')
  const [reason, setReason] = useState('')
  const [taxId, setTaxId] = useState('')
  const [enterpriseName, setEnterpriseName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [salesName, setSalesName] = useState('')
  const [salesPhone, setSalesPhone] = useState('')

  const config = TICKET_TYPES[ticketType]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      let formData: Record<string, unknown> = { attachments }

      // 根据类型构建表单数据
      switch (ticketType) {
        case 'switch_room':
          formData = { ...formData, description, reason }
          break
        case 'price_adjustment':
          formData = { ...formData, description, reason }
          break
        case 'enterprise_card':
          // 校验税号
          if (!validateTaxId(taxId)) {
            setError('税号不能为空，且不能以9或1开头，长度需在15-20位')
            setIsSubmitting(false)
            return
          }
          if (!validatePhone(contactPhone)) {
            setError('请输入正确的企业联系人手机号')
            setIsSubmitting(false)
            return
          }
          if (!validatePhone(salesPhone)) {
            setError('请输入正确的销售手机号')
            setIsSubmitting(false)
            return
          }
          formData = { ...formData, taxId, enterpriseName, contactName, contactPhone, salesName, salesPhone, description }
          break
        case 'whitelist':
          if (!enterpriseName.trim()) {
            setError('请输入企业全称')
            setIsSubmitting(false)
            return
          }
          formData = { ...formData, enterpriseName, description }
          break
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: ticketType,
          store_id: storeId,
          created_by: userId,
          title: generateTitle(),
          form_data: formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '提交失败')
      }

      router.push('/ticket/my')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateTitle = () => {
    const now = new Date()
    const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`

    switch (ticketType) {
      case 'switch_room':
        return `开关房申请 - ${dateStr} ${timeStr}`
      case 'price_adjustment':
        return `调价申请 - ${dateStr} ${timeStr}`
      case 'enterprise_card':
        return `企业卡创建 - ${enterpriseName || dateStr} ${timeStr}`
      case 'whitelist':
        return `企业白名单录入 - ${enterpriseName || dateStr} ${timeStr}`
      default:
        return `工单申请 - ${dateStr} ${timeStr}`
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: string[] = []

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          newAttachments.push(data.url)
        }
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }

    setAttachments([...attachments, ...newAttachments])
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge variant="info">{config.title}</Badge>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* 开关房申请 / 调价申请 */}
          {(ticketType === 'switch_room' || ticketType === 'price_adjustment') && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">申请原因</label>
                <Textarea
                  placeholder="请详细描述申请原因及需求..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </>
          )}

          {/* 企业卡创建 */}
          {ticketType === 'enterprise_card' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">税号 <span className="text-red-500">*</span></label>
                <Input
                  placeholder="请输入企业税号（15-20位，不能以9或1开头）"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  税号不能以9或1开头，长度需在15-20位
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">企业名称 <span className="text-red-500">*</span></label>
                <Input
                  placeholder="请输入企业全称"
                  value={enterpriseName}
                  onChange={(e) => setEnterpriseName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">企业联系人姓名 <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="联系人姓名"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">企业联系人电话 <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="11位手机号"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">销售姓名 <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="销售姓名"
                    value={salesName}
                    onChange={(e) => setSalesName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">销售电话 <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="11位手机号"
                    value={salesPhone}
                    onChange={(e) => setSalesPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">其他说明</label>
                <Textarea
                  placeholder="如有其他补充说明，请在此填写..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* 企业白名单录入 */}
          {ticketType === 'whitelist' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">企业全称 <span className="text-red-500">*</span></label>
                <Input
                  placeholder="请输入企业全称"
                  value={enterpriseName}
                  onChange={(e) => setEnterpriseName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">补充说明</label>
                <Textarea
                  placeholder="如有其他补充信息，请在此填写..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* 附件上传 - 所有类型都需要 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">附件上传</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-500">
                  点击上传图片、PDF、Word、Excel文件
                </span>
                <span className="text-xs text-gray-400">
                  支持多文件上传
                </span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">已上传附件：</p>
                <div className="grid grid-cols-2 gap-2">
                  {attachments.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <ImageIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm truncate">
                          {decodeURIComponent(url.split('/').pop() || '附件')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '提交工单'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
