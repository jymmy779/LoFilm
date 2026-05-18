/**
 * DYNAMIC AND SPECIFIC INTERACTIONS SEED SCRIPT FOR LOFILM
 * 
 * This script searches and resolves exact movie slugs from the API dynamically,
 * then seeds comments (general & episode-specific) in GenZ style,
 * along with comment reactions, movie likes/dislikes, and user favorites.
 * 
 * Usage:
 *   node scripts/seed-specific.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read and parse .env.local
const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseServiceKey = '';

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            const matchUrl = line.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\r\n]+)["']?/);
            const matchService = line.match(/^SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\r\n]+)["']?/);
            if (matchUrl) supabaseUrl = matchUrl[1];
            if (matchService) supabaseServiceKey = matchService[1];
        }
    }
} catch (e) {
    console.error("❌ Failed to read .env.local:", e.message);
    process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase URL or Service Role Key in .env.local!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Specific requested movies to seed
const REQUESTED_MOVIES = [
    "lương tâm bất nghi",
    "tình yêu như tuyết trên đỉnh thiên sơn",
    "khổng tước mang giáo vàng",
    "nhịp đập tình yêu",
    "the boys phần 5",
    "gió thoảng tình theo",
    "tình yêu không có cổ tích",
    "enemies with benefits",
    "nữ chủ Kanan",
    "yêu thầy bằng cả thế giới",
    "dũng sĩ cặn bã",
    "còn ra thể thống gì nữa",
    "yêu được chưa",
    "huyền thoại lính bếp",
    "gọi dad đi tharn",
    "rể ngốc 2",
    "only friends"
];

// Rich virtual profiles for seeders
const VIRTUAL_PROFILES = [
    { name: "Khánh Vy 🍓", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Vy" },
    { name: "Bảo Lâm Nguyễn", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lam" },
    { name: "Ngọc Hà", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Ha" },
    { name: "Tuấn Đạt (Mê Phim)", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Dat" },
    { name: "Thanh Hằng 🌸", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Hang" },
    { name: "Minh Trí 🍿", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Tri" },
    { name: "Duy Mạnh Lê", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Manh" },
    { name: "Hồng Nhung", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Nhung" },
    { name: "Thế Anh Pro", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Anh" },
    { name: "Phương Thảo Ciu", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Thao" },
    { name: "Hoàng Nam", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Nam" },
    { name: "Thu Trang Ng", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Trang" },
    { name: "Quốc Bảo", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Bao" },
    { name: "Mai Anh 🍉", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Mai" },
    { name: "Thùy Chi", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Chi" },
    { name: "connhocutii★･ﾟ", avatar: "https://i.pravatar.cc/150?u=9" },
    { name: "Ma xó thế hệ 4.0", avatar: "https://i.pravatar.cc/150?u=10" },
    { name: "Má Hai Rổ Phim", avatar: "https://i.pravatar.cc/150?u=11" },
    { name: "Gu Má Lúm", avatar: "https://i.pravatar.cc/150?u=12" },
    { name: "Phong Nguyễn", avatar: "https://i.pravatar.cc/150?u=13" },
    { name: "Mọt Phim Hàn Quốc", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Korean" },
    { name: "Thánh Cày Phim Đêm", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Night" },
    { name: "Reviewer Dạo 🎬", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Review" },
    { name: "Cô Bé Bán Diêm 4.0", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Match" },
    { name: "Boy Bánh Bèo", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=BanhBeo" },
    { name: "Mỹ Nhân Ngư", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Mermaid" },
    { name: "Chỉ Xem Phim Thuyết Minh", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Voice" },
    { name: "Linh KuTe 9x", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=LinhKute" },
    { name: "Anh Hải Đẹp Trai", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=HaiDepTrai" },
    { name: "Hội Những Người Cuồng Cổ Trang", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Ancient" },
    { name: "Tâm Hồn Ăn Uống 🥤", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Foodie" },
    { name: "Bé Út Nhà Bên", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Ut" },
    { name: "Đại Ca Mê Kịch Bản", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Script" },
    { name: "Thiếu Gia Ngủ Ngày", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sleepy" },
    { name: "Chuyên Gia Đẩy Thuyền", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Ship" },
    { name: "Tiểu Long Nữ", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Dragon" },
    { name: "Dương Quá thời nay", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Yang" },
    { name: "Trùm Spoil Phim ⚠️", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Spoiler" },
    { name: "Thị Nở thời hiện đại", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=No" },
    { name: "Chí Phèo Xem Phim", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Pheo" },
    { name: "Học Bá Mê Phim 💯", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Smart" },
    { name: "Nấm Lùn Ciu Ciu", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=NamLun" },
    { name: "Thảo Vy Vy", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=ThaoVy" },
    { name: "Hoài Nam Đẹp Zai", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=HoaiNam" },
    { name: "Kẻ Cô Đơn Xem Phim ☕", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lonely" }
];

// Curated GenZ style comments with slang and typos (Threads vibe)
const GENZ_COMMENTS_POOL = {
    general: [
        "phim cuốn vch thề lun á",
        "mê nhan sắc dàn cast thực sự, đẹp xỉu up xỉu down",
        "coi giải trí cuối tuần bao phê nha",
        "vibe phim đỉnh chóp ghê á chời",
        "art với màu phim đẹp xuất sắc lunnn",
        "xứng đáng 10/10 nha quý dị, recommend cực mạnh",
        "mới coi mà dính ngang ngược dị á :)))",
        "phim này hay xĩu trùi ưiiii",
        "kịch bản bánh cuốn quá, ko uổng công chờ đợi",
        "chemistry đỉnh vcl, xem mà muốn iu lun á",
        "coi cuốn lắm lun á cả nhà",
        "nét vẽ/gốc quay xịn đét lun",
        "thích cái vibe phim này ghê á trùi",
        "chấm 5 sao ko nói nhiều nha",
        "ôi coi phim này cuốn quá làm bỏ bê cả công việc :v",
        "mê từ cái nhìn đầu tiên lun á chời",
        "nhạc phim đỉnh thực sự nghe cuốn vcl",
        "chờ mãi mới có phim chất lượng thế này",
        "coi xong lụy luôn á chời ui"
    ],
    korea: [
        "phim Hàn xẻng hồi giờ vẫn đỉnh đét",
        "oppa ngầu lòi xỉu lên xỉu xuống cứu tuiii",
        "chemistry cưng xĩu, đẩy thuyền gấp nha mn",
        "nam chính đẹp trai muốn xỉu á chời",
        "đúng gu tui lun, coi mà quéo hết cả giò :)))",
        "coi phim Hàn mà muốn có bồ ghê á",
        "nữ chính dễ thương xỉu, đóng tự nhiên vch",
        "cặp này ngọt ngào sâu răng lun chời ơi",
        "ôi diễn xuất đỉnh vãi, chạm tới cảm xúc lun"
    ],
    china: [
        "tạo hình cổ trang cưng xĩu á trùi",
        "nam chính nuốt trọn visual lun, đẹp trai vcl",
        "ngọt sâu răng lun chời ơi, chemistry đỉnh chóp",
        "coi phim cổ trang Trung Quốc bộ này là xịn nhất năm nay",
        "mê tạo hình của nữ chính ghê, xinh xỉu",
        "kịch bản hay, diễn xuất tự nhiên ko bị sượng trân",
        "phim này coi bánh cuốn dã man, đẩy thuyền nhiệt tình",
        "ôi lọt hố bộ này rồi cứu tuiii"
    ],
    horror: [
        "má ơi coi ban đêm sợ qué giật cả mình",
        "phim kinh dị gì coi giật gân vcl, tim đập thịch thịch",
        "jump scare đỉnh chóp lun chời, rớt cái tim ra ngoài",
        "sợ ma mà vẫn ham hố coi, coi xong ko dám đi vệ sinh lun :v",
        "phim này vibe rùng rợn dã man, đỉnh thực sự",
        "nhìn tạo hình ma quỷ ghê xỉu, coi hồi hộp vãi",
        "phim kinh dị chất lượng nhất dạo gần đây, phê đét"
    ],
    episode: [
        "ủa tập này cuốn thế chời ơi",
        "hết nhanh dị mới đó hết tập rùi",
        "hóng tập sau ghê lun á ad bão tập đi năn nỉ á",
        "nhân vật này đáng thương ghê á trùi",
        "uây twist tập này sốc ngang lun á",
        "tập này ngọt ngào sâu răng cưng xỉu",
        "chờ mỏi mòn mới ra tập mới coi phê vch",
        "tập này lấy nước mắt ghê, khóc mệt lun",
        "ôi tập này kịch tính dã man coi hồi hộp xỉu",
        "ad ơi cập nhật tập mới nhanh nha hóng qué"
    ]
};

// Helper: Get random date in past 7 days
function getRandomPastDate() {
    const now = new Date();
    const daysAgo = Math.random() * 7;
    const hoursAgo = Math.random() * 24;
    const minutesAgo = Math.random() * 60;
    
    now.setDate(now.getDate() - daysAgo);
    now.setHours(now.getHours() - hoursAgo);
    now.setMinutes(now.getMinutes() - minutesAgo);
    
    return now.toISOString();
}

// Helper: Sleep delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Search and resolve movie slug by keyword dynamically
async function resolveMovieBySearch(keyword, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🔍 Searching dynamically for: "${keyword}"...`);
            const searchUrl = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=5`;
            const response = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            const data = await response.json();
            let items = [];
            if (data.items) items = data.items;
            else if (data.data && data.data.items) items = data.data.items;
            
            if (items.length === 0) {
                console.warn(`   ⚠️ Warning: No movies found matching "${keyword}"`);
                return null;
            }
            
            // Take the first match
            const bestMatch = items[0];
            console.log(`   ✅ Resolved: "${bestMatch.name}" (Slug: ${bestMatch.slug})`);
            return bestMatch.slug;
        } catch (e) {
            console.warn(`   ⚠️ Warning: Search failed for "${keyword}" (Attempt ${i + 1}/${retries}):`, e.message);
            if (i < retries - 1) await sleep(1000);
        }
    }
    return null;
}

// Helper: Check if movie is watchable and retrieve episodes with retries
async function fetchMovieDetails(slug, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`https://phimapi.com/phim/${slug}`, { signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            const data = await response.json();
            if (!data || !data.movie) return null;
            
            // Skip trailers
            if (data.movie.status === 'trailer' || data.movie.episode_current === 'Trailer') {
                return null;
            }
            
            if (!data.episodes || data.episodes.length === 0) return null;
            
            let episodeSlugs = [];
            for (const server of data.episodes) {
                if (server.server_data && server.server_data.length > 0) {
                    const active = server.server_data.filter(ep => ep.link_m3u8 || ep.link_embed);
                    if (active.length > 0) {
                        episodeSlugs = active.map(ep => ep.slug).filter(Boolean);
                        break;
                    }
                }
            }
            
            if (episodeSlugs.length === 0) return null;

            // Determine if completed (Hoàn thành / Full)
            const status = data.movie.status;
            const cur = (data.movie.episode_current || "").toLowerCase();
            const tot = (data.movie.episode_total || "").toLowerCase();
            
            let isCompleted = status === 'completed' || cur.includes("full") || cur.includes("hoàn tất");
            const matchSlash = cur.match(/(\d+)\/(\d+)/);
            if (matchSlash && matchSlash[1] === matchSlash[2]) {
                isCompleted = true;
            }
            
            const curNumMatch = cur.match(/\d+/);
            const totNumMatch = tot.match(/\d+/);
            if (curNumMatch && totNumMatch) {
                const curNum = parseInt(curNumMatch[0]);
                const totNum = parseInt(totNumMatch[0]);
                if (curNum >= totNum && totNum > 0) {
                    isCompleted = true;
                }
            }
            
            // Deduce category type based on genres
            let categoryType = 'general';
            const genres = (data.movie.category || []).map(c => c.name.toLowerCase());
            if (genres.includes('hàn quốc') || genres.includes('korea')) categoryType = 'korea';
            else if (genres.includes('trung quốc') || genres.includes('china')) categoryType = 'china';
            else if (genres.includes('kinh dị') || genres.includes('horror')) categoryType = 'horror';
            
            return {
                slug: data.movie.slug,
                name: data.movie.name,
                thumb: data.movie.thumb_url || data.movie.poster_url || '',
                episodes: episodeSlugs,
                isCompleted: isCompleted,
                categoryType: categoryType
            };
        } catch (e) {
            console.warn(`⚠️ Warning: Failed to fetch details for ${slug} (Attempt ${i + 1}/${retries}):`, e.message);
            if (i < retries - 1) {
                await sleep(500); // Wait 500ms before retrying
            }
        }
    }
    return null;
}

// Main seeding executor
async function seedSpecificMovies() {
    console.log("👤 Loading valid system users...");
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError || !userData || !userData.users || userData.users.length === 0) {
        console.error("❌ Failed to load users. Please verify SUPABASE_SERVICE_ROLE_KEY!");
        if (userError) console.error("Error details:", userError.message);
        process.exit(1);
    }
    
    const validUserIds = userData.users.map(u => u.id);
    console.log(`👤 Successfully loaded ${validUserIds.length} valid system users.\n`);

    console.log(`🎬 Resolving requested specific movies (${REQUESTED_MOVIES.length} items)...`);
    const selectedMovies = [];
    
    for (const name of REQUESTED_MOVIES) {
        const slug = await resolveMovieBySearch(name);
        if (slug) {
            await sleep(200); // Small pause to prevent rate limit
            const detail = await fetchMovieDetails(slug);
            if (detail) {
                selectedMovies.push(detail);
                console.log(`   ✨ Watchable episodes loaded: ${detail.episodes.length} episodes. Completed (HT): ${detail.isCompleted}`);
            } else {
                console.warn(`   ⚠️ Warning: Movie "${name}" has no watchable episodes in API.`);
            }
        }
        await sleep(300); // Pause between movies
    }

    if (selectedMovies.length === 0) {
        console.error("❌ Failed to resolve any watchable movies from the list!");
        process.exit(1);
    }

    console.log(`\n📊 Total movies successfully resolved for seeding: ${selectedMovies.length}`);
    
    // =========================================================================
    // CLEANUP STAGE: Clear previous virtual interactions to start fresh & avoid duplicates
    // =========================================================================
    console.log("🧹 Cleaning up previous virtual interactions to start fresh...");
    
    const virtualNames = VIRTUAL_PROFILES.map(p => p.name);
    
    // Fetch previously seeded comments for the selected names in batches of 10
    let commentsToCleanup = [];
    const batchSize = 10;
    for (let i = 0; i < virtualNames.length; i += batchSize) {
        const batch = virtualNames.slice(i, i + batchSize);
        const { data, error } = await supabase
            .from('comments')
            .select('id')
            .in('user_name', batch);
            
        if (error) {
            console.warn(`   ⚠️ Warning: Failed to fetch previous comments for cleanup batch ${i / batchSize + 1}:`, error.message);
        } else if (data) {
            commentsToCleanup = commentsToCleanup.concat(data);
        }
    }
        
    if (commentsToCleanup.length > 0) {
        const commentIds = commentsToCleanup.map(c => c.id);
        console.log(`   🧹 Found ${commentIds.length} previous comments to delete. Processing in batches...`);
        
        // A. Delete reactions of virtual comments in batches of 50
        const batchSize50 = 50;
        let deletedRx = 0;
        for (let i = 0; i < commentIds.length; i += batchSize50) {
            const batchIds = commentIds.slice(i, i + batchSize50);
            const { error } = await supabase
                .from('comment_reactions')
                .delete()
                .in('comment_id', batchIds);
            if (error) console.warn(`   ⚠️ Warning: Failed to clean up comment reactions batch ${i / batchSize50 + 1}:`, error.message);
            else deletedRx += batchIds.length;
        }
        console.log(`   🧹 Successfully deleted comment reactions for ${deletedRx} comments.`);
        
        // B. Delete reactions of virtual users
        const { error: rxUserDeleteErr } = await supabase
            .from('comment_reactions')
            .delete()
            .in('user_id', validUserIds);
            
        if (rxUserDeleteErr) console.warn("   ⚠️ Warning: Failed to clean up user comment reactions:", rxUserDeleteErr.message);
        
        // C. Delete comments in batches of 50
        let deletedComments = 0;
        for (let i = 0; i < commentIds.length; i += batchSize50) {
            const batchIds = commentIds.slice(i, i + batchSize50);
            const { error } = await supabase
                .from('comments')
                .delete()
                .in('id', batchIds);
            if (error) console.error(`   ❌ Failed to clean up comments batch ${i / batchSize50 + 1}:`, error.message);
            else deletedComments += batchIds.length;
        }
        console.log(`   🧹 Successfully deleted ${deletedComments} previous virtual comments.`);
    }

    const selectedSlugs = selectedMovies.map(m => m.slug);
    if (selectedSlugs.length > 0) {
        // D. Delete movie interactions of virtual users
        const { error: movieIntDeleteErr } = await supabase
            .from('movie_interactions')
            .delete()
            .in('movie_slug', selectedSlugs)
            .in('user_id', validUserIds);
            
        if (movieIntDeleteErr) console.warn("   ⚠️ Warning: Failed to clean up movie interactions:", movieIntDeleteErr.message);
        else console.log(`   🧹 Cleaned up previous likes/dislikes for selected movies.`);
        
        // E. Delete favorites of virtual users
        const { error: favsDeleteErr } = await supabase
            .from('favorites')
            .delete()
            .in('movie_slug', selectedSlugs)
            .in('user_id', validUserIds);
            
        if (favsDeleteErr) console.warn("   ⚠️ Warning: Failed to clean up favorites:", favsDeleteErr.message);
        else console.log(`   🧹 Cleaned up previous favorites for selected movies.`);
    }
    console.log("🧹 Cleanup completed. Ready for fresh, highly distributed seeding!\n");
    // =========================================================================

    console.log("🚀 Starting seeding interactions (Comments, Reactions, Likes, Favorites)...\n");

    let totalComments = 0;
    let totalReactions = 0;
    let totalLikes = 0;
    let totalFavs = 0;

    for (let mIdx = 0; mIdx < selectedMovies.length; mIdx++) {
        const movie = selectedMovies[mIdx];
        console.log(`--------------------------------------------------`);
        console.log(`🎬 [${mIdx + 1}/${selectedMovies.length}] Seeding movie: "${movie.name}" (${movie.slug})`);

        // 1. SEED COMMENTS WITH HIGH INDIVIDUAL EPISODE DISTRIBUTION
        const commentsToInsert = [];
        const totalEpisodes = movie.episodes.length;
        const commentPool = GENZ_COMMENTS_POOL[movie.categoryType] || GENZ_COMMENTS_POOL.general;
        const shuffledUsers = [...VIRTUAL_PROFILES].sort(() => 0.5 - Math.random());
        let userPointer = 0;

        // A. General comments: seed only 1 to 2 comments directly on the general page
        const genCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 comments
        for (let i = 0; i < genCount; i++) {
            if (userPointer >= shuffledUsers.length) break;
            const user = shuffledUsers[userPointer++];
            const content = commentPool[Math.floor(Math.random() * commentPool.length)];
            const realUserId = validUserIds[Math.floor(Math.random() * validUserIds.length)];

            commentsToInsert.push({
                user_id: realUserId,
                user_name: user.name,
                user_avatar: user.avatar,
                movie_slug: movie.slug,
                content: content,
                is_spoiler: Math.random() < 0.1,
                created_at: getRandomPastDate()
            });
        }

        // B. Episode comments: seed comments for active episodes
        // If completed (HT), spread comments across ALL active episodes. Otherwise, seed the first 5 episodes.
        const maxEpisodesToSeed = (movie.isCompleted && totalEpisodes > 1)
            ? totalEpisodes
            : Math.min(totalEpisodes, 5);

        if (movie.isCompleted && totalEpisodes > 1) {
            console.log(`   ✨ Completed series (HT) detected! Spreading comments across ALL ${totalEpisodes} episodes.`);
        }

        for (let epIdx = 0; epIdx < maxEpisodesToSeed; epIdx++) {
            const episodeSlug = movie.episodes[epIdx];
            const epCommentsCount = totalEpisodes === 1
                ? Math.floor(Math.random() * 3) + 4  // 4 to 6 comments for single episode movies
                : Math.floor(Math.random() * 2) + 2; // 2 or 3 comments per episode for series

            for (let i = 0; i < epCommentsCount; i++) {
                if (userPointer >= shuffledUsers.length) {
                    shuffledUsers.sort(() => 0.5 - Math.random());
                    userPointer = 0;
                }
                const user = shuffledUsers[userPointer++];
                const epPool = GENZ_COMMENTS_POOL.episode;
                const content = epPool[Math.floor(Math.random() * epPool.length)];
                const realUserId = validUserIds[Math.floor(Math.random() * validUserIds.length)];

                commentsToInsert.push({
                    user_id: realUserId,
                    user_name: user.name,
                    user_avatar: user.avatar,
                    movie_slug: `${movie.slug}/${episodeSlug}`,
                    content: content,
                    is_spoiler: Math.random() < 0.15,
                    created_at: getRandomPastDate()
                });
            }
        }

        let insertedComments = [];
        if (commentsToInsert.length > 0) {
            const { data, error } = await supabase
                .from('comments')
                .insert(commentsToInsert)
                .select();

            if (error) {
                console.error(`   ❌ Failed to seed comments:`, error.message);
            } else if (data) {
                insertedComments = data;
                totalComments += data.length;
                console.log(`   💬 Seeded ${data.length} comments (GenZ style, synchronized).`);
            }
        }

        // 2. SEED COMMENT REACTIONS (Upvotes/Downvotes)
        if (insertedComments.length > 0) {
            const reactionsToInsert = [];
            for (const comment of insertedComments) {
                // Seed 2 to 7 reactions per comment
                const upvotesCount = Math.floor(Math.random() * 8) + 1; // 1 - 8 upvotes
                const downvotesCount = Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 1 : 0; // 30% chance for 1 - 2 downvotes

                const reactors = [...validUserIds].sort(() => 0.5 - Math.random());
                let rIdx = 0;

                // Insert upvotes
                for (let u = 0; u < Math.min(upvotesCount, reactors.length); u++) {
                    reactionsToInsert.push({
                        comment_id: comment.id,
                        user_id: reactors[rIdx++],
                        type: 'up'
                    });
                }

                // Insert downvotes
                for (let d = 0; d < Math.min(downvotesCount, reactors.length - rIdx); d++) {
                    reactionsToInsert.push({
                        comment_id: comment.id,
                        user_id: reactors[rIdx++],
                        type: 'down'
                    });
                }
            }

            if (reactionsToInsert.length > 0) {
                const { data, error } = await supabase
                    .from('comment_reactions')
                    .insert(reactionsToInsert)
                    .select();

                if (error) {
                    console.error(`   ❌ Failed to seed comment reactions:`, error.message);
                } else if (data) {
                    totalReactions += data.length;
                    console.log(`   👍 Seeded ${data.length} comment reactions (upvotes/downvotes).`);
                }
            }
        }

        // 3. SEED MOVIE INTERACTIONS (Likes/Dislikes)
        const interactionUsersCount = Math.floor(Math.random() * 15) + 10; // 10 to 25 likes/dislikes
        const interactionUsers = [...validUserIds].sort(() => 0.5 - Math.random()).slice(0, interactionUsersCount);
        const interactionsToInsert = interactionUsers.map(uId => ({
            user_id: uId,
            movie_slug: movie.slug,
            type: Math.random() < 0.88 ? 'like' : 'dislike', // 88% like rate
        }));

        if (interactionsToInsert.length > 0) {
            const { data, error } = await supabase
                .from('movie_interactions')
                .upsert(interactionsToInsert)
                .select();

            if (error) {
                console.error(`   ❌ Failed to seed movie likes/dislikes:`, error.message);
            } else if (data) {
                totalLikes += data.length;
                const likes = data.filter(d => d.type === 'like').length;
                const dislikes = data.length - likes;
                console.log(`   ❤️ Seeded ${data.length} movie interactions (${likes} Likes / ${dislikes} Dislikes).`);
            }
        }

        // 4. SEED FAVORITES
        const favsCount = Math.floor(Math.random() * 8) + 3; // 3 to 10 favorites
        const favsUsers = [...validUserIds].sort(() => 0.5 - Math.random()).slice(0, favsCount);
        const favoritesToInsert = favsUsers.map(uId => ({
            user_id: uId,
            movie_slug: movie.slug,
            movie_name: movie.name,
            movie_poster: movie.thumb
        }));

        if (favoritesToInsert.length > 0) {
            const { data, error } = await supabase
                .from('favorites')
                .insert(favoritesToInsert)
                .select();

            if (error) {
                console.error(`   ❌ Failed to seed favorites:`, error.message);
            } else if (data) {
                totalFavs += data.length;
                console.log(`   ⭐ Seeded ${data.length} user favorites.`);
            }
        }

        // Gentle delay to avoid API rate limit
        await sleep(150);
    }

    console.log("\n==================================================");
    console.log("📊 SPECIFIC MOVIES SEEDING COMPLETED SUCCESSFULLY!");
    console.log(`💬 Total GenZ Comments Added:       ${totalComments}`);
    console.log(`👍 Total Comment Reactions Added:   ${totalReactions}`);
    console.log(`❤️ Total Movie Likes/Dislikes Added: ${totalLikes}`);
    console.log(`⭐ Total User Favorites Added:      ${totalFavs}`);
    console.log("==================================================\n");
}

seedSpecificMovies();
