export const TOP_COMMENTS = [
  {
    id: 1,
    user: {
      name: "như",
      avatar: null,
    },
    movie: {
      title: "Con Nhỏ Kia",
      poster: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZbtD3o941Ym9.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/vpnVM9B6NMmQpWeZbtD3o941Ym9.jpg",
    },
    content: "mẹ con nhỏ kia mặt cứ ngông ngông khinh ng ghét vl",
    upvotes: 9,
    downvotes: 5,
    replies: 0,
  },
  {
    id: 2,
    user: {
      name: "Má Hai Rổ Phim",
      avatar: null,
    },
    movie: {
      title: "Single's Inferno",
      poster: "https://image.tmdb.org/t/p/w500/6S6FvE6KjXG5zVvM0K6p9E8L6F.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/6S6FvE6KjXG5zVvM0K6p9E8L6F.jpg",
    },
    content: "Lên rồi cả nhà nhé. 6 tập đặc biệt",
    upvotes: 8,
    downvotes: 1,
    replies: 0,
  },
  {
    id: 3,
    user: {
      name: "jet jet",
      avatar: null,
    },
    movie: {
      title: "My Demon",
      poster: "https://image.tmdb.org/t/p/w500/v0m0hM1O5nK3vM0P9p0X9O9k0.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/v0m0hM1O5nK3vM0P9p0X9O9k0.jpg",
    },
    content: "khi nào có tập 6 vậy ạ",
    upvotes: 7,
    downvotes: 2,
    replies: 1,
  },
  {
    id: 4,
    user: {
      name: "Ngọc hà",
      avatar: null,
    },
    movie: {
      title: "Strong Girl Nam-soon",
      poster: "https://image.tmdb.org/t/p/w500/y0M0kM1O5nK3vM0P9p0X9O9k0.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/y0M0kM1O5nK3vM0P9p0X9O9k0.jpg",
    },
    content: "Không có phần trình duyệt lên tv chán thật",
    upvotes: 6,
    downvotes: 0,
    replies: 0,
  },
  {
    id: 5,
    user: {
      name: "Ma xó thế hệ 4.0",
      avatar: null,
    },
    movie: {
      title: "Twinkling Watermelon",
      poster: "https://image.tmdb.org/t/p/w500/z0M0kM1O5nK3vM0P9p0X9O9k0.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/z0M0kM1O5nK3vM0P9p0X9O9k0.jpg",
    },
    content: "hú, phim hay mà ít bình luận dọ, khuấy đảo đê mn",
    upvotes: 5,
    downvotes: 0,
    replies: 1,
  },
];

export const TRENDING_MOVIES = [
  { id: 1, title: "Võ Thần Chúa Tể", poster: "https://image.tmdb.org/t/p/w200/vpnVM9B6NMmQpWeZbtD3o941Ym9.jpg", trend: "up" },
  { id: 2, title: "Phu Nhân Đại Quân Thế Kỷ 21", poster: "https://image.tmdb.org/t/p/w200/6S6FvE6KjXG5zVvM0K6p9E8L6F.jpg", trend: "up" },
  { id: 3, title: "Thanh Tra Bí Mật", poster: "https://image.tmdb.org/t/p/w200/v0m0hM1O5nK3vM0P9p0X9O9k0.jpg", trend: "up" },
  { id: 4, title: "Thám Tử Lừng Danh Conan", poster: "https://image.tmdb.org/t/p/w200/y0M0kM1O5nK3vM0P9p0X9O9k0.jpg", trend: "up" },
  { id: 5, title: "Pokemon Tổng Hợp", poster: "https://image.tmdb.org/t/p/w200/z0M0kM1O5nK3vM0P9p0X9O9k0.jpg", trend: "up" },
];

export const WEEKLY_FAVORITES = [
  { id: 1, title: "Phu Nhân Đại Quân Thế Kỷ 21", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, title: "Pokemon Tổng Hợp", avatar: "https://i.pravatar.cc/150?u=2" },
  { id: 3, title: "Thám Tử Lừng Danh Conan", avatar: "https://i.pravatar.cc/150?u=3" },
  { id: 4, title: "Võ Thần Chúa Tể", avatar: "https://i.pravatar.cc/150?u=4" },
  { id: 5, title: "Thanh Tra Bí Mật", avatar: "https://i.pravatar.cc/150?u=5" },
];

export const HOT_GENRES = [
  { id: 1, name: "Chính kịch", slug: "chinh-kich", color: "#e11d48", trend: "neutral" },
  { id: 2, name: "Hành Động", slug: "hanh-dong", color: "#2563eb", trend: "up" },
  { id: 3, name: "Hài Hước", slug: "hai-huoc", color: "#7c3aed", trend: "down" },
  { id: 4, name: "Phiêu Lưu", slug: "phieu-luu", color: "#65a30d", trend: "down" },
  { id: 5, name: "Tình Cảm", slug: "tinh-cam", color: "#d97706", trend: "neutral" },
  { id: 6, name: "Viễn Tưởng", slug: "vien-tuong", color: "#06b6d4", trend: "up" },
  { id: 7, name: "Kinh Dị", slug: "kinh-di", color: "#ef4444", trend: "up" },
  { id: 8, name: "Hoạt Hình", slug: "hoat-hinh", color: "#f59e0b", trend: "neutral" },
  { id: 9, name: "Hình Sự", slug: "hinh-su", color: "#3b82f6", trend: "down" },
  { id: 10, name: "Cổ Trang", slug: "co-trang", color: "#10b981", trend: "up" },
];

export const NEW_COMMENTS = [
  { id: 1, user: "gu má lúm", content: "ê sao mất tiếng rồi", movie: "Cuộc Chiến Trong Chúng Ta", avatar: null },
  { id: 2, user: "Phong", content: "Tập 15 trở đi ko có vietsub ad ơi", movie: "Dối Trá (Phần 2)", avatar: null },
  { id: 3, user: "connhocutii★･ﾟ", content: "xưa coi h tìm mãi ms ra", movie: "Yêu Nhau Mùa Ế", avatar: "https://i.pravatar.cc/150?u=9" },
  { id: 4, user: "nami", content: "khi nào có tập 7 nhỉ, hóng quá", movie: "Phu Nhân Đại Quân Thế Kỷ 21", avatar: null },
  { id: 5, user: "minh anh", content: "phim này đỉnh quá trời ơi", movie: "Võ Thần Chúa Tể", avatar: null },
  { id: 6, user: "hoang nam", content: "ad cập nhật tập mới nhanh quá", movie: "Thanh Tra Bí Mật", avatar: null },
];
