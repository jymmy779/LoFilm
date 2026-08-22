/**
 * Tiện ích tạo và xử lý Avatar Dicebear cho LoFilm
 */

export const DICEBEAR_STYLES = [
  'adventurer',
  'bottts-neutral',
  'lorelei',
  'avataaars',
  'fun-emoji',
  'thumbs',
  'notionists',
  'big-smile',
  'dylan',
] as const;

export type DicebearStyle = typeof DICEBEAR_STYLES[number];

/**
 * Bảng màu nền Pastel cao cấp (giống hệt trang chủ Dicebear)
 */
export const PASTEL_BACKGROUND_COLORS = [
  'b6e3f4', // Soft Sky Blue
  'c0aede', // Soft Lavender
  'd1d4f9', // Soft Periwinkle
  'ffd5dc', // Soft Rose Pink
  'ffdfbf', // Soft Peach
  'c1f4c5', // Soft Mint Green
  'fde2e4', // Soft Blush
  'e2ece9', // Soft Sage
  'dfccf1', // Soft Purple
  'fbe4d8', // Soft Warm Apricot
  'd6e4ff', // Light Ice Blue
  'e0f2fe', // Clean Ocean
  'fef08a', // Soft Sunlight Yellow
  'fed7aa', // Soft Coral Orange
  'fbcfe8', // Soft Blossom Pink
].join(',');

/**
 * Sinh chuỗi ngẫu nhiên
 */
function getRandomString(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hash một chuỗi thành số nguyên dương để chọn style cố định
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Sinh avatar ngẫu nhiên có màu nền rực rỡ/pastel (khi tạo tài khoản mới)
 */
export function getRandomDicebearAvatar(customSeed?: string): string {
  const randomStyle = DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)];
  const seed = customSeed || getRandomString(12);
  return `https://api.dicebear.com/9.x/${randomStyle}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${PASTEL_BACKGROUND_COLORS}&backgroundType=solid`;
}

/**
 * Sinh avatar cố định có màu nền theo ID / Email (dành cho tài khoản cũ chưa có avatar trong metadata)
 */
export function getDeterministicAvatar(identifier: string): string {
  if (!identifier) return `https://api.dicebear.com/9.x/adventurer/svg?seed=default&backgroundColor=${PASTEL_BACKGROUND_COLORS}&backgroundType=solid`;
  const index = hashString(identifier) % DICEBEAR_STYLES.length;
  const style = DICEBEAR_STYLES[index];
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(identifier)}&backgroundColor=${PASTEL_BACKGROUND_COLORS}&backgroundType=solid`;
}

/**
 * Chuẩn hóa URL avatar Dicebear:
 * 1. Nếu là URL Dicebear cũ (chưa có backgroundColor) -> tự động bổ sung bảng màu pastel mềm mại (solid).
 * 2. Giữ nguyên chất lượng SVG vector chuẩn, không bị vỡ hạt.
 */
export function normalizeDicebearAvatar(url?: string | null): string | null {
  if (!url) return null;
  if (url.includes('api.dicebear.com')) {
    if (!url.includes('backgroundColor=')) {
      const joinChar = url.includes('?') ? '&' : '?';
      return `${url}${joinChar}backgroundColor=${PASTEL_BACKGROUND_COLORS}&backgroundType=solid`;
    }
    return url;
  }
  return url;
}

/**
 * Lấy URL avatar chuẩn của User:
 * 1. Nếu user đã có avatar (tự up hoặc đã lưu trong metadata) -> lấy avatar đó (tự nâng cấp màu nếu là Dicebear cũ).
 * 2. Nếu chưa có -> Tự động sinh avatar Dicebear theo Tên hiển thị / User ID (đảm bảo không đổi sau mỗi lần F5).
 */
export function getUserAvatarUrl(user?: any, fallbackSeed?: string): string {
  const customAvatar = user?.user_metadata?.avatar_url;
  if (customAvatar) {
    return normalizeDicebearAvatar(customAvatar) || customAvatar;
  }

  // Ưu tiên theo tên hiển thị (full_name / username) để đồng bộ 100% giữa Trang cá nhân, Bình luận và Thông báo
  const name = fallbackSeed
    || user?.user_metadata?.full_name
    || (user?.email ? user.email.split('@')[0] : '')
    || user?.id;

  if (name) {
    return getDeterministicAvatar(name);
  }

  return `https://api.dicebear.com/9.x/adventurer/svg?seed=guest&backgroundColor=${PASTEL_BACKGROUND_COLORS}&backgroundType=solid`;
}
