import cron from "node-cron";
import { syncTaxonomies, syncIncremental } from "./syncService.js";

let isSyncRunning = false;

/**
 * Kh?i d?ng ti?n trình Cronjob ch?y ng?m
 */
export function startCronJobs() {
  const schedule = process.env.SYNC_CRON_SCHEDULE || "*/15 * * * *"; // M?c d?nh m?i 15 phút

  console.log(`? [Cron] Ðã lên l?ch t? d?ng d?ng b? KKPhim v?i t?n su?t: "${schedule}"`);

  // Ð?ng b? Th? lo?i & Qu?c gia khi server v?a b?t
  syncTaxonomies().catch((err) => console.error("[Cron Init] L?i sync taxonomies:", err.message));

  // Cron d?nh k?
  cron.schedule(schedule, async () => {
    if (isSyncRunning) {
      console.warn("?? [Cron] Lu?t d?ng b? tru?c dang ch?y, b? qua lu?t này d? tránh trùng l?p.");
      return;
    }

    isSyncRunning = true;
    try {
      console.log(`\n?? [Cron Trigger] B?t d?u d?ng b? t? d?ng lúc: ${new Date().toLocaleTimeString("vi-VN")}`);
      await syncIncremental(3); // Quét 3 trang m?i nh?t (~72 phim g?n nh?t)
    } catch (err: any) {
      console.error("? [Cron Error] L?i trong quá trình d?ng b?:", err.message);
    } finally {
      isSyncRunning = false;
    }
  });
}
