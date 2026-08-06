const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Fetching data from Supabase... (this might take up to 30 seconds due to cold start)');
  
  const tables = ['rooms', 'time_slots', 'slot_reservations', 'settings', 'reviews', 'admins'];
  const db = {};

  for (const table of tables) {
    console.log(`Fetching ${table}...`);
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      db[table] = [];
    } else {
      db[table] = data;
      console.log(`Fetched ${data.length} rows for ${table}.`);
    }
  }

  fs.writeFileSync('.local-db.json', JSON.stringify(db, null, 2));
  console.log('Successfully saved to .local-db.json');
}

main().catch(console.error);
