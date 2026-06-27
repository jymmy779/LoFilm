"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";

export default function AuthListener() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Catch password recovery event
      if (event === "PASSWORD_RECOVERY") {
        toast.success("Hệ thống đã sẵn sàng để bạn đặt lại mật khẩu!");
        localStorage.removeItem('lofilm-guest-watch-history');
        router.push("/dat-lai-mat-khau");
        router.refresh(); // Ép Next.js tải lại server state (cookie) để Header cập nhật Account B
      }
      
      if (event === "SIGNED_IN") {
        if (session?.user) {
          try {
            const GUEST_HISTORY_KEY = 'lofilm-guest-watch-history';
            const historyStr = localStorage.getItem(GUEST_HISTORY_KEY);
            if (historyStr) {
              const history = JSON.parse(historyStr);
              const items = Object.values(history);
              if (items.length > 0) {
                // Migrate to Supabase
                const upsertPromises = items.map((item: any) => 
                  supabase.from('watch_history').upsert({
                    user_id: session.user.id,
                    movie_slug: item.movie_slug,
                    movie_name: item.movie_name,
                    movie_poster: item.movie_poster,
                    episode_name: item.episode_name,
                    episode_slug: item.episode_slug,
                    watched_seconds: item.watched_seconds,
                    duration: item.duration,
                    updated_at: new Date(item.updated_at).toISOString()
                  }, { onConflict: 'user_id,movie_slug,episode_slug' })
                );
                await Promise.all(upsertPromises);
              }
              // Xóa thùng của khách sau khi đã đồng bộ
              localStorage.removeItem(GUEST_HISTORY_KEY);
            }
          } catch (error) {
            console.error("Lỗi khi đồng bộ lịch sử xem của khách vào tài khoản:", error);
          }
        }

        // If we have a recovery token in the URL fragment
        if (window.location.hash.includes("type=recovery") || window.location.hash.includes("access_token=")) {
          localStorage.removeItem('lofilm-guest-watch-history');
          router.push("/dat-lai-mat-khau");
          router.refresh();
        }
      }

      if (event === "SIGNED_OUT") {
        // Đăng xuất thì dọn dẹp sạch sẽ lịch sử khách để người sau dùng máy không bị thấy
        localStorage.removeItem('lofilm-guest-watch-history');
      }
    });

    // Also check on mount if we're on home with a recovery hash
    if (window.location.hash.includes("type=recovery")) {
      router.push("/dat-lai-mat-khau");
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return null;
}
