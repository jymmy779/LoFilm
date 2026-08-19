import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

// High-speed In-Memory Cache (RAM)
interface CacheEntry {
  data: any;
  expires: number;
}
const apiMemoryCache = new Map<string, CacheEntry>();

export function getCached(key: string): any | null {
  const item = apiMemoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    apiMemoryCache.delete(key);
    return null;
  }
  return item.data;
}

export function setCache(key: string, data: any, ttlSec: number = 60) {
  if (apiMemoryCache.size > 3000) {
    const firstKey = apiMemoryCache.keys().next().value;
    if (firstKey) apiMemoryCache.delete(firstKey);
  }
  apiMemoryCache.set(key, { data, expires: Date.now() + ttlSec * 1000 });
}

export function clearApiMemoryCache() {
  apiMemoryCache.clear();
}

// Helper chuyển đổi Movie record từ DB sang format tương thích LoFilm
function formatMovieSummary(m: any) {
  return {
    _id: m.id,
    id: m.id,
    name: m.name,
    slug: m.slug,
    origin_name: m.origin_name || "",
    thumb_url: m.thumb_url || "",
    poster_url: m.poster_url || "",
    type: m.type || "single",
    status: m.status || "ongoing",
    episode_current: m.episode_current || "",
    episode_total: m.episode_total || "",
    quality: m.quality || "HD",
    lang: m.lang || "Vietsub",
    year: m.year,
    time: m.time || "",
    chieurap: m.chieurap,
    sub_docquyen: m.sub_docquyen,
    view: m.view_count || 0,
    tmdb: m.tmdb_id ? {
      id: m.tmdb_id,
      type: m.tmdb_type || "",
      vote_average: m.tmdb_vote_average || 0,
      vote_count: m.tmdb_vote_count || 0,
    } : undefined,
    category: m.categories ? m.categories.map((c: any) => ({
      id: c.category.id,
      name: c.category.name,
      slug: c.category.slug,
    })) : [],
    country: m.countries ? m.countries.map((c: any) => ({
      id: c.country.id,
      name: c.country.name,
      slug: c.country.slug,
    })) : [],
    modified: {
      time: m.updated_at ? m.updated_at.toISOString() : new Date().toISOString(),
    },
  };
}

/**
 * GET /api/v1/phim/:slug
 * Lấy chi tiết đầy đủ 1 bộ phim kèm servers & episodes
 */
export async function getMovieDetail(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ status: false, msg: "Thiếu slug phim" });
    }

    const cacheKey = `movie_detail:${slug}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const movie = await prisma.movie.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        countries: { include: { country: true } },
        episodes: {
          include: {
            server_data: {
              orderBy: { name: "asc" },
            },
          },
        },
      },
    });

    if (!movie) {
      return res.status(404).json({ status: false, msg: "Không tìm thấy phim" });
    }

    // Tăng lượt view nhẹ nhàng
    prisma.movie.update({
      where: { id: movie.id },
      data: { view_count: { increment: 1 } },
    }).catch(() => {});

    // Format theo chuẩn KKPhim response
    const formattedMovie = {
      _id: movie.id,
      id: movie.id,
      name: movie.name,
      slug: movie.slug,
      origin_name: movie.origin_name || "",
      content: movie.content || "",
      type: movie.type || "single",
      status: movie.status || "ongoing",
      thumb_url: movie.thumb_url || "",
      poster_url: movie.poster_url || "",
      is_copyright: movie.is_copyright,
      sub_docquyen: movie.sub_docquyen,
      chieurap: movie.chieurap,
      trailer_url: movie.trailer_url || "",
      time: movie.time || "",
      episode_current: movie.episode_current || "",
      episode_total: movie.episode_total || "",
      quality: movie.quality || "HD",
      lang: movie.lang || "Vietsub",
      notify: movie.notify || "",
      showtimes: movie.showtimes || "",
      year: movie.year,
      view: movie.view_count,
      actor: (() => { try { return typeof movie.actors === 'string' ? JSON.parse(movie.actors) : movie.actors; } catch { return []; } })(),
      director: (() => { try { return typeof movie.directors === 'string' ? JSON.parse(movie.directors) : movie.directors; } catch { return []; } })(),
      category: movie.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug,
      })),
      country: movie.countries.map((c) => ({
        id: c.country.id,
        name: c.country.name,
        slug: c.country.slug,
      })),
      tmdb: movie.tmdb_id ? {
        id: movie.tmdb_id,
        type: movie.tmdb_type || "",
        vote_average: movie.tmdb_vote_average || 0,
        vote_count: movie.tmdb_vote_count || 0,
      } : undefined,
      modified: {
        time: movie.updated_at.toISOString(),
      },
    };

    const formattedEpisodes = movie.episodes.map((s) => ({
      server_name: s.server_name,
      server_data: s.server_data.map((ep) => ({
        name: ep.name,
        slug: ep.slug,
        filename: ep.filename || "",
        link_embed: ep.link_embed || "",
        link_m3u8: ep.link_m3u8 || "",
      })),
    }));

    const result = {
      status: true,
      msg: "Thành công",
      movie: formattedMovie,
      episodes: formattedEpisodes,
    };

    // Cache in RAM for 120 seconds
    setCache(cacheKey, result, 120);

    return res.json(result);
  } catch (error: any) {
    console.error("[API Movie Detail] Lỗi:", error.message);
    return res.status(500).json({ status: false, msg: error.message });
  }
}

/**
 * GET /api/v1/danh-sach/:type hoặc GET /api/v1/movies
 * Phân trang danh sách catalog theo loại, thể loại, quốc gia, năm, sắp xếp
 */
export async function getCatalog(req: Request, res: Response) {
  try {
    const { type, slug } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
    const skip = (page - 1) * limit;

    const queryType = (req.query.type as string) || (type && !type.includes("phim-moi") && !["the-loai", "quoc-gia", "movies", "all"].includes(type) ? type : undefined);
    const categorySlug = (req.query.category as string) || (type === "the-loai" ? slug : undefined);
    const countrySlug = (req.query.country as string) || (type === "quoc-gia" ? slug : undefined);
    const year = req.query.year ? Number(req.query.year) : undefined;
    const status = req.query.status as string;
    const sortField = (req.query.sort_field as string) || "updated_at";
    const sortType = (req.query.sort_type as string)?.toLowerCase() === "asc" ? "asc" : "desc";

    const cacheKey = `catalog:${type || ''}:${slug || ''}:${page}:${limit}:${queryType || ''}:${categorySlug || ''}:${countrySlug || ''}:${year || ''}:${status || ''}:${sortField}:${sortType}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const where: Prisma.MovieWhereInput = {};

    // Lọc theo Type
    if (queryType) {
      if (queryType === "phim-bo" || queryType === "series") where.type = "series";
      else if (queryType === "phim-le" || queryType === "single") where.type = "single";
      else if (queryType === "hoat-hinh" || queryType === "hoathinh") where.type = "hoathinh";
      else if (queryType === "tv-shows" || queryType === "tvshows") where.type = "tvshows";
      else if (queryType === "phim-chieu-rap" || queryType === "cinema") where.chieurap = true;
      else where.type = queryType;
    }

    // Lọc theo Thể loại
    if (categorySlug) {
      where.categories = {
        some: {
          category: {
            slug: categorySlug,
          },
        },
      };
    }

    // Lọc theo Quốc gia
    if (countrySlug) {
      where.countries = {
        some: {
          country: {
            slug: countrySlug,
          },
        },
      };
    }

    // Lọc theo Năm
    if (year) {
      where.year = year;
    }

    // Lọc theo Trạng thái (completed / ongoing)
    if (status) {
      if (status === "completed") {
        where.status = "completed";
      } else if (status === "ongoing") {
        where.status = "ongoing";
      }
    }

    // Sắp xếp
    let orderBy: Prisma.MovieOrderByWithRelationInput | Prisma.MovieOrderByWithRelationInput[] = [
      { server_modified: "desc" },
      { updated_at: "desc" },
    ];
    if (sortField === "view_count" || sortField === "view") {
      orderBy = [{ view_count: sortType }, { server_modified: "desc" }];
    } else if (sortField === "year") {
      orderBy = [{ year: sortType }, { server_modified: "desc" }];
    } else if (sortField === "tmdb.vote_average" || sortField === "imdb") {
      orderBy = [{ tmdb_vote_average: sortType }, { server_modified: "desc" }];
    } else if (sortField === "created_at") {
      orderBy = [{ created_at: sortType }, { server_modified: "desc" }];
    } else if (sortField === "updated_at") {
      orderBy = [{ server_modified: sortType }, { updated_at: sortType }];
    }

    const [totalItems, movies] = await Promise.all([
      prisma.movie.count({ where }),
      prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          categories: { include: { category: true } },
          countries: { include: { country: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const formattedItems = movies.map(formatMovieSummary);

    const result = {
      status: "success",
      message: "Thành công",
      data: {
        items: formattedItems,
        params: {
          type_slug: type || "",
          category_slug: categorySlug || "",
          country_slug: countrySlug || "",
          year: year || "",
          pagination: {
            totalItems,
            totalItemsPerPage: limit,
            currentPage: page,
            totalPages,
          },
        },
        APP_DOMAIN_CDN_IMAGE: "",
      },
    };

    // Cache in RAM for 60 seconds
    setCache(cacheKey, result, 60);

    return res.json(result);
  } catch (error: any) {
    console.error("[API Catalog] Lỗi:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * GET /api/v1/tim-kiem?keyword=...
 * Tìm kiếm phim không dấu / có dấu siêu tốc
 */
export async function searchMovies(req: Request, res: Response) {
  try {
    const keyword = ((req.query.keyword || req.query.q) as string || "").trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
    const skip = (page - 1) * limit;

    if (!keyword) {
      return res.json({
        status: "success",
        data: {
          items: [],
          params: {
            keyword: "",
            pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: 1, totalPages: 1 },
          },
        },
      });
    }

    const cacheKey = `search:${keyword.toLowerCase()}:${page}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const rawKeyword = keyword.toLowerCase();
    const normalizedKeyword = removeVietnameseTones(keyword).toLowerCase();
    const slugKeyword = normalizedKeyword.replace(/\s+/g, "-");

    const searchConditions: Prisma.MovieWhereInput[] = [
      { name: { contains: keyword } },
      { origin_name: { contains: keyword } },
      { slug: { contains: slugKeyword } },
    ];

    if (rawKeyword !== keyword) {
      searchConditions.push({ name: { contains: rawKeyword } });
      searchConditions.push({ origin_name: { contains: rawKeyword } });
    }

    if (normalizedKeyword !== rawKeyword) {
      searchConditions.push({ name: { contains: normalizedKeyword } });
      searchConditions.push({ origin_name: { contains: normalizedKeyword } });
    }

    const where: Prisma.MovieWhereInput = {
      OR: searchConditions,
    };

    const [totalItems, movies] = await Promise.all([
      prisma.movie.count({ where }),
      prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ server_modified: "desc" }, { updated_at: "desc" }, { view_count: "desc" }],
        include: {
          categories: { include: { category: true } },
          countries: { include: { country: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const result = {
      status: "success",
      message: "Thành công",
      data: {
        items: movies.map(formatMovieSummary),
        params: {
          keyword,
          pagination: {
            totalItems,
            totalItemsPerPage: limit,
            currentPage: page,
            totalPages,
          },
        },
      },
    };

    setCache(cacheKey, result, 60);

    return res.json(result);
  } catch (error: any) {
    console.error("[API Search] Lỗi:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * GET /api/v1/home
 * Trả về toàn bộ bundles cho trang chủ trong 1 request duy nhất (Zero Latency)
 */
export async function getHomeBundle(req: Request, res: Response) {
  try {
    const cacheKey = 'home_bundle';
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const selectSummary = {
      id: true,
      name: true,
      slug: true,
      origin_name: true,
      thumb_url: true,
      poster_url: true,
      type: true,
      status: true,
      episode_current: true,
      episode_total: true,
      quality: true,
      lang: true,
      year: true,
      time: true,
      chieurap: true,
      sub_docquyen: true,
      view_count: true,
      updated_at: true,
      tmdb_id: true,
      tmdb_type: true,
      tmdb_vote_average: true,
      tmdb_vote_count: true,
      categories: { include: { category: true } },
      countries: { include: { country: true } },
    };

    const [hero, phimMoi, phimBo, phimLe, hoatHinh, tvShows, topView] = await Promise.all([
      // Hero Slider (10 phim nổi bật có poster đẹp và điểm cao / mới nhất)
      prisma.movie.findMany({
        take: 10,
        orderBy: [{ server_modified: "desc" }, { updated_at: "desc" }, { view_count: "desc" }],
        where: { poster_url: { not: "" } },
        select: selectSummary,
      }),
      // Phim Mới Cập Nhật (24 phim)
      prisma.movie.findMany({
        take: 24,
        orderBy: [{ server_modified: "desc" }, { updated_at: "desc" }],
        select: selectSummary,
      }),
      // Phim Bộ (16 phim)
      prisma.movie.findMany({
        where: { type: "series" },
        take: 16,
        orderBy: [{ server_modified: "desc" }, { updated_at: "desc" }],
        select: selectSummary,
      }),
      // Phim Lẻ (16 phim)
      prisma.movie.findMany({
        where: { type: "single" },
        take: 16,
        orderBy: [{ server_modified: "desc" }, { updated_at: "desc" }],
        select: selectSummary,
      }),
      // Hoạt Hình (16 phim)
      prisma.movie.findMany({
        where: { type: "hoathinh" },
        take: 16,
        orderBy: [{ server_modified: "desc" }, { updated_at: "desc" }],
        select: selectSummary,
      }),
      // TV Shows (16 phim)
      prisma.movie.findMany({
        where: { type: "tvshows" },
        take: 16,
        orderBy: [{ server_modified: "desc" }, { updated_at: "desc" }],
        select: selectSummary,
      }),
      // Top Xem Nhiều (10 phim)
      prisma.movie.findMany({
        take: 10,
        orderBy: { view_count: "desc" },
        select: selectSummary,
      }),
    ]);

    const result = {
      status: "success",
      message: "Thành công",
      data: {
        hero: hero.map(formatMovieSummary),
        phimMoi: phimMoi.map(formatMovieSummary),
        phimBo: phimBo.map(formatMovieSummary),
        phimLe: phimLe.map(formatMovieSummary),
        hoatHinh: hoatHinh.map(formatMovieSummary),
        tvShows: tvShows.map(formatMovieSummary),
        topView: topView.map(formatMovieSummary),
      },
    };

    setCache(cacheKey, result, 60);

    return res.json(result);
  } catch (error: any) {
    console.error("[API Home Bundle] Lỗi:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
