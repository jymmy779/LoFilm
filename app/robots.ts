import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Googlebot: cho phép crawl toàn bộ, ưu tiên cao nhất
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/auth/', '/trang-ca-nhan/'],
      },
      {
        // Bingbot
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/auth/', '/trang-ca-nhan/'],
      },
      {
        // Block SEO scrapers để tiết kiệm bandwidth
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot'],
        disallow: '/',
      },
      {
        // Tất cả bot khác
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/trang-ca-nhan/'],
      },
    ],
    sitemap: 'https://www.munos.store/sitemap.xml',
    host: 'https://www.munos.store',
  };
}
