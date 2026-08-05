import { NextResponse, type NextRequest } from 'next/server'
import { getAvailabilityGrid } from '@/lib/supabase/cinema'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || undefined
    const grid = await getAvailabilityGrid(date, 'CINEMA')
    return NextResponse.json({ success: true, data: grid })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error fetching grid' },
      { status: 500 }
    )
  }
}
