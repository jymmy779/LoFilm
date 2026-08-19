import { prisma } from "../lib/prisma.js";
import axios from "axios";

async function main() {
  console.log("?? B?t d?u chu?n hóa Th? lo?i & Qu?c gia chu?n KKPhim + Custom...");

  const [catRes, counRes] = await Promise.all([
    axios.get("https://phimapi.com/v1/api/the-loai"),
    axios.get("https://phimapi.com/v1/api/quoc-gia"),
  ]);

  const standardCategories: { name: string; slug: string }[] = [
    ...(catRes.data?.data?.items || []),
    { name: "Ho?t Hình", slug: "hoat-hinh" }
  ];
  const standardCountries: { name: string; slug: string }[] = counRes.data?.data?.items || [];

  console.log(`?? Danh m?c: ${standardCategories.length} th? lo?i và ${standardCountries.length} qu?c gia chu?n.`);

  for (const cat of standardCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
  }

  for (const coun of standardCountries) {
    await prisma.country.upsert({
      where: { slug: coun.slug },
      update: { name: coun.name },
      create: { name: coun.name, slug: coun.slug },
    });
  }

  const validCountrySlugs = new Set(standardCountries.map(c => c.slug));
  const validCategorySlugs = new Set(standardCategories.map(c => c.slug));

  const allDbCountries = await prisma.country.findMany();
  for (const c of allDbCountries) {
    if (!validCountrySlugs.has(c.slug)) {
      await prisma.country.delete({ where: { id: c.id } });
    }
  }

  const allDbCategories = await prisma.category.findMany();
  for (const cat of allDbCategories) {
    if (!validCategorySlugs.has(cat.slug)) {
      await prisma.category.delete({ where: { id: cat.id } });
    }
  }

  console.log("? Hoàn t?t chu?n hóa taxonomy.");
  await prisma.$disconnect();
}

main().catch(console.error);
