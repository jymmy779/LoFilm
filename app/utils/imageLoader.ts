export default function imageLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // 1. Nếu là ảnh trong thư mục /public (ví dụ logo.png) hoặc blob/data URL -> Giữ nguyên
  if (src.startsWith('/') || src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }

  // 2. Xử lý URL gốc (originUrl)
  let originUrl = src;

  // Nếu là URL của wsrv.nl cũ hoặc phimapi proxy (có ?url=...), gỡ ra lấy URL gốc thực sự
  try {
    if (src.includes('?url=')) {
      const urlObj = new URL(src);
      const internalUrl = urlObj.searchParams.get('url');
      if (internalUrl) originUrl = internalUrl;
    }
  } catch (e) {
    // Để an toàn, nếu parse lỗi thì giữ nguyên src
  }

  // 3. Nếu là đường dẫn tương đối (không bắt đầu bằng http), bổ sung domain mặc định của phimimg
  if (!originUrl.startsWith('http')) {
    originUrl = `https://phimimg.com/${originUrl.startsWith('/') ? originUrl.slice(1) : originUrl}`;
  }

  // 4. Sử dụng wsrv.nl làm proxy tập trung
  // - &w= : Chiều rộng yêu cầu
  // - &q= : Chất lượng (Mặc định nâng lên 85 để giữ độ nét cao)
  // - &output=webp : Ép WebP
  // - &af : Adaptive filter (tối ưu nén)
  // - &il : Interlaced/Progressive (Tải lũy tiến, ảnh hiện ra ngay lập tức)
  // - &n=5 : Cache 5 ngày trên CDN (Giảm TTFB LCP cực mạnh)
  return `https://wsrv.nl/?url=${encodeURIComponent(originUrl)}&w=${width}&q=${quality || 85}&output=webp&af&il&n=5`;
}
