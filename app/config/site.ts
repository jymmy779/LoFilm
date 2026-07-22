/**
 * Site Domain & URL Configuration
 * Sử dụng duy nhất biến môi trường NEXT_PUBLIC_SITE_URL làm nguồn chuẩn.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.munos.store').replace(/\/$/, '');

/**
 * Tự động lấy tên miền Hostname không chứa protocol hay www (ví dụ: 'munos.store')
 */
export const SITE_DOMAIN = ((): string => {
    try {
        return new URL(SITE_URL).hostname.replace(/^www\./, '');
    } catch {
        return 'munos.store';
    }
})();

/**
 * Helper tạo URL tuyệt đối cho bất kỳ đường dẫn nào:
 * getAbsoluteUrl('/phim/movie-slug') -> 'https://www.munos.store/phim/movie-slug'
 */
export function getAbsoluteUrl(path: string = ''): string {
    if (!path) return SITE_URL;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SITE_URL}${cleanPath}`;
}
