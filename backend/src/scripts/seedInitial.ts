import dotenv from "dotenv";
dotenv.config();

import { syncBulkAll } from "../services/syncService.js";
import { prisma } from "../lib/prisma.js";

async function main() {
  console.log("=================================================");
  console.log("?? LOFILM — CÔNG C? Ð?NG B? 30.000 PHIM (BULK SEEDER)");
  console.log("=================================================");

  const startPage = process.argv[2] ? Number(process.argv[2]) : undefined;
  const maxPages = process.argv[3] ? Number(process.argv[3]) : undefined;

  await syncBulkAll({
    startPage,
    maxPages,
    concurrency: 5,
  });

  await prisma.$disconnect();
  console.log("\n?? [Hoàn thành] Ðã ng?t k?t n?i Database an toàn.");
  process.exit(0);
}

main().catch(async (e) => {
  console.error("? L?i nghiêm tr?ng khi Seed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
