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

  // 4. Tối ưu hóa chất lượng dựa trên độ rộng (Mobile vs Desktop)
  // Nếu màn hình nhỏ (width < 640), hạ chất lượng xuống 75 để tiết kiệm băng thông
  // Nếu màn hình lớn, giữ 85 để đảm bảo độ nét
  const finalQuality = quality || (width < 640 ? 75 : 85);

  // 5. Sử dụng wsrv.nl làm proxy tập trung
  // - &w= : Chiều rộng yêu cầu
  // - &q= : Chất lượng
  // - &output=webp : Ép WebP
  // - &af : Adaptive filter (tối ưu nén)
  // - &il : Interlaced/Progressive (Tải lũy tiến)
  // - &n=5 : Cache 5 ngày trên CDN
  return `https://wsrv.nl/?url=${encodeURIComponent(originUrl)}&w=${width}&q=${finalQuality}&output=webp&af&il&n=5`;
}
