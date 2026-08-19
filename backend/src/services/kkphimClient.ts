import axios from "axios";

const API_BASE = "https://phimapi.com";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
  },
});

export interface KKPhimTaxonomy {
  _id?: string;
  name: string;
  slug: string;
}

export interface KKPhimPagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

export interface KKPhimMovieItemSummary {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  year: number;
  modified: {
    time: string;
  };
}

export interface KKPhimEpisodeItem {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

export interface KKPhimServerItem {
  server_name: string;
  server_data: KKPhimEpisodeItem[];
}

export interface KKPhimMovieDetail {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  content: string;
  type: string;
  status: string;
  thumb_url: string;
  poster_url: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  chieurap: boolean;
  trailer_url: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  notify: string;
  showtimes: string;
  year: number;
  view: number;
  actor: string[];
  director: string[];
  category: KKPhimTaxonomy[];
  country: KKPhimTaxonomy[];
  tmdb?: {
    id?: string;
    type?: string;
    vote_average?: number;
    vote_count?: number;
  };
  modified?: {
    time: string;
  };
}

export interface KKPhimDetailResponse {
  status: boolean;
  msg?: string;
  movie: KKPhimMovieDetail;
  episodes: KKPhimServerItem[];
}

/**
 * Lấy danh sách thể loại từ KKPhim
 */
export async function fetchKKPhimCategories(): Promise<KKPhimTaxonomy[]> {
  try {
    const res = await client.get("/the-loai");
    return res.data?.data?.items || res.data?.items || (Array.isArray(res.data) ? res.data : []);
  } catch (error: any) {
    console.error("[KKPhim] Lỗi lấy danh sách thể loại:", error.message);
    return [];
  }
}

/**
 * Lấy danh sách quốc gia từ KKPhim
 */
export async function fetchKKPhimCountries(): Promise<KKPhimTaxonomy[]> {
  try {
    const res = await client.get("/quoc-gia");
    return res.data?.data?.items || res.data?.items || (Array.isArray(res.data) ? res.data : []);
  } catch (error: any) {
    console.error("[KKPhim] Lỗi lấy danh sách quốc gia:", error.message);
    return [];
  }
}

/**
 * Lấy danh sách phim mới cập nhật theo trang
 */
export async function fetchKKPhimUpdatedPage(page = 1): Promise<{
  items: KKPhimMovieItemSummary[];
  pagination: KKPhimPagination;
} | null> {
  let retries = 2;
  while (retries >= 0) {
    try {
      const res = await client.get(`/danh-sach/phim-moi-cap-nhat?page=${page}`);
      if (res.data?.status && res.data?.items) {
        return {
          items: res.data.items,
          pagination: res.data.pagination || {
            totalItems: 0,
            totalItemsPerPage: 24,
            currentPage: page,
            totalPages: 1,
          },
        };
      }
      return null;
    } catch (error: any) {
      retries--;
      if (retries < 0) {
        console.error(`[KKPhim] Lỗi fetch trang ${page}:`, error.message);
        return null;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

/**
 * Lấy chi tiết đầy đủ của một bộ phim (thông tin + toàn bộ server và tập)
 */
export async function fetchKKPhimMovieDetail(slug: string): Promise<KKPhimDetailResponse | null> {
  let retries = 2;
  while (retries >= 0) {
    try {
      const res = await client.get(`/phim/${encodeURIComponent(slug)}`);
      if (res.data?.status && res.data?.movie) {
        return res.data;
      }
      return null;
    } catch (error: any) {
      retries--;
      if (retries < 0) {
        console.error(`[KKPhim] Lỗi fetch detail ${slug}:`, error.message);
        return null;
      }
      await new Promise((r) => setTimeout(r, 800));
    }
  }
  return null;
}
