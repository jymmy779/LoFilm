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
        '/gioi-thieu',
        '/lien-he',
        '/faq'
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. Lấy danh sách phim mới nhất để Bot "đánh hơi" thấy
    // Chúng ta lấy khoảng 2 trang phim mới nhất (khoảng 40 phim) để sitemap không quá nặng lúc build
    let movieRoutes: any[] = [];
    try {
        const pages = [1, 2, 3]; // Lấy 3 trang đầu phim mới
        const moviePromises = pages.map(page => 
            fetch(`${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`).then(res => res.json())
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

    return [...staticRoutes, ...movieRoutes];
}
