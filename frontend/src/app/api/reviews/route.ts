import { NextResponse, type NextRequest } from 'next/server'
import { getAllReviews, createReview } from '@/lib/supabase/cinema'

export const revalidate = 60

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const venue = searchParams.get('venue') || 'CINEMA'
    const reviews = await getAllReviews(venue)
    return NextResponse.json({ success: true, data: reviews })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error fetching reviews' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.body || typeof body.stars !== 'number') {
      return NextResponse.json({ success: false, message: 'Review body and stars rating are required.' }, { status: 400 })
    }
    const review = await createReview({
      name: body.name,
      stars: body.stars,
      body: body.body,
      venue: body.venue,
    })
    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error creating review' },
      { status: 500 }
    )
  }
}
