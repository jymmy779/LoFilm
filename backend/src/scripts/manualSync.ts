import dotenv from "dotenv";
dotenv.config();

import { syncTaxonomies, syncIncremental } from "../services/syncService.js";
import { prisma } from "../lib/prisma.js";

async function main() {
  console.log("?? [Manual Sync] B?t d?u d?ng b? t?c thì...");
  const pages = Number(process.argv[2]) || 3;
  
  await syncTaxonomies();
  const res = await syncIncremental(pages);

  console.log("\n?? K?t qu?:", res);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("? L?i:", e);
  await prisma.$disconnect();
  process.exit(1);
});
