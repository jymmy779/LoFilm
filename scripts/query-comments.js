const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function findDuplicates() {
    // 1. Read and parse .env.local
    const envPath = path.join(__dirname, '../.env.local');
    let supabaseUrl = '';
    let supabaseServiceKey = '';

    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
                supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
            }
            if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
                supabaseServiceKey = line.split('=')[1].trim().replace(/['"]/g, '');
            }
        }
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase config!");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch ALL comments to analyze duplicates
    const { data: comments, error } = await supabase
        .from('comments')
        .select('id, user_name, content, movie_slug');

    if (error) {
        console.error("Error fetching comments:", error.message);
        return;
    }

    // Group by content
    const groups = {};
    comments.forEach(c => {
        const content = c.content.trim();
        if (!groups[content]) {
            groups[content] = [];
        }
        groups[content].push(c);
    });

    // Filter duplicates (count > 1)
    const duplicates = Object.entries(groups)
        .filter(([content, list]) => list.length > 1)
        .sort((a, b) => b[1].length - a[1].length);

    console.log(`\n🔍 DETECTED DUPLICATE COMMENTS IN DATABASE:`);
    console.log(`Total unique comment contents: ${Object.keys(groups).length}`);
    console.log(`Total duplicate groups: ${duplicates.length}`);
    console.log(`--------------------------------------------------------------------------------`);
    
    // Print top 15 duplicate groups
    duplicates.slice(0, 15).forEach(([content, list], idx) => {
        console.log(`[Group ${idx + 1}] "${content}" (Repeated ${list.length} times)`);
        console.log(`   Sample users: ${list.slice(0, 5).map(x => `${x.user_name} (${x.movie_slug})`).join(', ')}`);
    });
    console.log(`--------------------------------------------------------------------------------\n`);
}

findDuplicates();
