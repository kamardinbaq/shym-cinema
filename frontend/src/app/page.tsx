import { getSettings, getAvailabilityGrid, getAllReviews } from '@/lib/supabase/cinema'
import HomePageClient from './HomePageClient'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic';

export default async function Page() {
  const today = format(new Date(), 'yyyy-MM-dd')
  console.log('Server Component Page: fetching data...')
  
  try {
    const settingsPromise = getSettings().catch((e) => { console.error('Settings error:', e); return {} })
    const gridPromise = getAvailabilityGrid(today, 'CINEMA').catch((e) => { console.error('Grid error:', e); return null })
    const reviewsPromise = getAllReviews('CINEMA').catch((e) => { console.error('Reviews error:', e); return [] })
    
    const [settings, initialGrid, initialReviews] = await Promise.all([
      settingsPromise,
      gridPromise,
      reviewsPromise
    ])

    return (
      <HomePageClient 
        initialSettings={settings as any} 
        initialGrid={initialGrid} 
        initialReviews={initialReviews} 
      />
    )
  } catch (error) {
    console.error('Error in Page Component:', error)
    return (
      <HomePageClient 
        initialSettings={{} as any} 
        initialGrid={null} 
        initialReviews={[]} 
      />
    )
  }
}
