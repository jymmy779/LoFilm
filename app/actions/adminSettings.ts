"use server";
import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Module-level cache để tránh gọi Supabase nhiều lần trong cùng một request cycle
// (layout.tsx gọi 2 lần: RootLayout + EventLoaderWrapper)
const globalForSettings = global as unknown as {
    _settingsCache: { data: any; expiresAt: number } | null;
    _settingsPending: Promise<any> | null;
};
if (!globalForSettings._settingsCache) globalForSettings._settingsCache = null;
if (!globalForSettings._settingsPending) globalForSettings._settingsPending = null;

const SETTINGS_TTL_MS = 60_000; // Cache 60 giây

export async function getSiteSettings() {
    const now = Date.now();

    // Trả cache nếu còn hạn — tránh block layout với Supabase call
    if (globalForSettings._settingsCache && now < globalForSettings._settingsCache.expiresAt) {
        return globalForSettings._settingsCache.data;
    }

    // Singleton: nếu đang có request đang chạy, dùng chung kết quả
    if (globalForSettings._settingsPending) {
        return globalForSettings._settingsPending;
    }

    const fetchSettings = async () => {
        try {
            const supabase = await createClient();
            const { data, error } = await supabase.from("site_settings").select("*");

            if (error || !data) {
                // Fallback nhanh: nếu lỗi, thử lại 1 lần sau 500ms (không chờ 2s như trước)
                await new Promise(r => setTimeout(r, 500));
                const retry = await supabase.from("site_settings").select("*");
                if (retry.error || !retry.data) {
                    return { maintenance_mode: false, active_event: "none" };
                }
                const settings: any = {};
                retry.data.forEach((item: any) => { settings[item.key] = item.value; });
                globalForSettings._settingsCache = { data: settings, expiresAt: Date.now() + SETTINGS_TTL_MS };
                return settings;
            }

            const settings: any = {};
            data.forEach((item: any) => { settings[item.key] = item.value; });
            globalForSettings._settingsCache = { data: settings, expiresAt: Date.now() + SETTINGS_TTL_MS };
            return settings;
        } finally {
            globalForSettings._settingsPending = null;
        }
    };

    globalForSettings._settingsPending = fetchSettings();
    return globalForSettings._settingsPending;
}

export async function updateSiteSetting(key: string, value: any) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout"); // Revalidate all layouts to apply settings
    return { success: true };
}
