import { NextResponse, type NextRequest } from 'next/server'
import { getAdminFromSession } from '@/lib/auth'
import { getAllAdmins, createAdmin } from '@/lib/supabase/cinema'

export async function GET() {
  const currentAdmin = await getAdminFromSession()
  if (!currentAdmin || !currentAdmin.root) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  try {
    const admins = await getAllAdmins()
    return NextResponse.json({ success: true, data: admins })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error fetching admins' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const currentAdmin = await getAdminFromSession()
  if (!currentAdmin || !currentAdmin.root) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password required' },
        { status: 400 }
      )
    }
    const admin = await createAdmin(username, password)
    return NextResponse.json({ success: true, data: admin }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error creating admin' },
      { status: 500 }
    )
  }
}
