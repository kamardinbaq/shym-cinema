import { NextResponse, type NextRequest } from 'next/server'
import { getAdminFromSession } from '@/lib/auth'
import { deleteAdmin } from '@/lib/supabase/cinema'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentAdmin = await getAdminFromSession()
  if (!currentAdmin || !currentAdmin.root) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const id = Number(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 })
  }

  try {
    await deleteAdmin(id, currentAdmin.username)
    return NextResponse.json({ success: true, message: 'Deleted', data: null })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error deleting admin' },
      { status: 500 }
    )
  }
}
