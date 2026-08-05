const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { error } = await supabase.from('admins').delete().eq('username', 'admin');
  if (error) console.error(error);
  else console.log('Deleted the temporary admin user!');
}
run();
