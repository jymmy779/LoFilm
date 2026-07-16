/* app/utils/log-activity.ts */
import { createClient } from "@/app/utils/supabase/client";

export type ActivityType =
    | "comment"
    | "reply"
    | "like"
    | "dislike"
    | "favorite_add"
    | "favorite_remove"
    | "watchlist_add"
    | "watchlist_remove"
    | "update_avatar"
    | "update_name";

export async function logActivity(
    userId: string,
    type: ActivityType,
    metadata?: Record<string, any>
) {
    const supabase = createClient();
    // Fire-and-forget: không await để không block UI
    supabase
        .from("user_activities")
        .insert({
            user_id: userId,
            type,
            metadata: metadata || {},
        })
        .then(({ error }) => {
            if (error) console.error("Log activity error:", error);
        });
}