import { NextResponse, type NextRequest } from 'next/server'
import { verifyAdminCredentials, createSession, sessionCookieOptions } from '@/lib/auth'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Throttle brute-force: 5 attempts per IP per 15 minutes
  const limit = rateLimit(`admin_login:${clientIp(req)}`, 5, 15 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: 'Слишком много попыток входа. Попробуйте позже.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    )
  }

  const { username, password } = (await req.json().catch(() => ({}))) as {
    username?: string
    password?: string
  }

  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: 'Укажите имя пользователя и пароль.' },
      { status: 400 }
    )
  }

  const admin = await verifyAdminCredentials(username, password)
  if (!admin) {
    return NextResponse.json(
      { success: false, message: 'Неверное имя пользователя или пароль.' },
      { status: 401 }
    )
  }

  const token = await createSession(admin)
  const res = NextResponse.json({
    success: true,
    data: {
      token,
      username: admin.username,
      root: admin.root,
    },
  })

  res.cookies.set(sessionCookieOptions(token))
  return res
}
