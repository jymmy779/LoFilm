import assert from "node:assert/strict";
import { fetchKKPhimCategories, fetchKKPhimCountries, fetchKKPhimUpdatedPage, fetchKKPhimMovieDetail } from "../services/kkphimClient.js";

async function runTests() {
  console.log("\n?? ==========================================");
  console.log("   B?T Ğ?U KI?M TH? H? TH?NG BACKEND LOFILM");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ? PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.log(`  ? FAIL: ${name}`);
      console.log(`         ${err.message}`);
      failed++;
    }
  }

  // TEST 1: KKPhim Client Categories
  await test("1. KKPhim Client - L?y danh sách th? lo?i (/the-loai)", async () => {
    const cats = await fetchKKPhimCategories();
    assert.ok(Array.isArray(cats), "Ph?i tr? v? m?ng th? lo?i");
    assert.ok(cats.length > 0, "Danh sách th? lo?i không du?c r?ng");
    assert.ok(cats[0].name && cats[0].slug, "Th? lo?i ph?i có name và slug");
  });

  // TEST 2: KKPhim Client Countries
  await test("2. KKPhim Client - L?y danh sách qu?c gia (/quoc-gia)", async () => {
    const countries = await fetchKKPhimCountries();
    assert.ok(Array.isArray(countries), "Ph?i tr? v? m?ng qu?c gia");
    assert.ok(countries.length > 0, "Danh sách qu?c gia không du?c r?ng");
    assert.ok(countries[0].name && countries[0].slug, "Qu?c gia ph?i có name và slug");
  });

  // TEST 3: KKPhim Client Pagination
  await test("3. KKPhim Client - Quét trang m?i c?p nh?t (/danh-sach/phim-moi-cap-nhat)", async () => {
    const pageData = await fetchKKPhimUpdatedPage(1);
    assert.ok(pageData, "Ph?i nh?n du?c response phân trang");
    assert.ok(pageData.items && pageData.items.length > 0, "Ph?i có danh sách phim");
    assert.ok(pageData.pagination.totalPages > 0, "TotalPages ph?i > 0");
  });

  // TEST 4: KKPhim Client Movie Detail & Episodes
  await test("4. KKPhim Client - Chi ti?t phim & danh sách t?p", async () => {
    const pageData = await fetchKKPhimUpdatedPage(1);
    const firstSlug = pageData?.items[0]?.slug;
    assert.ok(firstSlug, "Ph?i có slug phim d?u tiên d? test");

    const detail = await fetchKKPhimMovieDetail(firstSlug);
    assert.ok(detail, "Ph?i l?y du?c detail phim");
    assert.ok(detail.movie && detail.movie.name, "Ph?i có movie metadata");
    assert.ok(Array.isArray(detail.episodes), "Ph?i có m?ng episodes/servers");
  });

  console.log("\n==========================================");
  console.log(`?? K?t qu? ki?m th?: ${passed}/${passed + failed} bài test PASS`);
  console.log("==========================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
