import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nskgkpfmvbmtmnxlbnjb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za2drcGZtdmJtdG1ueGxibmpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM3MjA3MCwiZXhwIjoyMDkwOTQ4MDcwfQ.RuzNpZQZvkUf_gV_Sxc5x9AIandfZoxMWDQV-nck6Yw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('exclusive_episodes')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}
check();
