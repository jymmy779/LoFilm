"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import nProgress from "nprogress";
import "nprogress/nprogress.css";

// Cấu hình NProgress
nProgress.configure({ 
  showSpinner: false,
  easing: 'ease',
  speed: 500,
  minimum: 0.3
});

export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Khi pathname hoặc searchParams thay đổi (đã sang trang mới), dừng thanh tiến trình
  useEffect(() => {
    nProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Lắng nghe tất cả các cú click vào thẻ <a> trên toàn hệ thống
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLAnchorElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      
      // Chỉ chạy progress bar nếu là link nội bộ, không phải link cùng mã hash (#) 
      // và không phải là trang hiện tại (bao gồm cả search params)
      if (
        href && 
        href.startsWith("/") && 
        !href.startsWith("#") &&
        href !== currentFullUrl && 
        anchor.target !== "_blank" &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
      ) {
        nProgress.start();
      }
    };

    window.addEventListener("click", handleAnchorClick);
    return () => window.removeEventListener("click", handleAnchorClick);
  }, [pathname, searchParams]); // <--- Thêm searchParams vào dependency

  return (
    <style jsx global>{`
      #nprogress .bar {
        background: #f5a623 !important; /* Màu hổ phách của LoFilm */
        height: 3px !important;
        box-shadow: 0 0 10px #f5a623, 0 0 5px #f5a623 !important;
      }
      #nprogress .peg {
        box-shadow: 0 0 10px #f5a623, 0 0 5px #f5a623 !important;
      }
    `}</style>
  );
}
