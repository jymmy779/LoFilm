"use client"

import { useRouter } from "next/navigation";
import nProgress from "nprogress";

const DIRECT_LINK = "https://www.profitablecpmratenetwork.com/gjpjtakf?key=d7e338d56830d226ea3f31e0ab349478";
const AD_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours
const ENABLE_ADS = false; // Đổi thành true để bật lại quảng cáo bất cứ lúc nào

export function useAdTrigger() {
    const router = useRouter();

    const triggerAd = (path: string, zoneKey: string) => {
        // Nếu bật quảng cáo thì mới thực hiện logic kiểm tra cooldown và mở link
        if (ENABLE_ADS) {
            const STORAGE_KEY = `adsterra_last_opened_${zoneKey}`;
            const lastAdTime = localStorage.getItem(STORAGE_KEY);
            const currentTime = Date.now();

            if (!lastAdTime || (currentTime - parseInt(lastAdTime)) > AD_COOLDOWN) {
                window.open(DIRECT_LINK, '_blank', 'noopener,noreferrer');
                localStorage.setItem(STORAGE_KEY, currentTime.toString());
            }
        }

        nProgress.start();
        router.push(path);
    };

    return { triggerAd };
}
