import { MetadataRoute } from 'next';

const API_BASE = "https://phimapi.com";
const BASE_URL = 'https://www.munos.store';

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

    // 4. Lấy danh sách phim mới nhất - mở rộng lên 50 trang (~1000 phim)
    let movieRoutes: any[] = [];
    try {
        const pages = Array.from({ length: 50 }, (_, i) => i + 1);
        const moviePromises = pages.map(page =>
            fetch(`${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`)
                .then(res => res.json())
                .catch(() => ({ items: [] }))
        );

        const responses = await Promise.all(moviePromises);

        movieRoutes = responses.flatMap(data =>
            (data.items || []).map((movie: any) => ({
                url: `${BASE_URL}/phim/${movie.slug}`,
                lastModified: new Date(movie.modified?.time || new Date()),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }))
        );
    } catch (error) {
        console.error("Sitemap generation error:", error);
    }

    return [...staticRoutes, ...genreRoutes, ...countryRoutes, ...movieRoutes];
}
