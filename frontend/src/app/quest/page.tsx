import { getSettings, getAvailabilityGrid, getAllReviews } from '@/lib/supabase/cinema'
import QuestPageClient from './QuestPageClient'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic';

export default async function Page() {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  // Fetch initial data concurrently on the server for the Quest page
  const [settings, initialGrid, initialReviews] = await Promise.all([
    getSettings(),
    getAvailabilityGrid(today, 'QUEST').catch(() => null), // If fails, pass null
    getAllReviews('QUEST').catch(() => [])                 // If fails, pass empty array
  ])

  return (
    <QuestPageClient 
      initialSettings={settings} 
      initialGrid={initialGrid} 
      initialReviews={initialReviews} 
    />
  )
}
