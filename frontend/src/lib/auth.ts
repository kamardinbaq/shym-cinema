import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase/client'

const COOKIE_NAME = 'cinema_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface AdminPayload {
  id: number
  username: string
  root: boolean
}

function secret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET
  if (!s || s.length < 16) {
    throw new Error('ADMIN_JWT_SECRET env var is missing or too short (min 16 chars).')
  }
  return new TextEncoder().encode(s)
}

/** Check database for user; auto-seed root admin if database admins table is empty */
export async function verifyAdminCredentials(username: string, password: string): Promise<AdminPayload | null> {
  const supabase = supabaseAdmin()

  // 1. Check if admins table has any users; if empty, seed root admin from env
  const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true })
  if (count === 0) {
    const rootUser = process.env.ROOT_ADMIN_USERNAME || 'admin'
    const rootPass = process.env.ROOT_ADMIN_PASSWORD || 'admin'
    const hashed = await bcrypt.hash(rootPass, 10)
    await supabase.from('admins').insert({
      username: rootUser,
      password: hashed,
      is_root: true,
    })
  }

  // 2. Fetch admin user
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (error || !data) return null

  const match = await bcrypt.compare(password, data.password)
  if (!match) return null

  return {
    id: Number(data.id),
    username: data.username,
    root: Boolean(data.is_root),
  }
}

export async function createSession(admin: AdminPayload): Promise<string> {
  return new SignJWT({ id: admin.id, username: admin.username, root: admin.root })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function getAdminFromSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, secret())
    return {
      id: payload.id as number,
      username: payload.username as string,
      root: Boolean(payload.root),
    }
  } catch {
    return null
  }
}

export async function isAdminAuthed(): Promise<boolean> {
  const admin = await getAdminFromSession()
  return admin !== null
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  }
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}
