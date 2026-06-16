# LoFilm 🎬

LoFilm là một nền tảng web xem phim trực tuyến hiện đại, được xây dựng với Next.js và các công nghệ web tiên tiến nhất. Nền tảng mang lại trải nghiệm xem phim mượt mà, nhanh chóng cùng giao diện đẹp mắt, tối ưu cho người dùng.

## 🌟 Tính năng nổi bật

- **Trải nghiệm xem phim mượt mà**: Tích hợp trình phát video chất lượng cao (`Plyr` + `HLS.js`) hỗ trợ phát video streaming ổn định.
- **Giao diện hiện đại & Responsive**: Thiết kế UI/UX đẹp mắt, tối ưu trên cả thiết bị di động và máy tính với `Tailwind CSS v4`.
- **Hiệu suất cực cao**: Sử dụng Server Components của Next.js kết hợp với cơ chế caching cực nhanh từ `Upstash Redis`.
- **Quản lý dữ liệu mạnh mẽ**: Tích hợp `Supabase` cho cơ sở dữ liệu và xác thực người dùng.

## 🚀 Công nghệ sử dụng

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Ngôn ngữ**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Cơ sở dữ liệu & Auth**: [Supabase](https://supabase.com/)
- **Caching**: [Upstash Redis](https://upstash.com/)
- **Trình phát Video (Video Player)**: [Plyr](https://plyr.io/) & [HLS.js](https://github.com/video-dev/hls.js/)
- **UI & Icons**: `lucide-react`, `react-icons`, `swiper`

## 📦 Hướng dẫn cài đặt (Getting Started)

1. **Clone dự án về máy:**

```bash
git clone https://github.com/your-username/lofilm.git
cd lofilm
```

2. **Cài đặt các dependencies:**

```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

3. **Thiết lập biến môi trường:**

Tạo file `.env.local` ở thư mục gốc của dự án (`/lofilm/.env.local`) và thêm các cấu hình cần thiết:
```env
# URL & Key của Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# URL & Token của Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Các biến môi trường khác (nếu có)...
```

4. **Chạy server development:**

```bash
npm run dev
# hoặc
yarn dev
# hoặc
pnpm dev
```

Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000) để trải nghiệm.

## 🤝 Đóng góp (Contributing)

Mọi đóng góp cho dự án đều được chào đón! Vui lòng tạo issue để thảo luận về những thay đổi bạn muốn thực hiện trước khi tạo Pull Request.
