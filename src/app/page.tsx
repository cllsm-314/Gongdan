import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, isLoggedIn, isAdmin } from '@/lib/auth'
import { Header } from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TICKET_TYPES } from '@/types'
import { getUser } from '@/lib/supabase'
import {
  DoorOpen,
  BadgeDollarSign,
  CreditCard,
  ListChecks,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  'door-open': <DoorOpen className="h-8 w-8" />,
  'badge-yen': <BadgeDollarSign className="h-8 w-8" />,
  'credit-card': <CreditCard className="h-8 w-8" />,
  'list-checks': <ListChecks className="h-8 w-8" />,
}

const colorMap: Record<string, string> = {
  switch_room: 'bg-blue-500/10 text-blue-600 border-blue-200',
  price_adjustment: 'bg-green-500/10 text-green-600 border-green-200',
  enterprise_card: 'bg-purple-500/10 text-purple-600 border-purple-200',
  whitelist: 'bg-orange-500/10 text-orange-600 border-orange-200',
}

export default async function HomePage() {
  const loggedIn = await isLoggedIn()
  
  if (!loggedIn) {
    redirect('/login')
  }

  const admin = await isAdmin()
  
  if (admin) {
    redirect('/admin')
  }

  const session = await getSession()
  const user = session.userId ? await getUser(session.userId) : null

  if (!user) {
    redirect('/login')
  }

  // 如果用户没有绑定门店，显示绑定页面提示
  const needsStoreBinding = !user.store_id

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header user={user} isAdmin={false} />
      
      <main className="container px-4 py-8 mx-auto">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">欢迎使用门店工单系统</h1>
            <Badge variant="secondary">德胧集团</Badge>
          </div>
          <p className="text-muted-foreground">
            您好，{user.name}！请选择您需要提交的工单类型。
          </p>
        </div>

        {/* 需要绑定门店提示 */}
        {needsStoreBinding && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-orange-800">请先绑定您的门店</p>
                  <p className="text-sm text-orange-600">
                    请联系管理员为您分配门店权限，分配后即可提交工单。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 工单类型卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(TICKET_TYPES).map((type) => (
            <Link
              key={type.type}
              href={needsStoreBinding ? '#' : `/ticket/new?type=${type.type}`}
              className={`block ${needsStoreBinding ? 'pointer-events-none opacity-60' : ''}`}
            >
              <Card className={`h-full transition-all hover:shadow-lg hover:-translate-y-1 border-2 ${colorMap[type.type]}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${colorMap[type.type].replace('border-2', '').replace('text-', 'bg-').replace('-600', '-500/20').replace('-500', '-500/20')}`}>
                      {iconMap[type.icon]}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-4">{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    点击进入填写工单表单
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>如有疑问，请联系管理员：张春雷 / 门店总经理</p>
        </div>
      </main>
    </div>
  )
}
