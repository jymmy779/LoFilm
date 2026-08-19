import { prisma } from "../lib/prisma.js";

async function main() {
  const movieCount = await prisma.movie.count();
  const epCount = await prisma.episode.count();
  const serverCount = await prisma.episodeServer.count();
  const catCount = await prisma.category.count();
  const countryCount = await prisma.country.count();

  console.log("==========================================");
  console.log("?? TH?NG KÊ DATABASE LOFILM HI?N T?I:");
  console.log(`?? T?ng s? phim:       ${movieCount.toLocaleString()} phim`);
  console.log(`?? T?ng s? t?p phim:   ${epCount.toLocaleString()} t?p`);
  console.log(`???  T?ng s? server:     ${serverCount.toLocaleString()} servers`);
  console.log(`???  Th? lo?i:           ${catCount} th? lo?i`);
  console.log(`?? Qu?c gia:           ${countryCount} qu?c gia`);
  console.log("==========================================");

  await prisma.$disconnect();
}

main();
