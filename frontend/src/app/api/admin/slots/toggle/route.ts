import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthed } from '@/lib/auth'
import { toggleSlot } from '@/lib/supabase/cinema'

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const timeSlotIdStr = searchParams.get('timeSlotId')
  const date = searchParams.get('date')

  if (!timeSlotIdStr || !date) {
    return NextResponse.json(
      { success: false, message: 'timeSlotId and date parameters are required' },
      { status: 400 }
    )
  }

  try {
    const nowReserved = await toggleSlot(Number(timeSlotIdStr), date)
    return NextResponse.json({
      success: true,
      message: nowReserved ? 'Reserved' : 'Available',
      data: nowReserved,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error toggling slot' },
      { status: 500 }
    )
  }
}
