const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((a, l) => {
    const [k, ...v] = l.split('=');
    if (k) a[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
    return a;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('exclusive_movies').select('*').eq('id', '3b496a32-3cce-43bd-87f7-efb9e47c6d3a').then(r => console.log(r));
