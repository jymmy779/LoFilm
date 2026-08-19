import cron from "node-cron";
import { syncTaxonomies, syncIncremental } from "./syncService.js";

let isSyncRunning = false;

/**
 * Start background cron jobs
 */
export function startCronJobs() {
  const schedule = process.env.SYNC_CRON_SCHEDULE || "*/15 * * * *";

  console.log(`[Cron] Auto-sync scheduled with frequency: "${schedule}"`);

  // Initial sync for taxonomies
  syncTaxonomies().catch((err) => console.error("[Cron Init] Sync taxonomies error:", err.message));

  // Periodic cronjob
  cron.schedule(schedule, async () => {
    if (isSyncRunning) {
      console.warn("[Cron] Previous sync is still running, skipping this turn.");
      return;
    }

    isSyncRunning = true;
    try {
      console.log(`[Cron Trigger] Auto-sync started at: ${new Date().toLocaleTimeString("vi-VN")}`);
      await syncIncremental(3);
    } catch (err: any) {
      console.error("[Cron Error] Error during auto-sync:", err.message);
    } finally {
      isSyncRunning = false;
    }
  });
}
