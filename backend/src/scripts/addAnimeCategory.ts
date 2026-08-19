import { prisma } from "../lib/prisma.js";

async function main() {
  console.log("?? Ðang thêm th? lo?i 'Ho?t Hình' vào Database...");

  // 1. T?o ho?c c?p nh?t Category "Ho?t Hình"
  const cat = await prisma.category.upsert({
    where: { slug: "hoat-hinh" },
    update: { name: "Ho?t Hình" },
    create: { name: "Ho?t Hình", slug: "hoat-hinh" },
  });

  console.log(`? Ðã t?o/c?p nh?t th? lo?i: ${cat.name} (id: ${cat.id}, slug: ${cat.slug})`);

  // 2. Tìm t?t c? phim ho?t hình (type = 'hoathinh') trong Database
  const animeMovies = await prisma.movie.findMany({
    where: {
      type: "hoathinh",
    },
    select: {
      id: true,
      name: true,
    },
  });

  console.log(`?? Tìm th?y ${animeMovies.length.toLocaleString()} b? phim ho?t hình d? g?n nhãn...`);

  // 3. G?n liên k?t MovieCategory hàng lo?t
  let linked = 0;
  for (const m of animeMovies) {
    await prisma.movieCategory.upsert({
      where: {
        movie_id_category_id: {
          movie_id: m.id,
          category_id: cat.id,
        },
      },
      update: {},
      create: {
        movie_id: m.id,
        category_id: cat.id,
      },
    });
    linked++;
  }

  console.log(`?? Ðã liên k?t thành công ${linked.toLocaleString()} phim vào th? lo?i 'Ho?t Hình'!`);

  await prisma.$disconnect();
}

main().catch(console.error);
