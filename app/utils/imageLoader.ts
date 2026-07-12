export default function imageLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // 1. Nếu là ảnh trong thư mục /public, blob hoặc data URL -> Giữ nguyên
  if (src.startsWith('/') || src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }

  // 2. Nếu là R2 URL của mình -> serve thẳng, không cần proxy
  // R2 đã là WebP rồi, Cloudflare CDN đã tối ưu sẵn
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  if (r2PublicUrl && src.startsWith(r2PublicUrl)) {
    return src;
  }
  // Fallback thêm: check domain r2.dev chung (trường hợp env chưa set)
  if (src.includes('.r2.dev/') || src.includes('r2.cloudflarestorage.com')) {
    return src;
  }

  // 3. Xử lý URL nguồn ngoài -> proxy qua wsrv.nl để convert + resize
  let originUrl = src;

  // Nếu lỡ có proxy cũ bọc ngoài, gỡ ra
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

  // 4. Tối ưu hóa tham số wsrv.nl
  const finalQuality = quality || (width < 640 ? 75 : 82);
  return `https://wsrv.nl/?url=${encodeURIComponent(originUrl)}&w=${width}&q=${finalQuality}&output=webp&il&maxage=7d`;
}
