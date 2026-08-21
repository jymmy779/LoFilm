export const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_INTERNAL_API_URL ||
  "http://127.0.0.1:5000/api/v1";

export const KKPHIM_API_BASE = "https://phimapi.com";

/**
 * Chuẩn hóa URL bất kỳ (nội bộ hay bên ngoài) sang đúng format của PhimAPI công khai
 */
export function mapToPhimApiUrl(rawUrl: string): string {
    let cleanUrl = rawUrl
        .replace(/http:\/\/127\.0\.0\.1:5000\/api\/v1/g, 'https://phimapi.com')
        .replace(/http:\/\/localhost:5000\/api\/v1/g, 'https://phimapi.com')
        .replace(/http:\/\/127\.0\.0\.1:5000/g, 'https://phimapi.com')
        .replace(/http:\/\/localhost:5000/g, 'https://phimapi.com')
        .replace(/https:\/\/phimapi\.com\/v1\/api\/v1\/api/g, 'https://phimapi.com/v1/api');

    if (cleanUrl.startsWith('/')) {
        cleanUrl = `https://phimapi.com${cleanUrl}`;
    }

    // 1. Phim mới cập nhật
    if (cleanUrl.includes('/danh-sach/phim-moi-cap-nhat')) {
        return cleanUrl.replace('https://phimapi.com/v1/api', 'https://phimapi.com');
    }
    // 2. Chi tiết phim
    if (cleanUrl.includes('/phim/')) {
        return cleanUrl.replace('https://phimapi.com/v1/api/phim/', 'https://phimapi.com/phim/');
    }
    // 3. Danh mục thể loại tổng quát (không có slug đằng sau)
    if (
        cleanUrl === 'https://phimapi.com/the-loai' ||
        cleanUrl.startsWith('https://phimapi.com/the-loai?') ||
        cleanUrl === 'https://phimapi.com/v1/api/the-loai' ||
        cleanUrl.startsWith('https://phimapi.com/v1/api/the-loai?')
    ) {
        return cleanUrl.replace('https://phimapi.com/v1/api/the-loai', 'https://phimapi.com/the-loai');
    }
    // 4. Danh mục quốc gia tổng quát (không có slug đằng sau)
    if (
        cleanUrl === 'https://phimapi.com/quoc-gia' ||
        cleanUrl.startsWith('https://phimapi.com/quoc-gia?') ||
        cleanUrl === 'https://phimapi.com/v1/api/quoc-gia' ||
        cleanUrl.startsWith('https://phimapi.com/v1/api/quoc-gia?')
    ) {
        return cleanUrl.replace('https://phimapi.com/v1/api/quoc-gia', 'https://phimapi.com/quoc-gia');
    }

    // 5. Các danh sách và chi tiết thể loại/quốc gia khác đều cần tiền tố /v1/api
    if (!cleanUrl.includes('https://phimapi.com/v1/api/')) {
        cleanUrl = cleanUrl.replace('https://phimapi.com/', 'https://phimapi.com/v1/api/');
    }

    return cleanUrl;
}
