const { createClient } = require('@supabase/supabase-js');

// OLD Supabase
const oldUrl = 'https://ibyxofocasxuqkvdvbgr.supabase.co';
const oldServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlieXhvZm9jYXN4dXdrdmRidmdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1MDUxMiwiZXhwIjoyMDk1NzI2NTEyfQ.wG0rR2rrbFf_IF146hrzca3RBGD4D_iL786nKnW47ks';
const oldSupabase = createClient(oldUrl, oldServiceKey);

// NEW Supabase (from .env.local)
const newUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const newServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const newSupabase = createClient(newUrl, newServiceKey);

async function migrate() {
  console.log('Fetching settings from old Supabase...');
  const { data: oldSettings, error: fetchError } = await oldSupabase.from('settings').select('*');
  
  if (fetchError) {
    console.error('Error fetching old settings:', fetchError);
    return;
  }
  
  console.log(`Found ${oldSettings.length} settings in old Supabase.`);
  console.log(oldSettings);

  if (oldSettings && oldSettings.length > 0) {
    console.log('\nMigrating to new Supabase...');
    for (const item of oldSettings) {
      const { error: upsertError } = await newSupabase
        .from('settings')
        .upsert({ key: item.key, value: item.value }, { onConflict: 'key' });
        
      if (upsertError) {
        console.error(`Failed to upsert key '${item.key}':`, upsertError);
      } else {
        console.log(`Successfully migrated '${item.key}' -> '${item.value}'`);
      }
    }
    console.log('Migration complete!');
  } else {
    console.log('No settings found to migrate.');
  }
}

migrate();
