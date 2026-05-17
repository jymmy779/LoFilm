/**
 * SCRIPT SEED BÌNH LUẬN ẢO CHO LOFILM
 * 
 * Cách sử dụng:
 * 1. Chạy seed cho một phim cụ thể bằng slug:
 *    node scripts/seed-comments.js <movie-slug>
 *    Ví dụ: node scripts/seed-comments.js phu-nhan-dai-quan-the-ky-21
 * 
 * 2. Tự động lấy danh sách phim đã có trong database rồi seed ngẫu nhiên:
 *    node scripts/seed-comments.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Đọc và cấu hình Supabase từ file .env.local
const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';
let supabaseServiceKey = '';

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            const matchUrl = line.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\r\n]+)["']?/);
            const matchKey = line.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=["']?([^"'\r\n]+)["']?/);
            const matchService = line.match(/^SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\r\n]+)["']?/);
            if (matchUrl) supabaseUrl = matchUrl[1];
            if (matchKey) supabaseAnonKey = matchKey[1];
            if (matchService) supabaseServiceKey = matchService[1];
        }
    }
} catch (e) {
    console.error("❌ Không thể đọc file .env.local:", e.message);
}

// Bắt buộc phải có URL
if (!supabaseUrl) {
    console.error("❌ Lỗi: Không tìm thấy NEXT_PUBLIC_SUPABASE_URL trong file .env.local!");
    process.exit(1);
}

// Sử dụng Service Key (quyền Admin để bypass RLS) hoặc fallback về Anon Key
const activeKey = supabaseServiceKey || supabaseAnonKey;

if (!activeKey) {
    console.error("❌ Lỗi: Không tìm thấy Key Supabase nào trong file .env.local!");
    process.exit(1);
}

if (!supabaseServiceKey) {
    console.warn("⚠️  Cảnh báo: Không tìm thấy SUPABASE_SERVICE_ROLE_KEY trong file .env.local.");
    console.warn("👉 Script đang dùng tạm Anon Key. Nếu bảng 'comments' của bạn đã bật RLS (Row Level Security), lệnh insert sẽ bị chặn và báo lỗi.");
    console.warn("💡 Cách khắc phục: Vào Dashboard Supabase -> Project Settings -> API -> Copy 'service_role key' (secret) và dán vào file .env.local:");
    console.warn("   SUPABASE_SERVICE_ROLE_KEY=\"your-service-role-key-here\"\n");
}

const supabase = createClient(supabaseUrl, activeKey);

// 2. Danh sách User ảo (Tên tiếng Việt tự nhiên)
const VIRTUAL_USERS = [
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
    { name: "Phong Nguyễn", avatar: "https://i.pravatar.cc/150?u=13" }
];

// 3. Danh sách Bình luận mẫu (Tự nhiên, bình dân, chân thực)
const COMMENTS_POOL = [
    { content: "Phim hay dã man, cuốn từ tập đầu tiên luôn á!", is_spoiler: false },
    { content: "Có ai xem tập mới chưa? Đoạn cuối gay cấn thực sự, không biết tập sau thế nào.", is_spoiler: false },
    { content: "Hóng mãi mới ra tập mới, ad cập nhật nhanh ghê. Cảm ơn ad nhé!", is_spoiler: false },
    { content: "Phim này đỉnh cao từ kịch bản đến diễn xuất luôn, 10/10 không nói nhiều.", is_spoiler: false },
    { content: "Xem đi xem lại vẫn thấy hay, nhạc phim cũng đỉnh nữa.", is_spoiler: false },
    { content: "Kết thúc bất ngờ quá, không nghĩ thủ phạm lại là nhân vật đó luôn á... Sốc thật sự!", is_spoiler: true },
    { content: "Mới đầu thấy bình thường mà càng xem càng cuốn, đề xuất mọi người xem thử nha!", is_spoiler: false },
    { content: "Diễn viên chính đẹp đôi xỉu, visual tràn màn hình luôn á trời.", is_spoiler: false },
    { content: "Có ai biết bài nhạc phim ở cuối tập này tên là gì không ạ? Tìm mãi không ra.", is_spoiler: false },
    { content: "Phim này coi giải trí cuối tuần là hết sảy luôn, hài hước cực kỳ.", is_spoiler: false },
    { content: "Tập này cảm động quá, khóc hết nước mắt luôn á. Xem xong buồn cả ngày.", is_spoiler: false },
    { content: "Ad ơi khi nào có tập tiếp theo vậy ạ? Hóng từng ngày luôn á.", is_spoiler: false },
    { content: "Đỉnh thực sự, kỹ xảo điện ảnh xịn xò như phim chiếu rạp vậy.", is_spoiler: false },
    { content: "Phim có nhiều cú twist đỉnh ghê, xem mà không dám tua một giây nào.", is_spoiler: false },
    { content: "Mong phần tiếp theo ghê, kết mở như thế này chắc chắn phải có phần sau rồi!", is_spoiler: false },
    { content: "Sao tập này âm thanh hơi nhỏ nhỉ ad ơi? Cơ mà phim vẫn hay tuyệt.", is_spoiler: false },
    { content: "Mới cày xong trong 1 đêm, xuất sắc thực sự. Khuyên ae nên xem nhé.", is_spoiler: false },
    { content: "Uầy, không nghĩ nam chính lại bay màu ở cuối phim luôn, buồn vãi chưởng.", is_spoiler: true },
    { content: "Phim xem bánh cuốn ghê, không uổng công chờ đợi.", is_spoiler: false },
    { content: "Trời ơi hóng mãi, cuối cùng cũng được xem phim chất lượng cao thế này.", is_spoiler: false }
];

// 4. Tạo UUID ngẫu nhiên cho User ảo (giả lập auth.users mà không làm lỗi khóa ngoại)
function generateRandomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 5. Tính toán thời gian ngẫu nhiên trong quá khứ để tránh trùng lắp thời gian gửi
function getRandomPastDate() {
    const now = new Date();
    const daysAgo = Math.random() * 7; // Trong vòng 7 ngày qua
    const hoursAgo = Math.random() * 24;
    const minutesAgo = Math.random() * 60;
    
    now.setDate(now.getDate() - daysAgo);
    now.setHours(now.getHours() - hoursAgo);
    now.setMinutes(now.getMinutes() - minutesAgo);
    
    return now.toISOString();
}

async function seedComments() {
    // Lấy slug phim từ dòng lệnh
    let targetMovieSlug = process.argv[2];

    if (!targetMovieSlug) {
        console.log("ℹ️ Đang tìm kiếm các slug phim hiện có trong hệ thống để seed...");
        
        // Truy vấn lấy các phim đã từng có bình luận trước đây
        const { data, error } = await supabase
            .from('comments')
            .select('movie_slug')
            .limit(100);

        if (error) {
            console.error("❌ Lỗi truy vấn database:", error);
            process.exit(1);
        }

        const uniqueSlugs = [...new Set(data.map(item => item.movie_slug))].filter(Boolean);

        if (uniqueSlugs.length === 0) {
            console.log("👉 Database của bạn chưa có bộ phim nào từng được bình luận.");
            console.log("👉 Vui lòng truyền trực tiếp slug phim muốn seed!");
            console.log("\nVí dụ: node scripts/seed-comments.js vo-than-chua-te");
            process.exit(0);
        }

        // Chọn ngẫu nhiên một slug có sẵn
        targetMovieSlug = uniqueSlugs[Math.floor(Math.random() * uniqueSlugs.length)];
        console.log(`🎯 Chọn ngẫu nhiên phim đang hot trong DB để seed: "${targetMovieSlug}"`);
    }

    console.log(`\n🚀 Bắt đầu quá trình seed bình luận ảo cho phim: "${targetMovieSlug}"...`);

    // Chọn ngẫu nhiên số lượng bình luận muốn thêm (từ 5 đến 12 bình luận)
    const seedCount = Math.floor(Math.random() * 8) + 5; 
    const commentsToInsert = [];

    // Xáo trộn danh sách user ảo và bình luận để đa dạng hóa
    const shuffledUsers = [...VIRTUAL_USERS].sort(() => 0.5 - Math.random());
    const shuffledComments = [...COMMENTS_POOL].sort(() => 0.5 - Math.random());

    for (let i = 0; i < Math.min(seedCount, shuffledUsers.length); i++) {
        const user = shuffledUsers[i];
        const commentData = shuffledComments[i % shuffledComments.length];
        
        commentsToInsert.push({
            user_id: generateRandomUUID(), // User ảo có UUID riêng biệt
            user_name: user.name,
            user_avatar: user.avatar,
            movie_slug: targetMovieSlug,
            content: commentData.content,
            is_spoiler: commentData.is_spoiler,
            is_reported: false,
            created_at: getRandomPastDate() // Giờ ngẫu nhiên để trông thật tự nhiên
        });
    }

    console.log(`📝 Đang đẩy ${commentsToInsert.length} bình luận ảo lên Supabase...`);

    const { data, error } = await supabase
        .from('comments')
        .insert(commentsToInsert)
        .select();

    if (error) {
        console.error("❌ Lỗi khi seed bình luận:", error);
    } else {
        console.log("✅ Seed thành công!");
        console.log("📊 Chi tiết các bình luận đã tạo:");
        data.forEach((c, index) => {
            console.log(`   ${index + 1}. [${c.user_name}]: "${c.content}" (Spoiler: ${c.is_spoiler ? 'Có' : 'Không'}) - Lúc: ${new Date(c.created_at).toLocaleString('vi-VN')}`);
        });
    }
}

seedComments();
