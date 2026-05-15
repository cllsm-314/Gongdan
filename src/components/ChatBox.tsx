"use client"

import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { getTicketMessages, sendMessage, subscribeToMessages } from '@/lib/supabase'
import type { TicketMessage, User } from '@/types'
import { Send, Image as ImageIcon, FileText, Upload, RefreshCw } from 'lucide-react'

interface ChatBoxProps {
  ticketId: string
  currentUser: User
  onNewMessage?: (message: TicketMessage) => void
}

export function ChatBox({ ticketId, currentUser, onNewMessage }: ChatBoxProps) {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载消息
  const loadMessages = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getTicketMessages(ticketId)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 订阅实时消息
  useEffect(() => {
    const unsubscribe = subscribeToMessages(ticketId, (message) => {
      setMessages((prev) => [...prev, message])
      onNewMessage?.(message)
    })

    return () => {
      unsubscribe()
    }
  }, [ticketId, onNewMessage])

  // 发送消息
  const handleSend = async () => {
    if ((!newMessage.trim() && attachments.length === 0)) return

    setIsSending(true)
    try {
      let attachmentType: 'text' | 'image' | 'file' = 'text'
      let attachmentUrl = ''

      if (attachments.length > 0) {
        attachmentUrl = attachments[0]
        if (attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          attachmentType = 'image'
        } else {
          attachmentType = 'file'
        }
      }

      const message = await sendMessage({
        ticket_id: ticketId,
        sender_id: currentUser.id,
        content: newMessage.trim(),
        attachment_type: attachmentType,
        attachment_url: attachmentUrl,
      })

      if (message) {
        setNewMessage('')
        setAttachments([])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  // 处理文件上传
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>工单对话</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMessages}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              加载中...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              暂无消息，开始对话吧
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUser.id
              const isAdmin = message.sender?.role === 'admin'

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isOwn ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender?.avatar_url} />
                    <AvatarFallback>
                      {message.sender?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      "max-w-[70%] space-y-1",
                      isOwn ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {!isOwn && (
                        <span className="text-xs font-medium">
                          {message.sender?.name || '未知用户'}
                        </span>
                      )}
                      {isAdmin && !isOwn && (
                        <Badge variant="default" className="text-xs">
                          管理员
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(message.created_at)}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "rounded-lg px-4 py-2",
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.content && (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}

                      {message.attachment_url && (
                        <div className="mt-2">
                          {message.attachment_type === 'image' ? (
                            <a
                              href={message.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <Image
                                src={message.attachment_url}
                                alt="附件图片"
                                className="max-w-full rounded-md hover:opacity-90 transition-opacity"
                              />
                            </a>
                          ) : (
                            <a
                              href={message.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm underline hover:opacity-80"
                            >
                              <FileText className="h-4 w-4" />
                              查看附件
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 已上传的附件预览 */}
        {attachments.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex gap-2 flex-wrap">
              {attachments.map((url, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <Image
                      src={url}
                      alt="预览"
                      className="h-16 w-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded-md">
                      <FileText className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="p-4 border-t space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileUpload}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 w-9 p-0"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Input
              placeholder="输入消息..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
              size="sm"
              className="h-9 px-3"
            >
              <Send className="h-4 w-4 mr-1" />
              发送
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
