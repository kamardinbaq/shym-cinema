import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthed } from '@/lib/auth'
import { deleteReview } from '@/lib/supabase/cinema'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const id = Number(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 })
  }

  try {
    await deleteReview(id)
    return NextResponse.json({ success: true, message: 'Deleted', data: null })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error deleting review' },
      { status: 500 }
    )
  }
}
