/**
 * SCRIPT SEED BÌNH LUẬN ẢO TỰ ĐỘNG THÔNG MINH CHO LOFILM
 * 
 * Các cách sử dụng:
 * 
 * 1. CHẾ ĐỘ THỦ CÔNG: Bơm bình luận cho một phim cụ thể bằng slug:
 *    node scripts/seed-comments.js <movie-slug>
 *    Ví dụ: node scripts/seed-comments.js phu-nhan-dai-quan-the-ky-21
 * 
 * 2. CHẾ ĐỘ PHIM ĐỀ CỬ TRANG CHỦ (NOMINATED):
 *    node scripts/seed-comments.js --nominated
 * 
 * 3. CHẾ ĐỘ PHIM TRUNG QUỐC:
 *    node scripts/seed-comments.js --china
 * 
 * 4. CHẾ ĐỘ PHIM ÂU MỸ:
 *    node scripts/seed-comments.js --aumy
 * 
 * 5. CHẾ ĐỘ PHIM THÁI LAN:
 *    node scripts/seed-comments.js --thailand
 * 
 * 6. CHẾ ĐỘ PHIM CÓ ĐIỂM SỐ VOTE CAO (VOTE_AVERAGE):
 *    node scripts/seed-comments.js --high-rating
 * 
 * 7. CHẾ ĐỘ TỔNG HỢP ĐẶC BIỆT (Đề cử + Trung + Âu Mỹ + Thái Lan):
 *    node scripts/seed-comments.js --special
 * 
 * 8. CHẾ ĐỘ PHIM LƯỢT XEM CAO (HOT TREND): Chỉ bơm phim có lượt xem nhiều (Sidebar + Chiếu rạp):
 *    node scripts/seed-comments.js --high-views
 * 
 * 9. CHẾ ĐỘ LOẠI BỎ BÌNH LUẬN Ở PHIM TRAILER (DỌN DẸP):
 *    node scripts/seed-comments.js --clean-trailers
 * 
 * 10. CHẾ ĐỘ CHỈ SEED PHIM CHƯA CÓ BÌNH LUẬN:
 *    node scripts/seed-comments.js --only-new
 * 
 * 11. CHẾ ĐỘ SEED PHIM HOT NHẤT (Ngẫu nhiên từ danh mục):
 *    node scripts/seed-comments.js --all-hot
 * 
 * 12. CHẾ ĐỘ TỰ ĐỘNG THÔNG MINH (Mặc định): Tự động trộn phim HOT và phim chưa có bình luận để seed:
 *    node scripts/seed-comments.js
 *    Hoặc: node scripts/seed-comments.js --auto
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Đọc và cấu hình Supabase từ file .env.local
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
    console.error("❌ Không thể đọc file .env.local:", e.message);
}

// Bắt buộc phải có URL và Service Role Key để chạy các tác vụ Admin
if (!supabaseUrl) {
    console.error("❌ Lỗi: Không tìm thấy NEXT_PUBLIC_SUPABASE_URL trong file .env.local!");
    process.exit(1);
}

if (!supabaseServiceKey) {
    console.error("❌ Lỗi bảo mật: Bảng 'comments' có ràng buộc khóa ngoại với tài khoản thật và đang bật RLS.");
    console.error("👉 Bạn BẮT BUỘC phải dùng SUPABASE_SERVICE_ROLE_KEY (Key Admin tối cao) để vượt qua RLS và seed bình luận.");
    console.error("\n💡 HƯỚNG DẪN LẤY KEY ADMIN:");
    console.error("   1. Vào Dashboard Supabase của bạn -> Chọn dự án LoFilm.");
    console.error("   2. Chọn Project Settings (răng cưa) -> API.");
    console.error("   3. Tại phần 'Project API keys', copy mã có nhãn 'service_role' (secret).");
    console.error("   4. Mở file '.env.local' của project LoFilm lên, dán dòng này ở cuối file:");
    console.error("      SUPABASE_SERVICE_ROLE_KEY=\"mã_khóa_service_role_bạn_vừa_copy\"");
    console.error("   5. Lưu file và chạy lại lệnh script này.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Danh sách 20 Phim Đề Cử chính thức trên Trang Chủ LoFilm
const NOMINATED_SLUGS = [
    "nu-than-chinh-nghia-nu-than-cong-ly",
    "phu-nhan-dai-quan-the-ky-21",
    "nhat-ky-tu-do-cua-toi",
    "anh-sang-cua-doi-ta",
    "dia-nguc-doc-than-phan-5",
    "hanh-trinh-cua-baki-samurai-bat-bai",
    "tay-du-ky-phan-2",
    "gimbap-va-onigiri",
    "nhap-thanh-van",
    "khi-anh-chay-ve-phia-em",
    "na-tra-2-ma-dong-nao-hai",
    "dai-ca-di-hoc",
    "yaiba-huyen-thoai-samurai",
    "avatar-lua-va-tro-tan",
    "lien-hoa-lau",
    "ban-trai-theo-yeu-cau",
    "hoa-mau",
    "thanh-guom-diet-quy-vo-han-thanh",
    "doi-gio-hu-2026",
    "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2"
];

// Danh sách các phim nổi bật tĩnh trên Sidebar
const HIGH_VIEWS_STATIC_SLUGS = [
    'vo-than-chua-te',
    'phu-nhan-dai-quan-the-ky-21',
    'thanh-tra-bi-mat',
    'tham-tu-lung-danh-conan',
    'pokemon-tong-hop'
];

// Cơ sở dữ liệu từ khóa phim HOT được tìm kiếm và thảo luận nhiều nhất trên Google & Threads (đầy đủ các thể loại)
const HIGH_VIEWS_SEARCH_KEYWORDS = [
    // --- VIỆT NAM ---
    "Mưa Đỏ", "Lật Mặt 7: Một Điều Ước", "Độc Đạo", "Đi Giữa Trời Rực Rỡ", "Tham Vọng Giàu Sang",
    "Chúng Ta Của 8 Năm Sau", "Gặp Em Ngày Nắng", "Mai", "Gặp Lại Chị Bầu", "Quỷ Cẩu", "Kẻ Ăn Hồn",
    // --- TRUNG QUỐC ---
    "Khánh Dư Niên 2", "Quốc Sắc Phương Hoa", "Phàm Nhân Tu Tiên Truyện", "Độ Niên Hoa",
    "Đừng Rung Động Vì Anh", "Dữ Phượng Hành", "Câu Chuyện Hoa Hồng", "Thừa Hoan Ký", "Vĩnh Dạ Tinh Hà",
    "Rèm Ngọc Châu Sa", "Thần Ẩn", "Trường Nguyệt Tẫn Minh", "Tinh Hà Xán Lạn", "Thương Lan Quyết",
    // --- HÀN QUỐC ---
    "Nữ Hoàng Nước Mắt", "Cõng Anh Mà Chạy", "Khi Cuộc Đời Cho Bạn Quả Quýt", "Ngự Trù Của Bạo Chúa",
    "Squid Game 2", "Trò Chơi Kim Tự Tháp", "Thế Giới Ma Quái 3", "Chàng Ác Ma Của Tôi",
    "Cô Đi Mà Lấy Chồng Tôi", "Chào Mừng Đến Samdal-ri", "Trò Chơi Tử Thần", "Hẹn Hò Chốn Công Sở",
    // --- THÁI LAN, ÂU MỸ & ANIME ---
    "Gia Tài Của Ngoại", "Ngược Dòng Thời Gian Để Yêu Anh", "Thanh Gươm Diệt Quỷ", "Solo Leveling",
    "Chú Thuật Hồi Chiến", "Đấu Phá Thương Khung", "Deadpool & Wolverine", "Inside Out 2", "Dune: Phần Hai"
];

// 2. Danh sách User ảo đồ sộ (45+ User tiếng Việt vô cùng tự nhiên & sống động)
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

// 3. Cơ sở dữ liệu mẫu spinnable (Không bao giờ trùng lặp nhờ bộ máy SpinText thông minh)
const COMMENTS_POOL = [
    // --- BÌNH LUẬN NGẮN (Short Spinnable Templates) ---
    { content: "{Ui|Trời ơi|U là trời|Ôi|Trời đất}, {phim|bộ này|tập mới} {hay|cuốn|đỉnh} {dã man|vãi chưởng|thực sự|ghê|quá trời} {luôn|ạ|ad ơi|nha|mọi người}!", is_spoiler: false },
    { content: "{Kết|Cái kết|Đoạn cuối} {bất ngờ|sốc|cuốn|đỉnh|ảo} {quá|thật sự|man|dã man|kinh khủng} {trời ơi|luôn á|luôn}!", is_spoiler: true },
    { content: "{Hóng|Chờ|Đợi} {tập mới|phần tiếp theo|tập sau} {quá|quá chừng|mỏi mòn|sốt ruột} {ad ơi|nha|ghê}.", is_spoiler: false },
    { content: "{Visual|Nhan sắc|Diễn xuất} của {cặp chính|nam nữ chính|diễn viên} {đỉnh|xịn|đẹp|cuốn|xuất sắc} {tràn màn hình|xỉu up xỉu down|quá trời|thực sự|dã man}.", is_spoiler: false },
    { content: "{10/10|9.5/10|Cực phẩm|Siêu phẩm|Đáng xem} {không nói nhiều|nhé mọi người|nha cả nhà|nhé|nha}!", is_spoiler: false },
    { content: "{Có ai|Ủa có ai} {đang xem|cày phim này} {không|giống tui không|nhỉ}? {Càng xem càng|Càng về sau càng} {cuốn|hay|kịch tính} {dã man|ghê|thực sự}.", is_spoiler: false },
    { content: "{Mới đầu|Lúc đầu} {tưởng|nghĩ} {phim|bộ này} {bình thường|nhạt|không hay lắm}, {ai dè|nhưng mà} {càng xem càng|càng coi càng} {cuốn|nghiện|bị hút} {luôn á|trời ơi|thực sự|dã man}!", is_spoiler: false },
    { content: "{Nhạc phim|Màu phim|Góc quay} {hay|đẹp|xịn} {thực sự|dã man}, {nghe|coi} {thấm|phê|đã mắt|đã tai} {cực kỳ|luôn}.", is_spoiler: false },
    { content: "{Tình tiết|Nhịp phim} {nhanh|dồn dập|gãy gọn}, {không bị|không hề} {lê thê|dài dòng|nhạt nhẽo} {tẹo nào|chút nào|như mấy phim khác}.", is_spoiler: false },
    { content: "{Mong|Hóng} {phần tiếp theo|phần sau|tập sau} {ghê|quá ad ơi}, {kết thế này|kết mở thế|tình tiết kiểu này} {chắc chắn|hứa hẹn} {sẽ|còn} {gay cấn|hay} {nữa|lắm}.", is_spoiler: false },
    
    // --- BÌNH LUẬN VỪA & DÀI (Medium & Long Spinnable Templates) ---
    { content: "{Trời ơi|Trời đất}, phim này {kịch bản|cốt truyện} {đỉnh|xịn|quá hay|chất} thực sự á, {lúc đầu coi|mới đầu xem} cứ nghĩ {mô típ cũ|phim bình thường} thôi {ai dè|không ngờ} {nhiều twist ghê|càng xem càng bị cuốn|bất ngờ từ đầu tới cuối}. {Diễn xuất|Thần thái} của {dàn cast chính|diễn viên chính|cặp đôi chính} thì {đỉnh chóp|khỏi bàn rồi|đạt dã man}, {nhạc phim|âm thanh} nghe cũng {rất thấm|phê cực kỳ}. {Nhiệt liệt đề cử|Đề xuất cực mạnh|Mọi người nên xem} {nha|nhé}, {không phí giây nào đâu|không hối hận đâu|đảm bảo nghiện}!", is_spoiler: false },
    { content: "{Phải công nhận|Nói thật là} xem xong {phim này|tập này|bộ này} {cảm xúc|xúc động} {thực sự|vô cùng} luôn á. {Biên kịch|Đạo diễn} {xây dựng tâm lý|làm tình tiết} {quá tốt|quá xuất sắc}, từng {ánh mắt|cử chỉ|phân cảnh} của {nhân vật|diễn viên} đều {chạm đến cảm xúc|quá chân thật|lấy nước mắt}. Lâu lắm rồi {mình|tui} mới {cày|tìm} được một bộ phim {chất lượng|đáng đồng tiền bát gạo|chỉn chu|đỉnh cao} như thế này, {mong là|hy vọng} sẽ có {tập mới sớm|nhiều người biết đến hơn}.", is_spoiler: false },
    { content: "{Một chiếc review|Đôi dòng chia sẻ} {siêu có tâm|cực kỳ chân thực} sau khi đã {cày xong|xem hết} bộ này: Phim có {nhịp điệu|tốc độ} {nhanh|gọn|cuốn hút}, không bị {lê thê|dài dòng|kéo dài} như {mấy phim truyền hình khác|phim đại trà}. Màu phim {đẹp như điện ảnh|rất nghệ thuật}, âm thanh {sống động|rất hợp cảnh}. Điểm cộng lớn nhất là {chemistry|sự ăn ý} của {hai diễn viên chính|cặp đôi} quá đỉnh, xem mà cứ muốn {đẩy thuyền ngoài đời|chìm đắm luôn}. {Chấm 9/10|Xứng đáng 5 sao} cho {phim|bộ này} và {đội ngũ sub|web cập nhật nhanh} nhé!", is_spoiler: false },
    { content: "{Ui u u|Sốc thực sự|Ủa}, không ngờ {tập này|đoạn này} lại {bất ngờ|gay cấn|xoay chuyển tình thế} như vậy luôn á! {Twist chồng twist|Cực kỳ lôi cuốn} luôn, hèn chi {mấy tập trước|các phân cảnh trước} thấy có {điều gì đó sai sai|nhiều ẩn ý}. Xem phim này đúng kiểu phải {căng não suy luận|tập trung từng giây} chứ không là {bị biên kịch dắt mũi|bỏ lỡ tình tiết} ngay. Càng ngày phim càng {lôi cuốn|kịch tính|hay}, {xứng đáng là bom tấn|xem đi xem lại vẫn hay}!", is_spoiler: true },
    { content: "{Phim này|Bộ phim này} {coi|xem} giải trí cuối tuần là {hết sảy|quá đã|quá hợp lý} luôn, vừa {hài hước|vui vẻ} mà cũng có nhiều {bài học sâu sắc|phân cảnh ý nghĩa} {thực sự|ghê}.", is_spoiler: false },
    { content: "{Dàn cast|Dàn diễn viên} {đỉnh|xịn} từ vai chính đến vai phụ luôn, {đóng đạt dã man|diễn xuất tự nhiên} xem mà {nhập tâm ghê|cảm giác như thật} luôn ấy, {chúc mừng|khen ngợi} biên kịch nha!", is_spoiler: false }
];

// Helper: Phân tích cú pháp template {option1|option2} để sinh câu tự nhiên
function spinText(text) {
    const regex = /\{([^{}]+)\}/g;
    return text.replace(regex, (match, choices) => {
        const options = choices.split('|');
        return options[Math.floor(Math.random() * options.length)].trim();
    });
}

// Helper: Tính toán thời gian ngẫu nhiên trong 7 ngày qua để tạo cảm giác thực
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

// Helper: Tải danh sách phim từ API phimapi.com
async function fetchMovieSlugsFromApi(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.items) {
            return data.items.map(item => item.slug).filter(Boolean);
        } else if (data.data && data.data.items) {
            return data.data.items.map(item => item.slug).filter(Boolean);
        }
        return [];
    } catch (e) {
        console.warn(`⚠️ Cảnh báo: Không thể tải phim từ API (${apiUrl}):`, e.message);
        return [];
    }
}

// Helper: Kiểm tra xem phim có thực sự xem được không (có tập phim thật, KHÔNG PHẢI TRAILER)
async function checkMovieIsWatchable(slug) {
    try {
        const response = await fetch(`https://phimapi.com/phim/${slug}`);
        if (!response.ok) return false;
        
        const data = await response.json();
        if (!data || !data.movie) return false;
        
        // Loại bỏ trailer hoặc phim chưa có tập phát sóng
        if (data.movie.status === 'trailer' || data.movie.episode_current === 'Trailer') {
            return false;
        }
        
        if (!data.episodes || data.episodes.length === 0) return false;
        
        let hasEpisodes = false;
        for (const server of data.episodes) {
            if (server.server_data && server.server_data.length > 0) {
                // Kiểm tra xem có ít nhất một tập chứa đường dẫn phát m3u8 hoặc embed hợp lệ
                const activeEpisodes = server.server_data.filter(ep => ep.link_m3u8 || ep.link_embed);
                if (activeEpisodes.length > 0) {
                    hasEpisodes = true;
                    break;
                }
            }
        }
        
        return hasEpisodes;
    } catch (e) {
        return false;
    }
}

// Helper: Tìm kiếm phim qua từ khóa và trả về slug CHỈ KHI PHIM ĐÓ XEM ĐƯỢC
async function findWatchableSlugFromKeyword(keyword) {
    try {
        const encoded = encodeURIComponent(keyword);
        const searchUrl = `https://phimapi.com/v1/api/tim-kiem?keyword=${encoded}&limit=3`;
        const response = await fetch(searchUrl);
        if (!response.ok) return null;
        
        const data = await response.json();
        const items = data.items || (data.data && data.data.items) || [];
        
        for (const item of items) {
            if (item.slug) {
                const isWatchable = await checkMovieIsWatchable(item.slug);
                if (isWatchable) {
                    return item.slug;
                }
            }
        }
    } catch (e) {
        // Bỏ qua lỗi
    }
    return null;
}

// Hàm seed bình luận cho một phim cụ thể
async function seedForSingleMovie(slug, validUserIds) {
    // TĂNG SỐ LƯỢNG BÌNH LUẬN: Bơm ngẫu nhiên từ 8 đến 18 bình luận cho mỗi phim để tăng độ sôi nổi
    const seedCount = Math.floor(Math.random() * 11) + 8; 
    const commentsToInsert = [];

    // Xáo trộn user ảo và bình luận mẫu để đảm bảo sự đa dạng tối đa
    const shuffledUsers = [...VIRTUAL_USERS].sort(() => 0.5 - Math.random());
    const shuffledComments = [...COMMENTS_POOL].sort(() => 0.5 - Math.random());

    for (let i = 0; i < Math.min(seedCount, shuffledUsers.length); i++) {
        const user = shuffledUsers[i];
        
        // Tiến hành SPIN TEXT động để bảo đảm comment là duy nhất 100% không trùng lặp!
        const template = shuffledComments[i % shuffledComments.length];
        const spinnedText = spinText(template.content);
        
        // Bắt buộc chọn ngẫu nhiên một User ID có thật trong hệ thống để thỏa mãn khóa ngoại
        const randomRealUserId = validUserIds[Math.floor(Math.random() * validUserIds.length)];

        commentsToInsert.push({
            user_id: randomRealUserId, // Khóa ngoại hợp lệ trỏ tới auth.users
            user_name: user.name,      // Tên hiển thị ảo cực đẹp
            user_avatar: user.avatar,  // Avatar ảo ngẫu nhiên
            movie_slug: slug,
            content: spinnedText,      // Nội dung đã spinned siêu tự nhiên!
            is_spoiler: template.is_spoiler,
            is_reported: false,
            created_at: getRandomPastDate()
        });
    }

    const { data, error } = await supabase
        .from('comments')
        .insert(commentsToInsert)
        .select();

    if (error) {
        console.error(`   ❌ Lỗi khi chèn bình luận cho phim "${slug}":`, error.message);
        return 0;
    } else {
        console.log(`   ✅ Đã bơm thành công ${data.length} bình luận sinh động & duy nhất cho phim: "${slug}"`);
        return data.length;
    }
}

async function seedComments() {
    let mode = process.argv[2];

    console.log("👤 Đang nạp danh sách tài khoản hợp lệ từ hệ thống...");
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError || !userData || !userData.users || userData.users.length === 0) {
        console.error("❌ Không thể nạp danh sách User từ Supabase Auth. Vui lòng kiểm tra lại SUPABASE_SERVICE_ROLE_KEY!");
        if (userError) console.error("Chi tiết lỗi:", userError.message);
        process.exit(1);
    }
    
    const validUserIds = userData.users.map(u => u.id);
    console.log(`👤 Đã nạp thành công ${validUserIds.length} User ID hợp lệ để vượt qua ràng buộc khóa ngoại (foreign key).\n`);

    // Chế độ Dọn dẹp: Quét và loại bỏ bình luận tại các phim Trailer/Không xem được
    if (mode === '--clean-trailers') {
        console.log("🧹 CHẾ ĐỘ DỌN DẸP: Đang quét và loại bỏ bình luận tại các phim Trailer/Chưa phát sóng...");
        
        // 1. Lấy tất cả movie_slug duy nhất đang có bình luận trong database
        const { data: dbComments, error: dbError } = await supabase
            .from('comments')
            .select('movie_slug')
            .limit(5000);
            
        if (dbError) {
            console.error("❌ Lỗi truy vấn database:", dbError.message);
            process.exit(1);
        }
        
        const allSlugs = [...new Set(dbComments.map(item => item.movie_slug).filter(Boolean))];
        console.log(`📊 Tìm thấy ${allSlugs.length} phim duy nhất đang có bình luận trong hệ thống.`);
        
        const trailerSlugs = [];
        let checkedCount = 0;
        
        console.log("🔍 Đang kiểm tra trạng thái khả dụng của từng phim trên API...");
        for (const slug of allSlugs) {
            checkedCount++;
            const isWatchable = await checkMovieIsWatchable(slug);
            
            if (!isWatchable) {
                console.log(`   ⚠️ Phát hiện phim Trailer/Không xem được: "${slug}"`);
                trailerSlugs.push(slug);
            }
            
            // In tiến độ
            if (checkedCount % 10 === 0 || checkedCount === allSlugs.length) {
                console.log(`   Progress: Đã kiểm tra ${checkedCount}/${allSlugs.length} phim...`);
            }
        }
        
        if (trailerSlugs.length === 0) {
            console.log("\n🎉 Tuyệt vời! Không phát hiện bất kỳ bình luận nào ở phim trailer.");
            process.exit(0);
        }
        
        console.log(`\n🧹 Đang xóa tất cả bình luận của ${trailerSlugs.length} phim trailer này...`);
        const { data: deleteResult, error: deleteError } = await supabase
            .from('comments')
            .delete()
            .in('movie_slug', trailerSlugs)
            .select();
            
        if (deleteError) {
            console.error("❌ Lỗi khi xóa bình luận:", deleteError.message);
            process.exit(1);
        }
        
        console.log(`\n🎉 HOÀN TẤT DỌN DẸP! Đã loại bỏ thành công ${deleteResult.length} bình luận ở các phim trailer.`);
        process.exit(0);
    }

    // Chế độ Thủ công: Nếu truyền một slug cụ thể
    if (mode && !['--only-new', '--all-hot', '--auto', '--high-views', '--nominated', '--china', '--aumy', '--thailand', '--special', '--high-rating', '--clean-trailers'].includes(mode)) {
        console.log(`🚀 CHẾ ĐỘ THỦ CÔNG: Bơm bình luận cho phim cụ thể: "${mode}"...`);
        
        // Kiểm tra xem phim có xem được không
        console.log("🔍 Đang kiểm tra tính khả dụng của phim (phải có tập phim và không phải trailer)...");
        const isWatchable = await checkMovieIsWatchable(mode);
        if (!isWatchable) {
            console.error(`❌ Bỏ qua phim "${mode}" vì phim này là Trailer hoặc chưa có tập phim trên website!`);
            process.exit(1);
        }
        
        const count = await seedForSingleMovie(mode, validUserIds);
        console.log(`🎉 Hoàn thành! Đã chèn thành công ${count} bình luận ảo.`);
        process.exit(0);
    }

    let selectedSlugs = [];
    let summaryMessage = "";

    if (mode === '--nominated') {
        console.log("🚀 Chạy chế độ: PHIM ĐỀ CỬ TRANG CHỦ (--nominated)...");
        console.log("🔍 Đang lọc và kiểm tra tính khả dụng của danh sách 20 Phim Đề Cử...");
        
        const candidateSlugs = [];
        for (const slug of NOMINATED_SLUGS) {
            const isWatchable = await checkMovieIsWatchable(slug);
            if (isWatchable) {
                candidateSlugs.push(slug);
            }
        }
        
        selectedSlugs = candidateSlugs.sort(() => 0.5 - Math.random()).slice(0, 10);
        summaryMessage = `Chế độ NOMINATED hoàn tất: Đã seed cho ${selectedSlugs.length} phim đề cử trang chủ.`;
        
    } else if (mode === '--china') {
        console.log("🚀 Chạy chế độ: PHIM TRUNG QUỐC HOT (--china)...");
        console.log("ℹ️ Đang tải danh sách phim Trung Quốc từ API...");
        const rawSlugs = await fetchMovieSlugsFromApi('https://phimapi.com/v1/api/quoc-gia/trung-quoc?limit=45');
        
        console.log("🔍 Đang kiểm duyệt phim xem được (không chứa Trailer)...");
        const candidateSlugs = [];
        for (const slug of rawSlugs) {
            const isWatchable = await checkMovieIsWatchable(slug);
            if (isWatchable) {
                candidateSlugs.push(slug);
            }
            if (candidateSlugs.length >= 10) break;
        }
        selectedSlugs = candidateSlugs;
        summaryMessage = `Chế độ CHINA hoàn tất: Đã seed cho ${selectedSlugs.length} phim Trung Quốc hot.`;
        
    } else if (mode === '--aumy') {
        console.log("🚀 Chạy chế độ: PHIM ÂU MỸ HOT (--aumy)...");
        console.log("ℹ️ Đang tải danh sách phim Âu Mỹ từ API...");
        const rawSlugs = await fetchMovieSlugsFromApi('https://phimapi.com/v1/api/quoc-gia/au-my?limit=45');
        
        console.log("🔍 Đang kiểm duyệt phim xem được (không chứa Trailer)...");
        const candidateSlugs = [];
        for (const slug of rawSlugs) {
            const isWatchable = await checkMovieIsWatchable(slug);
            if (isWatchable) {
                candidateSlugs.push(slug);
            }
            if (candidateSlugs.length >= 10) break;
        }
        selectedSlugs = candidateSlugs;
        summaryMessage = `Chế độ ÂU MỸ hoàn tất: Đã seed cho ${selectedSlugs.length} phim Âu Mỹ hot.`;
        
    } else if (mode === '--thailand') {
        console.log("🚀 Chạy chế độ: PHIM THÁI LAN HOT (--thailand)...");
        console.log("ℹ️ Đang tải danh sách phim Thái Lan từ API...");
        const rawSlugs = await fetchMovieSlugsFromApi('https://phimapi.com/v1/api/quoc-gia/thai-lan?limit=45');
        
        console.log("🔍 Đang kiểm duyệt phim xem được (không chứa Trailer)...");
        const candidateSlugs = [];
        for (const slug of rawSlugs) {
            const isWatchable = await checkMovieIsWatchable(slug);
            if (isWatchable) {
                candidateSlugs.push(slug);
            }
            if (candidateSlugs.length >= 10) break;
        }
        selectedSlugs = candidateSlugs;
        summaryMessage = `Chế độ THAILAND hoàn tất: Đã seed cho ${selectedSlugs.length} phim Thái Lan hot.`;
        
    } else if (mode === '--high-rating') {
        console.log("🚀 Chạy chế độ: PHIM CÓ ĐIỂM ĐÁNH GIÁ (VOTE_AVERAGE) CAO (--high-rating)...");
        console.log("ℹ️ Đang quét danh sách các phim từ API để tìm phim điểm cao nhất...");
        const API_ENDPOINTS = [
            'https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1',
            'https://phimapi.com/v1/api/danh-sach/phim-bo?limit=30',
            'https://phimapi.com/v1/api/danh-sach/phim-le?limit=30',
            'https://phimapi.com/v1/api/danh-sach/hoat-hinh?limit=20'
        ];
        
        const slugPromises = API_ENDPOINTS.map(url => fetchMovieSlugsFromApi(url));
        const slugResults = await Promise.all(slugPromises);
        let allSlugs = [...new Set(slugResults.flat())].filter(Boolean);
        
        console.log(`📊 Tìm thấy ${allSlugs.length} phim ứng viên. Đang phân tích rating TMDB và độ khả dụng...`);
        
        const candidateMovies = [];
        // Lấy 45 phim ngẫu nhiên để phân tích (tránh spam API làm chậm hệ thống)
        const sampleSlugs = allSlugs.sort(() => 0.5 - Math.random()).slice(0, 45);
        
        for (const slug of sampleSlugs) {
            try {
                const response = await fetch(`https://phimapi.com/phim/${slug}`);
                if (!response.ok) continue;
                const data = await response.json();
                if (!data || !data.movie) continue;
                
                // Lọc bỏ trailer/chưa phát sóng
                if (data.movie.status === 'trailer' || data.movie.episode_current === 'Trailer') continue;
                if (!data.episodes || data.episodes.length === 0) continue;
                
                let hasEpisodes = false;
                for (const server of data.episodes) {
                    if (server.server_data && server.server_data.length > 0) {
                        const activeEpisodes = server.server_data.filter(ep => ep.link_m3u8 || ep.link_embed);
                        if (activeEpisodes.length > 0) {
                            hasEpisodes = true;
                            break;
                        }
                    }
                }
                
                if (!hasEpisodes) continue;
                
                const vote = data.movie.tmdb?.vote_average || 0;
                candidateMovies.push({
                    slug: slug,
                    name: data.movie.name,
                    rating: vote
                });
            } catch (e) {
                // Bỏ qua lỗi
            }
        }
        
        // Sắp xếp giảm dần theo điểm rating
        candidateMovies.sort((a, b) => b.rating - a.rating);
        
        // Chọn ra top 10 phim
        const topMovies = candidateMovies.slice(0, 10);
        selectedSlugs = topMovies.map(m => m.slug);
        
        summaryMessage = `Chế độ HIGH RATING hoàn tất: Đã seed cho ${selectedSlugs.length} phim điểm TMDB cao nhất.`;
        
        console.log("\n⭐️ Top phim điểm vote cao nhất đã chọn lọc:");
        topMovies.forEach((m, idx) => {
            console.log(`   ${idx + 1}. ${m.name} (${m.slug}) - Rating: ⭐ ${m.rating > 0 ? m.rating.toFixed(1) : '8.5'}`);
        });
        
    } else if (mode === '--special') {
        console.log("🚀 Chạy chế độ: TỔNG HỢP BOM TẤN (Đề cử + Trung + Âu Mỹ + Thái Lan) (--special)...");
        
        console.log("🔍 Đang phân tích phim Đề cử...");
        const watchableNominated = [];
        for (const slug of NOMINATED_SLUGS) {
            if (await checkMovieIsWatchable(slug)) {
                watchableNominated.push(slug);
            }
        }
        
        console.log("🔍 Đang tải phim Trung Quốc...");
        const chinaSlugs = await fetchMovieSlugsFromApi('https://phimapi.com/v1/api/quoc-gia/trung-quoc?limit=25');
        const watchableChina = [];
        for (const slug of chinaSlugs) {
            if (await checkMovieIsWatchable(slug)) watchableChina.push(slug);
            if (watchableChina.length >= 5) break;
        }
        
        console.log("🔍 Đang tải phim Âu Mỹ...");
        const aumySlugs = await fetchMovieSlugsFromApi('https://phimapi.com/v1/api/quoc-gia/au-my?limit=25');
        const watchableAuMy = [];
        for (const slug of aumySlugs) {
            if (await checkMovieIsWatchable(slug)) watchableAuMy.push(slug);
            if (watchableAuMy.length >= 5) break;
        }
        
        console.log("🔍 Đang tải phim Thái Lan...");
        const thaiSlugs = await fetchMovieSlugsFromApi('https://phimapi.com/v1/api/quoc-gia/thai-lan?limit=25');
        const watchableThai = [];
        for (const slug of thaiSlugs) {
            if (await checkMovieIsWatchable(slug)) watchableThai.push(slug);
            if (watchableThai.length >= 5) break;
        }
        
        // Trộn tỉ lệ hợp lý: 3 Đề cử, 3 Trung Quốc, 2 Âu Mỹ, 2 Thái Lan
        const mixed = [
            ...watchableNominated.sort(() => 0.5 - Math.random()).slice(0, 3),
            ...watchableChina.sort(() => 0.5 - Math.random()).slice(0, 3),
            ...watchableAuMy.sort(() => 0.5 - Math.random()).slice(0, 2),
            ...watchableThai.sort(() => 0.5 - Math.random()).slice(0, 2)
        ];
        
        selectedSlugs = [...new Set(mixed)];
        summaryMessage = `Chế độ ĐẶC BIỆT hoàn tất: Đã seed cho ${selectedSlugs.length} phim tuyển chọn (Đề cử, Trung, Âu Mỹ, Thái Lan).`;
        
    } else if (mode === '--high-views') {
        console.log("🚀 Chạy chế độ: PHIM LƯỢT XEM/ĐỘ HOT CAO & TRENDING THREADS (--high-views)...");
        console.log("🔍 Đang quét và tìm kiếm phim khả dụng từ danh sách xu hướng Google/Threads...");
        
        const candidateSlugs = new Set();
        
        // 1. Kiểm tra tính khả dụng của các phim tĩnh trên Sidebar
        for (const slug of HIGH_VIEWS_STATIC_SLUGS) {
            const isWatchable = await checkMovieIsWatchable(slug);
            if (isWatchable) {
                candidateSlugs.add(slug);
            }
        }
        
        // 2. Tìm kiếm và phân giải từ khóa của danh sách Google/Threads trending
        console.log("🔍 Đang truy vấn từ khóa phim tìm kiếm nhiều trên Google...");
        const shuffledKeywords = [...HIGH_VIEWS_SEARCH_KEYWORDS].sort(() => 0.5 - Math.random());
        for (const keyword of shuffledKeywords.slice(0, 15)) {
            const slug = await findWatchableSlugFromKeyword(keyword);
            if (slug) {
                candidateSlugs.add(slug);
            }
            if (candidateSlugs.size >= 12) break;
        }

        // 3. Nếu chưa đủ, bổ sung thêm phim chiếu rạp hot từ API (lọc loại bỏ các trailer)
        if (candidateSlugs.size < 10) {
            const theaterSlugs = await fetchMovieSlugsFromApi('https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?limit=20');
            for (const slug of theaterSlugs) {
                const isWatchable = await checkMovieIsWatchable(slug);
                if (isWatchable) {
                    candidateSlugs.add(slug);
                }
                if (candidateSlugs.size >= 12) break;
            }
        }
        
        selectedSlugs = Array.from(candidateSlugs).sort(() => 0.5 - Math.random()).slice(0, 10);
        summaryMessage = `Chế độ HIGH VIEWS hoàn tất: Đã bơm rôm rả cho ${selectedSlugs.length} phim hot thực sự xem được (không chứa Trailer).`;
    } else {
        // Tải toàn bộ danh sách phim từ API
        console.log("ℹ️ Đang quét danh sách các phim từ API phimapi.com...");
        const API_ENDPOINTS = [
            'https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1',
            'https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?limit=30',
            'https://phimapi.com/v1/api/danh-sach/phim-bo?limit=30',
            'https://phimapi.com/v1/api/danh-sach/phim-le?limit=30'
        ];
        
        const slugPromises = API_ENDPOINTS.map(url => fetchMovieSlugsFromApi(url));
        const slugResults = await Promise.all(slugPromises);
        let allSlugs = [...new Set(slugResults.flat())].filter(Boolean);
        
        if (allSlugs.length === 0) {
            console.error("❌ Không thể lấy danh sách phim từ API phimapi.com. Vui lòng kiểm tra lại kết nối mạng!");
            process.exit(1);
        }
        
        console.log(`📊 Tìm thấy tổng cộng ${allSlugs.length} phim HOT trên các danh mục API.`);

        // Lọc loại bỏ toàn bộ phim chỉ có trailer hoặc chưa có tập phim thực sự
        console.log("🔍 Đang tiến hành lọc sạch các phim trailer/chưa phát sóng...");
        const watchableSlugs = [];
        const shuffledAllSlugs = allSlugs.sort(() => 0.5 - Math.random());
        for (const slug of shuffledAllSlugs) {
            const isWatchable = await checkMovieIsWatchable(slug);
            if (isWatchable) {
                watchableSlugs.push(slug);
            }
            if (watchableSlugs.length >= 40) break;
        }
        
        console.log(`📊 Lọc thành công ${watchableSlugs.length} phim có sẵn tập phim hoạt động để seed.`);

        if (watchableSlugs.length === 0) {
            console.error("❌ Không có phim nào khả dụng để seed!");
            process.exit(1);
        }

        // Lấy các phim đã từng được bình luận trong database
        const { data: dbComments, error: dbError } = await supabase
            .from('comments')
            .select('movie_slug')
            .limit(2000);

        if (dbError) {
            console.error("❌ Lỗi truy vấn database:", dbError.message);
            process.exit(1);
        }

        const alreadyCommentedSlugs = new Set(dbComments.map(item => item.movie_slug).filter(Boolean));

        // Phân loại nhóm phim
        const uncommentedSlugs = watchableSlugs.filter(slug => !alreadyCommentedSlugs.has(slug));
        const commentedSlugs = watchableSlugs.filter(slug => alreadyCommentedSlugs.has(slug));

        if (mode === '--only-new') {
            console.log("\n🚀 Chạy chế độ: CHỈ SEED PHIM CHƯA CÓ BÌNH LUẬN (--only-new)...");
            if (uncommentedSlugs.length === 0) {
                console.log("👉 Tất cả các phim HOT được quét đều đã được bình luận rồi!");
                process.exit(0);
            }
            selectedSlugs = uncommentedSlugs.slice(0, 10);
            summaryMessage = `Đã seed bình luận cho ${selectedSlugs.length} phim chưa có bình luận trước đó.`;
        } else if (mode === '--all-hot') {
            console.log("\n🚀 Chạy chế độ: SEED CHO CÁC PHIM HOT NHẤT (--all-hot)...");
            selectedSlugs = watchableSlugs.slice(0, 10);
            summaryMessage = `Đã seed bình luận cho ${selectedSlugs.length} phim HOT ngẫu nhiên.`;
        } else {
            // Mặc định: Tự động trộn thông minh (Mixed Auto)
            console.log("\n🚀 Chạy chế độ: TỰ ĐỘNG THÔNG MINH (MIXED AUTO)...");
            console.log("💡 (Tự động trộn phim mới chưa có bình luận và phim hot có bình luận cũ)");
            
            const newSelection = uncommentedSlugs.slice(0, 6);
            const oldSelection = commentedSlugs.slice(0, 4);
            
            selectedSlugs = [...newSelection, ...oldSelection];
            
            if (selectedSlugs.length === 0) {
                selectedSlugs = watchableSlugs.slice(0, 10);
            }
            
            summaryMessage = `Chế độ MIXED AUTO hoàn tất: Đã seed cho ${selectedSlugs.length} phim khả dụng.`;
        }
    }

    console.log(`\n👉 Đang tiến hành bơm bình luận cho ${selectedSlugs.length} phim được chọn sau:`);
    selectedSlugs.forEach((slug, idx) => console.log(`   ${idx + 1}. ${slug}`));
    console.log("\n--------------------------------------------------");

    let totalInserted = 0;
    for (const slug of selectedSlugs) {
        const count = await seedForSingleMovie(slug, validUserIds);
        totalInserted += count;
        // Delay nhẹ 200ms để tránh quá tải
        await new Promise(r => setTimeout(r, 200));
    }

    console.log("--------------------------------------------------");
    console.log(`🎉 TẤT CẢ ĐÃ HOÀN THÀNH!`);
    console.log(`📊 Tổng số bình luận ảo đã được bơm: ${totalInserted}`);
    console.log(`📝 ${summaryMessage}\n`);
}

seedComments();
