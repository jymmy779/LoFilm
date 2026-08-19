import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma.js";
import {
  fetchKKPhimCategories,
  fetchKKPhimCountries,
  fetchKKPhimUpdatedPage,
  fetchKKPhimMovieDetail,
  KKPhimDetailResponse,
} from "./kkphimClient.js";

const STATE_FILE_PATH = path.resolve(process.cwd(), ".sync_state.json");

interface SyncState {
  last_seed_page: number;
  total_seeded: number;
  last_sync_time: string;
}

function loadSyncState(): SyncState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch {}
  return { last_seed_page: 1, total_seeded: 0, last_sync_time: "" };
}

function saveSyncState(state: SyncState) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err: any) {
    console.error("[SyncState] Không th? luu state:", err.message);
  }
}

/**
 * 1. Ð?ng b? Th? Lo?i & Qu?c Gia t? KKPhim
 */
export async function syncTaxonomies() {
  console.log("?? [Taxonomies] B?t d?u d?ng b? Th? lo?i & Qu?c gia...");

  const [categories, countries] = await Promise.all([
    fetchKKPhimCategories(),
    fetchKKPhimCountries(),
  ]);

  // Upsert Categories
  let catCount = 0;
  for (const cat of categories) {
    if (!cat.slug) continue;
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
    catCount++;
  }

  // Upsert Countries
  let countryCount = 0;
  for (const country of countries) {
    if (!country.slug) continue;
    await prisma.country.upsert({
      where: { slug: country.slug },
      update: { name: country.name },
      create: { name: country.name, slug: country.slug },
    });
    countryCount++;
  }

  console.log(`? [Taxonomies] Ðã d?ng b? ${catCount} th? lo?i và ${countryCount} qu?c gia.`);
}

/**
 * 2. Upsert thông minh 1 b? phim kèm toàn b? Server & T?p phim
 */
export async function upsertMovieDetail(detail: KKPhimDetailResponse): Promise<boolean> {
  const { movie: m, episodes: servers } = detail;
  if (!m || !m.slug) return false;

  try {
    const serverModified = m.modified?.time ? new Date(m.modified.time) : new Date();

    // 1. Upsert b?ng Movie
    const movieRecord = await prisma.movie.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        origin_name: m.origin_name,
        content: m.content || "",
        type: m.type || "single",
        status: m.status || "ongoing",
        thumb_url: m.thumb_url || "",
        poster_url: m.poster_url || "",
        is_copyright: m.is_copyright ?? false,
        sub_docquyen: m.sub_docquyen ?? false,
        chieurap: m.chieurap ?? false,
        trailer_url: m.trailer_url || "",
        time: m.time || "",
        episode_current: m.episode_current || "",
        episode_total: String(m.episode_total || ""),
        quality: m.quality || "HD",
        lang: m.lang || "Vietsub",
        notify: m.notify || "",
        showtimes: m.showtimes || "",
        year: m.year ? Number(m.year) : null,
        view_count: m.view || 0,
        tmdb_id: m.tmdb?.id ? String(m.tmdb.id) : null,
        tmdb_type: m.tmdb?.type || null,
        tmdb_vote_average: m.tmdb?.vote_average ? Number(m.tmdb.vote_average) : null,
        tmdb_vote_count: m.tmdb?.vote_count ? Number(m.tmdb.vote_count) : null,
        actors: JSON.stringify(Array.isArray(m.actor) ? m.actor.filter(Boolean) : []),
        directors: JSON.stringify(Array.isArray(m.director) ? m.director.filter(Boolean) : []),
        server_modified: serverModified,
      },
      create: {
        slug: m.slug,
        name: m.name,
        origin_name: m.origin_name,
        content: m.content || "",
        type: m.type || "single",
        status: m.status || "ongoing",
        thumb_url: m.thumb_url || "",
        poster_url: m.poster_url || "",
        is_copyright: m.is_copyright ?? false,
        sub_docquyen: m.sub_docquyen ?? false,
        chieurap: m.chieurap ?? false,
        trailer_url: m.trailer_url || "",
        time: m.time || "",
        episode_current: m.episode_current || "",
        episode_total: String(m.episode_total || ""),
        quality: m.quality || "HD",
        lang: m.lang || "Vietsub",
        notify: m.notify || "",
        showtimes: m.showtimes || "",
        year: m.year ? Number(m.year) : null,
        view_count: m.view || 0,
        tmdb_id: m.tmdb?.id ? String(m.tmdb.id) : null,
        tmdb_type: m.tmdb?.type || null,
        tmdb_vote_average: m.tmdb?.vote_average ? Number(m.tmdb.vote_average) : null,
        tmdb_vote_count: m.tmdb?.vote_count ? Number(m.tmdb.vote_count) : null,
        actors: JSON.stringify(Array.isArray(m.actor) ? m.actor.filter(Boolean) : []),
        directors: JSON.stringify(Array.isArray(m.director) ? m.director.filter(Boolean) : []),
        server_modified: serverModified,
      },
    });

    const movieId = movieRecord.id;

    // 2. Đồng bộ Thể loại (MovieCategory)
    const categorySlugsToLink = new Set<string>();
    if (Array.isArray(m.category)) {
      m.category.forEach((cat: any) => { if (cat.slug) categorySlugsToLink.add(cat.slug); });
    }
    if (m.type === "hoathinh") {
      categorySlugsToLink.add("hoat-hinh");
    }

    for (const catSlug of categorySlugsToLink) {
      const categoryRecord = await prisma.category.findUnique({
        where: { slug: catSlug },
      });

      if (categoryRecord) {
        await prisma.movieCategory.upsert({
          where: {
            movie_id_category_id: {
              movie_id: movieId,
              category_id: categoryRecord.id,
            },
          },
          update: {},
          create: {
            movie_id: movieId,
            category_id: categoryRecord.id,
          },
        });
      }
    }

    // 3. Đồng bộ Quốc gia (MovieCountry)
    if (Array.isArray(m.country) && m.country.length > 0) {
      for (const country of m.country) {
        if (!country.slug) continue;
        const countryRecord = await prisma.country.findUnique({
          where: { slug: country.slug },
        });

        if (countryRecord) {
          await prisma.movieCountry.upsert({
            where: {
              movie_id_country_id: {
                movie_id: movieId,
                country_id: countryRecord.id,
              },
            },
            update: {},
            create: {
              movie_id: movieId,
              country_id: countryRecord.id,
            },
          });
        }
      }
    }

    // 4. Ð?ng b? Servers & Episodes
    if (Array.isArray(servers) && servers.length > 0) {
      for (const s of servers) {
        if (!s.server_name) continue;

        // Tìm ho?c t?o Server cho phim
        let serverRecord = await prisma.episodeServer.findFirst({
          where: {
            movie_id: movieId,
            server_name: s.server_name,
          },
        });

        if (!serverRecord) {
          serverRecord = await prisma.episodeServer.create({
            data: {
              movie_id: movieId,
              server_name: s.server_name,
            },
          });
        }

        // Upsert t?ng t?p phim trong server
        if (Array.isArray(s.server_data) && s.server_data.length > 0) {
          for (const ep of s.server_data) {
            if (!ep.slug) continue;

            const existingEp = await prisma.episode.findFirst({
              where: {
                server_id: serverRecord.id,
                slug: ep.slug,
              },
            });

            if (existingEp) {
              await prisma.episode.update({
                where: { id: existingEp.id },
                data: {
                  name: ep.name || existingEp.name,
                  filename: ep.filename || existingEp.filename,
                  link_m3u8: ep.link_m3u8 || existingEp.link_m3u8,
                  link_embed: ep.link_embed || existingEp.link_embed,
                },
              });
            } else {
              await prisma.episode.create({
                data: {
                  server_id: serverRecord.id,
                  name: ep.name || "T?p",
                  slug: ep.slug,
                  filename: ep.filename || "",
                  link_m3u8: ep.link_m3u8 || "",
                  link_embed: ep.link_embed || "",
                },
              });
            }
          }
        }
      }
    }

    return true;
  } catch (error: any) {
    console.error(`[SyncService] L?i upsert phim ${m.slug}:`, error.message);
    return false;
  }
}

/**
 * 3. Ð?ng b? Tang Cu?ng Ð?nh K? (Incremental Sync)
 * Quét N trang d?u c?a phim-moi-cap-nhat (m?i trang ~24 phim)
 */
export async function syncIncremental(pagesToScan = 2): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  console.log(`?? [Sync Incremental] Ðang quét ${pagesToScan} trang m?i nh?t t? KKPhim...`);
  const startTime = new Date();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let page = 1; page <= pagesToScan; page++) {
    const pageData = await fetchKKPhimUpdatedPage(page);
    if (!pageData || !pageData.items || pageData.items.length === 0) continue;

    for (const item of pageData.items) {
      if (!item.slug) continue;

      const existingMovie = await prisma.movie.findUnique({
        where: { slug: item.slug },
        select: { id: true, server_modified: true },
      });

      const remoteModifiedTime = item.modified?.time ? new Date(item.modified.time).getTime() : 0;
      const localModifiedTime = existingMovie?.server_modified ? new Date(existingMovie.server_modified).getTime() : 0;

      // N?u phim dã có và th?i gian c?p nh?t c?a server không d?i -> B? qua
      if (existingMovie && localModifiedTime >= remoteModifiedTime && remoteModifiedTime > 0) {
        skipped++;
        continue;
      }

      // Fetch chi ti?t và c?p nh?t
      const detail = await fetchKKPhimMovieDetail(item.slug);
      if (detail) {
        const ok = await upsertMovieDetail(detail);
        if (ok) {
          if (existingMovie) {
            updated++;
            console.log(`  ?? [C?p nh?t t?p/phim] ${item.name} (${item.slug})`);
          } else {
            created++;
            console.log(`  ? [Phim m?i] ${item.name} (${item.slug})`);
          }
        }
      }

      // Delay nh? 80ms gi?a các request chi ti?t
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  // Ghi log vào b?ng SyncLog
  await prisma.syncLog.create({
    data: {
      sync_type: "CRON_INCREMENTAL",
      status: "SUCCESS",
      pages_crawled: pagesToScan,
      movies_created: created,
      movies_updated: updated,
      started_at: startTime,
      finished_at: new Date(),
    },
  });

  console.log(
    `? [Sync Incremental Hoàn t?t] M?i: ${created} | C?p nh?t: ${updated} | B? qua (không d?i): ${skipped}`
  );

  return { created, updated, skipped };
}

/**
 * 4. Ð?ng b? Toàn B? 30.000 Phim (Bulk Seeder) v?i Concurrency & Resume
 */
export async function syncBulkAll(options?: {
  startPage?: number;
  maxPages?: number;
  concurrency?: number;
  onProgress?: (progress: {
    currentPage: number;
    totalPages: number;
    syncedCount: number;
    percent: string;
  }) => void;
}) {
  const state = loadSyncState();
  const startPage = options?.startPage || state.last_seed_page || 1;
  const concurrency = options?.concurrency || 5;

  console.log(`\n?? [Bulk Seeder] B?t d?u d?ng b? 30.000 phim t? Page ${startPage}...`);

  // L?y t?ng s? trang t? page 1
  const firstPageRes = await fetchKKPhimUpdatedPage(1);
  const totalPages = options?.maxPages || firstPageRes?.pagination.totalPages || 1300;
  const totalItems = firstPageRes?.pagination.totalItems || 30000;

  console.log(`?? T?ng s? trang: ${totalPages} | U?c tính phim: ~${totalItems}`);

  // 1. Ð?ng b? Taxonomies tru?c
  await syncTaxonomies();

  let totalSynced = state.total_seeded || 0;

  for (let page = startPage; page <= totalPages; page++) {
    console.log(`\n?? [Ðang cào Page ${page}/${totalPages}]...`);
    const pageData = await fetchKKPhimUpdatedPage(page);

    if (!pageData || !pageData.items || pageData.items.length === 0) {
      console.warn(`?? Page ${page} không có d? li?u ho?c l?i m?ng, ti?p t?c trang sau.`);
      continue;
    }

    const items = pageData.items;

    // X? lý theo t?ng chunk concurrency (5 phim cùng lúc)
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);

      await Promise.all(
        chunk.map(async (item) => {
          if (!item.slug) return;

          // Ki?m tra phim dã có và chua thay d?i -> skip
          const existing = await prisma.movie.findUnique({
            where: { slug: item.slug },
            select: { id: true, server_modified: true },
          });

          const remoteMod = item.modified?.time ? new Date(item.modified.time).getTime() : 0;
          const localMod = existing?.server_modified ? new Date(existing.server_modified).getTime() : 0;

          if (existing && localMod >= remoteMod && remoteMod > 0) {
            return;
          }

          const detail = await fetchKKPhimMovieDetail(item.slug);
          if (detail) {
            const ok = await upsertMovieDetail(detail);
            if (ok) totalSynced++;
          }
        })
      );

      // Delay nh? 100ms gi?a các chunk d? an toàn tuy?t d?i
      await new Promise((r) => setTimeout(r, 100));
    }

    // Luu tr?ng thái sau m?i trang d? có th? resume n?u cúp di?n/m?t m?ng
    saveSyncState({
      last_seed_page: page + 1,
      total_seeded: totalSynced,
      last_sync_time: new Date().toISOString(),
    });

    const percent = (((page / totalPages) * 100).toFixed(1) + "%");
    console.log(`  ?? [Ti?n d?: ${percent}] Ðã luu ${totalSynced} phim vào Database.`);

    options?.onProgress?.({
      currentPage: page,
      totalPages,
      syncedCount: totalSynced,
      percent,
    });
  }

  console.log(`\n?? [Bulk Seeder] Hoàn thành d?ng b? toàn b? ${totalSynced} phim!`);
}

