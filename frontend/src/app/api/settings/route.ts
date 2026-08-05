import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/supabase/cinema'

export const revalidate = 60

export async function GET() {
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
