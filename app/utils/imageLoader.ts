export default function imageLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // 1. Nếu là ảnh trong thư mục /public, blob hoặc data URL -> Giữ nguyên
  if (src.startsWith('/') || src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }

  // 2. Xử lý URL gốc (đã được movieUtils chuẩn hóa nhưng vẫn kiểm tra lại cho an toàn)
  let originUrl = src;

  // Nếu lỡ có proxy cũ bọc ngoài, gỡ ra (vẫn giữ logic này để tương thích ngược nếu cần)
  if (src.includes('?url=')) {
    try {
      const urlObj = new URL(src);
      const internalUrl = urlObj.searchParams.get('url');
      if (internalUrl) originUrl = internalUrl;
    } catch (e) {
      // Bỏ qua lỗi parse
    }
  }

  // Bổ sung domain nếu thiếu
  if (!originUrl.startsWith('http')) {
    originUrl = `https://phimimg.com/${originUrl.startsWith('/') ? originUrl.slice(1) : originUrl}`;
  }

  // 3. Tối ưu hóa tham số wsrv.nl
  // - finalQuality: Cân bằng giữa độ nét và dung lượng
  const finalQuality = quality || (width < 640 ? 75 : 82);
  
  // - maxage=7d: Cache mạnh trên CDN 7 ngày
  // - compress: Sử dụng thuật toán nén tối ưu
  // - il: Tải ảnh lũy tiến (progressive)
  return `https://wsrv.nl/?url=${encodeURIComponent(originUrl)}&w=${width}&q=${finalQuality}&output=webp&il&maxage=7d`;
}
