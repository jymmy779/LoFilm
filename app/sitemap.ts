import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://munos.store';
  
  // Bản đồ dẫn đường VIP cho Bot Google đi vào các tụ điểm sâu trong website
  const routes = [
    '', // Trang chủ
    '/danh-sach/phim-le',
    '/danh-sach/phim-bo',
    '/danh-sach/hoat-hinh',
    '/danh-sach/tv-shows',
    '/danh-sach/phim-chieu-rap'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const, // Xin Google cập nhật hàng ngày
    priority: route === '' ? 1 : 0.8, // Ưu tiên trang chủ nhất
  }));

  return [...routes];
}
