"use client"

import { useRouter } from "next/navigation";
import nProgress from "nprogress";

const DIRECT_LINK = "https://www.profitablecpmratenetwork.com/gjpjtakf?key=d7e338d56830d226ea3f31e0ab349478";
const AD_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours
const ENABLE_ADS = false; // Bật lại hệ thống ads

let isNavigating = false;

export function useAdTrigger() {
    const router = useRouter();

    const openAdOnly = (zoneKey: string) => {
        if (!ENABLE_ADS) return;
        const STORAGE_KEY = `ad_${zoneKey}`;
        const lastAdTime = localStorage.getItem(STORAGE_KEY);
        const currentTime = Date.now();

        if (!lastAdTime || (currentTime - parseInt(lastAdTime)) > AD_COOLDOWN) {
            window.open(DIRECT_LINK, '_blank', 'noopener,noreferrer');
            localStorage.setItem(STORAGE_KEY, currentTime.toString());
        }
    };

    const triggerAd = (path: string, zoneKey: string) => {
        if (isNavigating) return;

        isNavigating = true;
        setTimeout(() => { isNavigating = false; }, 800);

        if (ENABLE_ADS) {
            // Danh sách các zone ĐƯỢC PHÉP hiển thị quảng cáo (xác định chính xác theo yêu cầu)
            // Lọc ra các zone rác như "movie_card", "popup_play", "popup_detail", "hero_slider", ...
            const allowedZones = [
                "movie_row",
                "top_movie",
                "movie_poster_row",
                "category_tab",
                "country_tab"
            ];

            // Chỉ nếu zone được liệt kê trong Allowed thì mới mở quảng cáo
            // Nhờ đó xoá triệt để rác ad ở Sidebar, HeroSlider, trang Nội dung, v.v.
            if (allowedZones.includes(zoneKey)) {
                openAdOnly(zoneKey);
            }
        }

        nProgress.start();
        router.push(path);
    };

    return { triggerAd, openAdOnly };
}
