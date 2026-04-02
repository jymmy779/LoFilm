/**
 * Giải mã các thực thể HTML phổ biến sang văn bản thuần túy
 * @param str Chuỗi cần giải mã
 * @returns Chuỗi đã giải mã
 */
export const decodeHtml = (str: string = "") => {
    if (!str) return "";
    return str
        .replace(/&#0*39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&hellip;/g, '...')
        .replace(/"{2,}/g, '"') // Gộp 2 hoặc nhiều dấu " thành 1
        .trim();
};

/**
 * Xóa sạch các thẻ HTML và giải mã thực thể
 * @param html Chuỗi HTML cần làm sạch
 * @returns Văn bản thuần túy đã làm sạch
 */
export const cleanContent = (html: string = "") => {
    if (!html) return "";
    const stripped = html.replace(/<[^>]*>?/gm, '');
    return decodeHtml(stripped);
};
