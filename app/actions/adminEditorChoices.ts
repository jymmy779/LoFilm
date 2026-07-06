"use server";
import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getEditorChoicesConfig() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('site_settings').select('*').eq('key', 'editor_choices').maybeSingle();
    
    if (error) {
        console.error("Lỗi lấy cấu hình Editor Choices:", error);
        return null;
    }

    if (data && data.value) {
        return data.value;
    }

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

    return { 
        mode: "manual", 
        autoCount: 30, 
        movies: NOMINATED_SLUGS.map(slug => ({ slug, name: slug, thumb_url: "", poster_url: "" }))
    };
}

export async function updateEditorChoicesConfig(config: any) {
    const supabase = await createClient();
    const { error } = await supabase.from('site_settings').upsert({
        key: 'editor_choices',
        value: config,
        updated_at: new Date().toISOString()
    });

    if (error) {
        console.error("Lỗi lưu cấu hình Editor Choices:", error);
        return { error: error.message };
    }

    // Clear cache để trang chủ cập nhật ngay
    try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
        await redis.del("home:nominated");
    } catch (e) {
        console.error("Lỗi xóa cache nominated:", e);
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    return { success: true };
}
