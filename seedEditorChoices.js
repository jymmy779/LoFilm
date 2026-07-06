const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const NOMINATED_SLUGS = [
    "bai-hoc-dang-doi", "ke-thu-hoang-gia-cua-toi", "tieng-yeu-nay-anh-dich-duoc-khong",
    "huyen-thoai-linh-bep-anh-nuoi-thang-cap-thanh-huyen-thoai", "dieu-nhan-choi-mat",
    "chu-tich-tap-su", "phu-nhan-dai-quan-the-ky-21", "nha-nghi-bb-tuyet-voi-cua-jae-seok",
    "khi-anh-chay-ve-phia-em", "dua-hau-lap-lanh", "thanh-tra-bi-mat-kiem-toan-tinh-yeu",
    "biet-doi-sieu-kho", "kho-do-danh", "truc-ngoc", "con-trai-ban-me", "bac-si-dao-hoang",
    "vu-lam-linh", "cong-anh-ma-chay", "nu-hoang-nuoc-mat", "mac-ly", "tuoi-hai-lam-tuoi-hai-mot",
    "duoi-tan-cay-co-ngoi-nha-mai-do", "mua-ruc-ro-cua-em-mua-em-ruc-ro", "hom-nay-lai-ban-het",
    "vung-trom-khong-the-giau", "bu-nhin-bong-dem", "gia-nghiep", "chiec-bat-lua-va-vay-cong-chua",
    "hen-ho-chon-cong-so-2025", "nguoi-nhen-giang-ho"
];

async function seed() {
    const defaultData = {
        mode: "manual",
        autoCount: 30,
        movies: NOMINATED_SLUGS.map(slug => ({ slug, name: slug, thumb_url: "", poster_url: "" }))
    };

    const { error } = await supabase.from('site_settings').upsert({
        key: 'editor_choices',
        value: defaultData,
        updated_at: new Date().toISOString()
    });

    if (error) {
        console.error("Lỗi:", error);
    } else {
        console.log("Đã seed xong.");
    }
}

seed();
