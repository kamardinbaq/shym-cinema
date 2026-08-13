import { getSettings, getAvailabilityGrid, getAllReviews } from '@/lib/supabase/cinema'
import QuestPageClient from './QuestPageClient'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic';

export default async function Page() {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  // Fetch initial data concurrently on the server for the Quest page
  try {
    const [settings, initialGrid, initialReviews] = await Promise.all([
      getSettings().catch(() => ({})),
      getAvailabilityGrid(today, 'QUEST').catch(() => null), // If fails, pass null
      getAllReviews('QUEST').catch(() => [])                 // If fails, pass empty array
    ])

    return (
      <QuestPageClient 
        initialSettings={settings as any} 
        initialGrid={initialGrid} 
        initialReviews={initialReviews} 
      />
    )
  } catch (error) {
    console.error('Error in Quest Page Component:', error)
    return (
      <QuestPageClient 
        initialSettings={{} as any} 
        initialGrid={null} 
        initialReviews={[]} 
      />
    )
  }
}
