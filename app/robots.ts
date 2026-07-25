import { MetadataRoute } from 'next';
import { SITE_URL } from '@/app/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Googlebot: cho phép crawl toàn bộ, ưu tiên cao nhất
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/', '/auth/', '/admin/',
          '/ca-nhan/', '/lich-su/', '/yeu-thich/', '/xem-sau/',
          '/thu-vien/', '/thong-bao/', '/dang-nhap/',
          '/quen-mat-khau/', '/dat-lai-mat-khau/', '/maintenance',
        ],
      },
      {
        // Bingbot
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/', '/auth/', '/admin/',
          '/ca-nhan/', '/lich-su/', '/yeu-thich/', '/xem-sau/',
          '/thu-vien/', '/thong-bao/', '/dang-nhap/',
          '/quen-mat-khau/', '/dat-lai-mat-khau/', '/maintenance',
        ],
      },
      {
        // Block SEO scrapers để tiết kiệm crawl budget
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'PetalBot', 'Bytespider'],
        disallow: '/',
      },
      {
        // Tất cả bot khác
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/', '/auth/', '/admin/',
          '/ca-nhan/', '/lich-su/', '/yeu-thich/', '/xem-sau/',
          '/thu-vien/', '/thong-bao/', '/dang-nhap/',
          '/quen-mat-khau/', '/dat-lai-mat-khau/', '/maintenance',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
