import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/supabase/cinema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(
      { success: true, data: settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error fetching settings' },
      { status: 500 }
    )
  }
}
