"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Gửi thông báo Like cho bình luận theo chuẩn YouTube:
 * 1. Chạy trên Server để bypass RLS một cách an toàn.
 * 2. Kiểm tra xem người này đã từng gửi thông báo Like cho bình luận này chưa.
 * 3. Nếu đã gửi rồi -> KHÔNG tạo thêm thông báo mới (chống spam chuông khi Like/Hủy like/Like lại).
 * 4. Nếu chưa từng gửi -> Tạo mới 1 thông báo duy nhất.
 */
export async function sendLikeNotification({
    recipientUserId,
    actorName,
    actorAvatar,
    commentId,
    movieSlug,
    content,
}: {
    recipientUserId: string;
    actorName: string;
    actorAvatar?: string | null;
    commentId: string | number;
    movieSlug?: string;
    content: string;
}) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        if (!supabaseUrl || !supabaseServiceKey) {
            return { success: false, error: "Missing Supabase configuration" };
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Kiểm tra trong DB xem đã từng có thông báo Like nào từ actorName cho comment này chưa
        const { data: existing } = await supabase
            .from('user_notifications')
            .select('id')
            .eq('user_id', recipientUserId)
            .eq('comment_id', String(commentId))
            .eq('actor_name', actorName)
            .eq('type', 'like')
            .limit(1);

        if (existing && existing.length > 0) {
            // Đã có thông báo rồi -> Bỏ qua, không gửi trùng lặp
            return { success: true, isDuplicate: true };
        }

        // 2. Nếu chưa có -> Tạo mới 1 thông báo
        const { error } = await supabase.from('user_notifications').insert({
            user_id: recipientUserId,
            actor_name: actorName,
            actor_avatar: actorAvatar || null,
            type: 'like',
            comment_id: String(commentId),
            movie_slug: movieSlug || '',
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });

        if (error) {
            console.error("Error creating like notification:", error);
            return { success: false, error: error.message };
        }

        return { success: true, isDuplicate: false };
    } catch (err: any) {
        console.error("sendLikeNotification server action error:", err);
        return { success: false, error: err.message };
    }
}
