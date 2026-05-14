import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 合并 Tailwind 类名
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化相对时间
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}天前`
  }
  if (hours > 0) {
    return `${hours}小时前`
  }
  if (minutes > 0) {
    return `${minutes}分钟前`
  }
  return '刚刚'
}

// 校验税号格式
export function validateTaxId(taxId: string): boolean {
  // 税号不能以9或1开头
  if (!taxId || taxId.length < 15) {
    return false
  }
  const firstChar = taxId.charAt(0)
  if (firstChar === '9' || firstChar === '1') {
    return false
  }
  return /^\d{15,20}$/.test(taxId)
}

// 校验手机号格式
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

// 获取工单类型中文名
export function getTicketTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    switch_room: '开关房申请',
    price_adjustment: '调价申请',
    enterprise_card: '企业卡创建',
    whitelist: '企业白名单录入',
  }
  return typeMap[type] || type
}

// 获取状态中文名
export function getStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    closed: '已关闭',
  }
  return statusMap[status] || status
}
