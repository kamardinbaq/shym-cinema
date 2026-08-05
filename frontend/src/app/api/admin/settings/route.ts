import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthed } from '@/lib/auth'
import { getSettings, updateSettings } from '@/lib/supabase/cinema'

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settings = await getSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error fetching settings' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updates = await req.json()
    await updateSettings(updates)
    return NextResponse.json({ success: true, message: 'Saved', data: null })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error updating settings' },
      { status: 500 }
    )
  }
}
