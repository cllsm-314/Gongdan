"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ticket, QrCode, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const redirectTo = searchParams.get('redirect') || '/'

  const handleFeishuLogin = () => {
    setIsLoading(true)
    
    // 跳转到飞书授权页面
    window.location.href = '/api/auth/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-primary rounded-2xl mb-4">
            <Ticket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">门店工单系统</h1>
          <p className="text-muted-foreground mt-1">德胧集团</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>登录</CardTitle>
            <CardDescription>
              使用飞书账号登录系统
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 飞书登录按钮 */}
            <Button
              onClick={handleFeishuLogin}
              disabled={isLoading}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isLoading ? (
                <span className="animate-pulse">跳转中...</span>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.25 3.25a4.008 4.008 0 0 1 3.5 3.5l-3.5 3.5 1.75 1.75-4.25 4.25-1.75-1.75-5.5 5.5a4.008 4.008 0 0 1-5.5-5.5l5.5-5.5-1.75-1.75-4.25 4.25 1.75 1.75 3.5-3.5a4.008 4.008 0 0 1 5.5-5.5l1.75 1.75 1.75-1.75 3.5 3.5a4.008 4.008 0 0 1 0 5.5l-3.5 3.5-3.5-3.5a2.006 2.006 0 0 0-2.75 0l-3.5 3.5a2.006 2.006 0 0 0 0 2.75l5.5 5.5a2.006 2.006 0 0 0 2.75 0l3.5-3.5 3.5 3.5a2.006 2.006 0 0 0 2.75 0l1.75-1.75 1.75 1.75a2.006 2.006 0 0 0 2.75 0l3.5-3.5a4.008 4.008 0 0 0 0-5.5l-3.5-3.5 1.75-1.75 3.5 3.5a4.008 4.008 0 0 0 5.5 0l1.75-1.75a2.006 2.006 0 0 0 0-2.75l-3.5-3.5 1.75-1.75 3.5 3.5a4.008 4.008 0 0 0 0-5.5l-3.5-3.5 1.75-1.75a2.006 2.006 0 0 0 0-2.75l-3.5-3.5a4.008 4.008 0 0 0-5.5 0l-1.75 1.75z"/>
                  </svg>
                  使用飞书登录
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  安全提示
                </span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground text-center space-y-2">
              <p>• 系统使用飞书 OAuth2.0 安全认证</p>
              <p>• 仅获取您的基本身份信息</p>
              <p>• 您的数据将严格保密</p>
            </div>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>如有登录问题，请联系管理员</p>
        </div>
      </div>
    </div>
  )
}
