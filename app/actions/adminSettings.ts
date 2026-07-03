"use server";
import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSiteSettings() {
    const supabase = await createClient();
    
    let data = null;
    let error = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        const res = await supabase.from("site_settings").select("*");
        if (!res.error) {
            data = res.data;
            error = null;
            break;
        }
        error = res.error;
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    }
    
    if (error || !data) return { maintenance_mode: false, active_event: "none" };

    const settings: any = {};
    data.forEach((item: any) => {
        settings[item.key] = item.value;
    });

    return settings;
}

export async function updateSiteSetting(key: string, value: any) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("site_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout"); // Revalidate all layouts to apply settings
    return { success: true };
}
