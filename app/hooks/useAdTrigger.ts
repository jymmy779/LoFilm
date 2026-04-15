"use client"

const DIRECT_LINK = "https://www.profitablecpmratenetwork.com/gjpjtakf?key=d7e338d56830d226ea3f31e0ab349478";
const AD_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours
const ENABLE_ADS = false; // Bật lại hệ thống ads

export function useAdTrigger() {

    const openAdOnly = (zoneKey: string) => {
        if (!ENABLE_ADS) return;

        // Đưa danh sách lọc vào đây
        const allowedZones = [
            "movie_row", "top_movie", "movie_poster_row",
            "category_tab", "country_tab", "wide_movie_row"
        ];

        // Nếu truyền vào zone rác (như "hero_slider") thì chặn luôn
        if (!allowedZones.includes(zoneKey)) return;

        const STORAGE_KEY = `ad_${zoneKey}`;
        const lastAdTime = localStorage.getItem(STORAGE_KEY);
        const currentTime = Date.now();

        if (!lastAdTime || (currentTime - parseInt(lastAdTime)) > AD_COOLDOWN) {
            window.open(DIRECT_LINK, '_blank', 'noopener,noreferrer');
            localStorage.setItem(STORAGE_KEY, currentTime.toString());
        }
    };

    return { openAdOnly };
}
