"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * WakeUpMonitor: Theo dõi khi người dùng quay lại tab sau một thời gian dài.
 * Nếu vắng mặt > 15 phút, tự động làm mới dữ liệu để tránh trang bị trống hoặc treo.
 */
export default function WakeUpMonitor() {
  const router = useRouter();
  const lastActiveRef = useRef<number>(Date.now());
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 phút

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        const timeSinceLastActive = now - lastActiveRef.current;

        // Nếu người dùng quay lại sau hơn 15 phút
        if (timeSinceLastActive > REFRESH_THRESHOLD) {
          console.log(`[WakeUpMonitor] User returned after ${Math.round(timeSinceLastActive / 1000 / 60)} mins. Refreshing data...`);
          
          // Sử dụng router.refresh() để Next.js lấy lại dữ liệu Server Components 
          // mà không làm trắng trang (flicker)
          router.refresh();
          
          // Cập nhật lại thời gian active
          lastActiveRef.current = now;
        }
      } else {
        // Khi người dùng thoát tab/ẩn trình duyệt, ghi lại thời điểm cuối cùng
        lastActiveRef.current = Date.now();
      }
    };

    // Lắng nghe sự kiện thay đổi trạng thái hiển thị của trang
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Lắng nghe sự kiện quay lại từ Back/Forward Cache (Mobile hay dùng cái này)
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        console.log("[WakeUpMonitor] Page restored from bfcache. Refreshing...");
        router.refresh();
      }
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", () => {});
    };
  }, [router]);

  // Component này không render gì ra UI
  return null;
}
