"use client"

import { useRouter } from "next/navigation";
import nProgress from "nprogress";

const DIRECT_LINK = "https://www.profitablecpmratenetwork.com/spiq19tyef?key=d39f70b4dd9f52658e17b3f334f9e49a";
const AD_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours

export function useAdTrigger() {
    const router = useRouter();

    const triggerAd = (path: string, zoneKey: string) => {
        const STORAGE_KEY = `adsterra_last_opened_${zoneKey}`;
        const lastAdTime = localStorage.getItem(STORAGE_KEY);
        const currentTime = Date.now();

        if (!lastAdTime || (currentTime - parseInt(lastAdTime)) > AD_COOLDOWN) {
            window.open(DIRECT_LINK, '_blank', 'noopener,noreferrer');
            localStorage.setItem(STORAGE_KEY, currentTime.toString());
        }

        nProgress.start();
        router.push(path);
    };

    return { triggerAd };
}
