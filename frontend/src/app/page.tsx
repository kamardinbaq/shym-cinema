import { getSettings, getAvailabilityGrid, getAllReviews } from '@/lib/supabase/cinema'
import HomePageClient from './HomePageClient'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic';

export default async function Page() {
  const today = format(new Date(), 'yyyy-MM-dd')
  console.log('Server Component Page: fetching data...')
  
  try {
    const settingsPromise = getSettings()
    const gridPromise = getAvailabilityGrid(today, 'CINEMA')
    const reviewsPromise = getAllReviews('CINEMA')
    
    console.log('Promises created')
    const [settings, initialGrid, initialReviews] = await Promise.all([
      settingsPromise,
      gridPromise.catch((e) => { console.error('Grid error:', e); return null }),
      reviewsPromise.catch((e) => { console.error('Reviews error:', e); return [] })
    ])
    console.log('Promises resolved')

    return (
      <HomePageClient 
        initialSettings={settings as any} 
        initialGrid={initialGrid} 
        initialReviews={initialReviews} 
      />
    )
  } catch (error) {
    console.error('Error in Page Component:', error)
    return <div>Error loading page</div>
  }
}
