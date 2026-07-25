"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

export default function AdsterraSocialBar() {
  const [shouldLoadAd, setShouldLoadAd] = useState(false);

  useEffect(() => {
    // Thời gian chờ: 2 tiếng (tối ưu doanh thu cho traffic 1k)
    const COOLDOWN_TIME = 2 * 60 * 60 * 1000;
    
    try {
      const lastShown = localStorage.getItem("adsterra_socialbar_last_shown");
      const now = Date.now();

      if (!lastShown || now - parseInt(lastShown, 10) > COOLDOWN_TIME) {
        // Đã qua 2 tiếng hoặc chưa từng hiện -> Cho phép nạp mã quảng cáo
        setShouldLoadAd(true);
        // Lưu lại thời điểm nạp mã hiện tại
        localStorage.setItem("adsterra_socialbar_last_shown", now.toString());
      }
    } catch (e) {
      // Fallback nếu trình duyệt chặn localStorage (ví dụ: Private Mode)
      setShouldLoadAd(true);
    }
  }, []);

  // Nếu chưa đủ 2 tiếng, return null để KHÔNG nạp bất cứ mã Adsterra nào
  if (!shouldLoadAd) return null;

  return (
    <Script
      src="https://pl29441602.profitablecpmratenetwork.com/bc/f4/8c/bcf48c95c7e9337ee7ff8c3ff7acb1c8.js"
      strategy="afterInteractive"
    />
  );
}
