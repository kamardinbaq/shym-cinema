const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // We fetch the current settings first to copy the youtube urls
  const { data: currentSettings } = await supabase.from('settings').select('*');
  
  const getSetting = (key) => currentSettings.find(s => s.key === key)?.value || '';

  const ytUrl = getSetting('youtube_url');
  const ytUrl3 = getSetting('youtube_url_3');

  const updates = [
    { key: 'whatsapp_number', value: '87714278825' },
    { key: 'quest_whatsapp_number', value: '87714278825' },
    { key: 'quest_youtube_url', value: ytUrl }, // Copy from cinema
    { key: 'quest_youtube_url_3', value: ytUrl3 } // Copy from cinema
  ];

  for (const item of updates) {
    if (item.value) { // only update if there's a value
      const { error } = await supabase.from('settings').upsert({ key: item.key, value: item.value }, { onConflict: 'key' });
      if (error) {
        console.error('Error updating', item.key, error);
      } else {
        console.log('Updated', item.key, 'to', item.value);
      }
    }
  }
  
  // Fetch again to verify
  const { data: finalSettings } = await supabase.from('settings').select('*');
  console.log('Final Settings:', finalSettings);
}
run();
