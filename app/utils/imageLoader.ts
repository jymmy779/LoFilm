export default function imageLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // 1. Nếu là ảnh trong thư mục /public, blob hoặc data URL -> Giữ nguyên
  if (src.startsWith('/') || src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }

  // 2. Nếu là R2 URL của mình -> serve thẳng, không cần proxy
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  if (r2PublicUrl && src.startsWith(r2PublicUrl)) {
    return src;
  }
  if (src.includes('.r2.dev/') || src.includes('r2.cloudflarestorage.com')) {
    return src;
  }

  // 3. Xử lý URL nguồn ngoài
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

  // Sửa các trường hợp domain dính sai
  if (originUrl.includes('phimimg.com/public/images/')) {
    originUrl = originUrl.replace('phimimg.com/public/images/', 'phim.nguonc.com/public/images/');
  }

  // Bổ sung domain nếu thiếu
  if (!originUrl.startsWith('http://') && !originUrl.startsWith('https://')) {
    if (originUrl.startsWith('//')) {
      originUrl = `https:${originUrl}`;
    } else {
      const ophimIndex = originUrl.indexOf('ophim');
      const dnmIndex = originUrl.indexOf('dnm/');
      const tmdbIndex = originUrl.indexOf('t/p/');
      const publicIndex = originUrl.indexOf('public/images/');
      const uploadsIndex = originUrl.indexOf('uploads/');
      const uploadIndex = originUrl.indexOf('upload/');

      if (ophimIndex !== -1 && !originUrl.includes('.')) {
        originUrl = `https://img.ophim.live/${originUrl.slice(ophimIndex)}`;
      } else if (dnmIndex !== -1) {
        originUrl = `https://occ-0-8407-116.1.nflxso.net/${originUrl.slice(dnmIndex)}`;
      } else if (tmdbIndex !== -1) {
        originUrl = `https://image.tmdb.org/${originUrl.slice(tmdbIndex)}`;
      } else if (publicIndex !== -1) {
        originUrl = `https://phim.nguonc.com/${originUrl.slice(publicIndex)}`;
      } else if (uploadsIndex !== -1) {
        originUrl = `https://phimimg.com/${originUrl.slice(uploadsIndex)}`;
      } else if (uploadIndex !== -1) {
        originUrl = `https://phimimg.com/${originUrl.slice(uploadIndex)}`;
      } else if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+\//.test(originUrl)) {
        originUrl = `https://${originUrl}`;
      } else {
        originUrl = `https://phimimg.com/${originUrl.startsWith('/') ? originUrl.slice(1) : originUrl}`;
      }
    }
  }

  // 4. Các nguồn ảnh phimimg.com / phim.nguonc.com vốn dĩ đã là ảnh WebP chuẩn từ nguồn,
  // Tải trực tiếp originUrl để lấy đầy đủ độ phân giải gốc sắc nét, không bị wsrv.nl giới hạn size/bóp mờ hay zoom sát
  if (originUrl.includes('phimimg.com') || originUrl.includes('phim.nguonc.com') || originUrl.includes('img.ophim.live')) {
    return originUrl;
  }

  // Chỉ dùng wsrv.nl proxy cho các nguồn bên ngoài cần convert khác
  const targetWidth = Math.min(width, 1000);
  const finalQuality = quality || (targetWidth < 640 ? 75 : 82);
  return `https://wsrv.nl/?url=${encodeURIComponent(originUrl)}&w=${targetWidth}&q=${finalQuality}&output=webp&il&maxage=1y`;
}
