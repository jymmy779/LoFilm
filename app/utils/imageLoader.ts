export default function imageLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // 1. Nếu là ảnh trong thư mục /public (ví dụ logo.png) hoặc blob/data URL -> Giữ nguyên
  if (src.startsWith('/') || src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }

  // 2. Nếu URL đã chứa tham số của phimapi (ví dụ https://phimapi.com/image.php?url=...)
  // Chúng ta gỡ nó ra để lấy URL gốc của ảnh (giúp wsrv.nl fetch trực tiếp cho nhanh)
  let originUrl = src;
  try {
    const urlObj = new URL(src);
    if (urlObj.searchParams.has('url')) {
      const internalUrl = urlObj.searchParams.get('url');
      if (internalUrl) originUrl = internalUrl;
    }
  } catch (e) {
    // Không phải URL hợp lệ hoặc không parse được thì dùng src gốc
  }

  // 3. Sử dụng wsrv.nl (WordPress Image Service) để tối ưu ảnh cho toàn bộ site
  // - &w= : Chiều rộng yêu cầu (từ thuộc tính sizes hoặc width của component)
  // - &q= : Chất lượng ảnh (mặc định 75)
  // - &output=webp : Ép trả về định dạng WebP siêu nhẹ cho trình duyệt
  // - &n=-1 : Không lọc màu (keeps original color profile)
  return `https://wsrv.nl/?url=${encodeURIComponent(originUrl)}&w=${width}&q=${quality || 75}&output=webp&n=-1`;
}
