import { NextResponse } from 'next/server'
import { getSession, sessionOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const { getIronSession } = await import('iron-session')
    const session = await getIronSession(cookieStore, sessionOptions)
    
    session.destroy()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: false, error: 'Logout failed' })
  }
}
