"use client";

import { useEffect } from "react";

/**
 * PopunderAd Component
 * This component manages the frequency capping (6 hours) for the Adsterra Popunder script.
 * It's loaded globally via the RootLayout.
 */
export default function PopunderAd() {
  useEffect(() => {
    const AD_INTERVAL = 6 * 60 * 60 * 1000;
    const STORAGE_KEY = "last_lofilm_popunder_time";

    const triggerAd = (e: MouseEvent) => {
      const now = Date.now();
      const lastAdTime = localStorage.getItem(STORAGE_KEY);

      // Chỉ kích hoạt nếu đã quá 6 tiếng
      if (!lastAdTime || now - parseInt(lastAdTime) > AD_INTERVAL) {
        // Tìm xem phần tử bị nhấn có phải là thẻ phim không
        // Chúng ta kiểm tra nếu click vào thẻ <a> hoặc con của <a> có href chứa "/phim/"
        const target = e.target as HTMLElement;
        const link = target.closest("a");
        
        if (link && link.getAttribute("href")?.includes("/phim/")) {
          console.log("LoFilm Ad: Movie card clicked. Activating Popunder...");
          
          // 1. Lưu thời gian khóa 6 tiếng
          localStorage.setItem(STORAGE_KEY, now.toString());

          // 2. Nạp script Adsterra
          const script = document.createElement("script");
          script.src = "https://pl29084742.profitablecpmratenetwork.com/d4/fa/74/d4fa748b3045de0442f516eb75f53596.js";
          script.async = true;
          document.body.appendChild(script);

          // 3. Xóa sự kiện lắng nghe
          window.removeEventListener("mousedown", triggerAd);
        }
      }
    };

    const now = Date.now();
    const lastAdTime = localStorage.getItem(STORAGE_KEY);

    // Chỉ lắng nghe Click nếu đã hết thời gian chờ 6 tiếng
    if (!lastAdTime || now - parseInt(lastAdTime) > AD_INTERVAL) {
      window.addEventListener("mousedown", triggerAd, { passive: true });
    } else {
      console.log("LoFilm Ad: Safety mode active. No ads for next 6 hours.");
    }

    return () => window.removeEventListener("mousedown", triggerAd);
  }, []);

  return null;
}
