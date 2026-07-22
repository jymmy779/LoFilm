import { MetadataRoute } from 'next';
import { SITE_URL } from '@/app/config/site';

const API_BASE = "https://phimapi.com";
const BASE_URL = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Các trang tĩnh quan trọng
    const staticRoutes = [
        '', // Trang chủ
        '/danh-sach/phim-le',
        '/danh-sach/phim-bo',
        '/danh-sach/hoat-hinh',
        '/danh-sach/tv-shows',
        '/danh-sach/phim-chieu-rap',
        '/danh-sach/phim-moi',
        '/gioi-thieu',
        '/lien-he',
        '/faq',
        '/chinh-sach-bao-mat',
        '/dieu-khoan-su-dung'
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. Các trang thể loại
    const genreRoutes = [
        'hanh-dong', 'tinh-cam', 'hai-huoc', 'co-trang', 'tam-ly',
        'hinh-su', 'chien-tranh', 'the-thao', 'vo-thuat', 'vien-tuong',
        'phieu-luu', 'khoa-hoc', 'kinh-di', 'am-nhac', 'than-thoai',
        'tai-lieu', 'gia-dinh', 'chinh-kich', 'bi-an', 'hoc-duong',
        'phim-18'
    ].map((slug) => ({
        url: `${BASE_URL}/the-loai/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
    }));

    // 3. Các trang quốc gia
    const countryRoutes = [
        'han-quoc', 'trung-quoc', 'au-my', 'nhat-ban', 'thai-lan',
        'viet-nam', 'an-do', 'dai-loan', 'hong-kong', 'phap',
        'anh', 'duc', 'tay-ban-nha'
    ].map((slug) => ({
        url: `${BASE_URL}/quoc-gia/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
    }));

    // 4. Lấy danh sách phim + episode URLs (tăng lên 100 trang ~2000 phim)
    let movieRoutes: MetadataRoute.Sitemap = [];
    let episodeRoutes: MetadataRoute.Sitemap = [];

    try {
        const pages = Array.from({ length: 100 }, (_, i) => i + 1);

        // Batch 10 trang mỗi lần để tránh timeout
        const batchSize = 10;
        for (let b = 0; b < pages.length; b += batchSize) {
            const batch = pages.slice(b, b + batchSize);
            const responses = await Promise.all(
                batch.map(page =>
                    fetch(`${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`)
                        .then(res => res.json())
                        .catch(() => ({ items: [] }))
                )
            );

            for (const data of responses) {
                const items = data.items || [];
                for (const movie of items) {
                    // URL trang chi tiết phim (priority cao nhất)
                    movieRoutes.push({
                        url: `${BASE_URL}/phim/${movie.slug}`,
                        lastModified: new Date(movie.modified?.time || new Date()),
                        changeFrequency: 'weekly' as const,
                        priority: 0.7,
                    });
                }
            }
        }

        // 5. Fetch episodes cho 30 phim bộ đầu tiên (series có nhiều tập = nhiều long-tail URL)
        const seriesMovies = movieRoutes.slice(0, 30);
        const episodePromises = seriesMovies.map(async (movieRoute) => {
            try {
                const movieSlug = movieRoute.url.split('/phim/')[1];
                const detail = await fetch(`${API_BASE}/phim/${movieSlug}`)
                    .then(res => res.json())
                    .catch(() => null);

                if (!detail?.movie || !detail?.episodes?.length) return [];
                if (detail.movie.type === 'single') return []; // Bỏ phim lẻ

                const server = detail.episodes[0];
                if (!server?.server_data?.length || server.server_data.length < 2) return [];

                return server.server_data.slice(0, 50).map((ep: any) => ({
                    url: `${BASE_URL}/phim/${movieSlug}/${ep.slug}`,
                    lastModified: new Date(detail.movie.modified?.time || new Date()),
                    changeFrequency: 'weekly' as const,
                    priority: 0.5,
                }));
            } catch {
                return [];
            }
        });

        const episodeBatches = await Promise.all(episodePromises);
        episodeRoutes = episodeBatches.flat();

    } catch (error) {
        console.error("Sitemap generation error:", error);
    }

    return [...staticRoutes, ...genreRoutes, ...countryRoutes, ...movieRoutes, ...episodeRoutes];
}
