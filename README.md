# 🎬 LoFilm - Nền Tảng Xem Phim Trực Tuyến Hiện Đại

<p align="center">
  <img src="./public/banner.png" alt="LoFilm Banner" width="100%" onerror="this.style.display='none'" />
</p>

<p align="center">
  <strong>Trải nghiệm điện ảnh đỉnh cao với hiệu năng vượt trội, giao diện tinh tế và công nghệ streaming hiện đại.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Redis-Upstash%20%26%20ioRedis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Player-Artplayer%20%2B%20HLS-FF0055?style=for-the-badge" alt="Artplayer" />
  <img src="https://img.shields.io/badge/Storage-Cloudflare%20R2-F38020?style=for-the-badge&logo=cloudflare" alt="Cloudflare R2" />
</p>

---

## 📖 Giới thiệu (Overview)

**LoFilm** là nền tảng xem phim trực tuyến mã nguồn mở chất lượng cao, được xây dựng trên nền tảng **Next.js 16 (App Router)** và **React 19**. Hệ thống được tối ưu hóa toàn diện cho tốc độ tải trang cực nhanh, hỗ trợ phát trực tuyến HLS đa độ phân giải, giao diện Dark Cinema thân thiện và hệ sinh thái tính năng cộng đồng hoàn chỉnh (yêu thích, lịch sử xem phim, bình luận đa cấp, báo cáo sự cố tự động qua Telegram).

---

## ✨ Tính năng nổi bật (Key Features)

### 🎥 1. Trải nghiệm phát Video đỉnh cao (Artplayer & HLS)
- **Hỗ trợ HLS (HTTP Live Streaming)**: Tự động chuyển đổi và phát luồng video mượt mà, hỗ trợ nhiều chất lượng phân giải.
- **Tính năng trình phát chuyên nghiệp**: Tùy chỉnh tốc độ phát, chế độ rạp chiếu (Theater mode), phát trong nền (PiP - Picture in Picture), phóng to/thu nhỏ khung hình.
- **Ghi nhớ tiến trình xem**: Tự động lưu và phát tiếp đoạn phim đang xem dở; hỗ trợ tự động nhảy sang tập kế tiếp.
- **Phím tắt điều khiển tiện lợi**: Tua nhanh, tạm dừng, tăng/giảm âm lượng, bật/tắt toàn màn hình bằng bàn phím.

### ⚡ 2. Hiệu năng & Bộ nhớ đệm Đa tầng (High Performance & Multi-Layer Caching)
- **Next.js 16 Server Components & Streaming SSR**: Giảm thiểu tối đa dung lượng JavaScript gửi xuống Client, tăng tốc độ FCP & LCP.
- **Dual-layer Redis Cache**: Kết hợp **Upstash Redis REST** và **ioredis connection pool** để cache danh sách phim thịnh hành, chi tiết phim và kết quả tìm kiếm với độ trễ dưới 10ms.
- **Smart Image Loader & Sharp**: Tối ưu hóa định dạng hình ảnh WebP/AVIF kết hợp với lưu trữ trên Cloudflare R2 / AWS S3.

### 🎨 3. Giao diện Điện ảnh Hiện đại & Responsive (UI/UX)
- **Phong cách Dark Cinema**: Phối màu đen sâu, điểm nhấn màu vàng hổ phách/cam neon tạo cảm giác sang trọng như trong rạp chiếu phim.
- **Micro-interactions & Animations**: Hiệu ứng chuyển động mượt mà với **Framer Motion** và thanh trượt phim cảm ứng với **Swiper 12**.
- **Responsive 100%**: Tương thích hoàn hảo từ màn hình điện thoại di động, máy tính bảng đến TV và Desktop màn hình rộng.

### 🔐 4. Xác thực & Quản lý Người dùng (Supabase Auth & Security)
- **Xác thực an toàn qua Supabase SSR**: Đăng nhập, đăng ký, quên mật khẩu và khôi phục tài khoản qua Email OTP.
- **Bảo vệ chống Bot với Cloudflare Turnstile**: Ngăn chặn tấn công brute-force và spam tài khoản tự động.
- **Quản lý cá nhân**: Trang hồ sơ cá nhân, đổi mật khẩu, công cụ cắt xén (crop) và cập nhật avatar đại diện.
- **Đồng bộ dữ liệu thời gian thực**: Danh sách phim yêu thích, danh sách xem sau và lịch sử xem phim được lưu trữ đồng bộ trên Cloud.

### 🛠️ 5. Trang Quản trị & Tự động hóa (Admin Dashboard & Automation)
- **Admin Dashboard bảo mật**: Quản lý các bộ phim tuyển chọn (Editor's Choice), danh mục nổi bật.
- **Bật/Tắt chế độ bảo trì tức thì (Maintenance Mode)**: Kiểm soát trạng thái hệ thống từ xa mà không cần redeploy.
- **Xóa Cache thủ công (Flush Cache API)**: Làm mới dữ liệu cache Redis chỉ với một lệnh gọi an toàn có Secret Token.
- **Hệ thống cảnh báo Telegram Bot**: Tự động gửi thông báo về nhóm Telegram khi người dùng báo cáo lỗi phim hoặc gửi form liên hệ.

### 🔍 6. Chuẩn hóa SEO & Chia sẻ Mạng xã hội
- **Dynamic Metadata & OpenGraph**: Tự động sinh thẻ Meta, Twitter Cards, hình ảnh xem trước cho từng bộ phim.
- **Cấu trúc dữ liệu Schema.org**: Hỗ trợ JSON-LD loại `Movie`, `VideoObject` và `BreadcrumbList` giúp Google Index và hiển thị Rich Snippets.
- **Tự động sinh Sitemap & Robots.txt**: Tối ưu hóa thu thập dữ liệu tìm kiếm định kỳ.

---

## 🛠️ Công nghệ cốt lõi (Tech Stack)

| Lĩnh vực | Công nghệ sử dụng |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions) |
| **Thư viện UI** | [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/) |
| **Video Player** | [Artplayer](https://artplayer.org/) & [HLS.js](https://github.com/video-dev/hls.js/) |
| **Cơ sở dữ liệu & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Supabase SSR, Row Level Security) |
| **Caching Layer** | [Upstash Redis](https://upstash.com/) (Serverless REST) & [ioredis](https://github.com/redis/ioredis) |
| **Lưu trữ CDN** | Cloudflare R2 / [AWS S3 Client](https://aws.amazon.com/s3/) & [Sharp](https://sharp.pixelplumbing.com/) |
| **Quản lý State & Fetching** | [Zustand](https://zustand.docs.pmnd.rs/), [SWR](https://swr.vercel.app/) |
| **Bảo mật & Captcha** | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |
| **Hiệu ứng & Slider** | [Framer Motion](https://www.framer.com/motion/), [Swiper](https://swiperjs.com/) |
| **Thông báo sự cố** | Telegram Bot API |

---

## 📂 Cấu trúc dự án (Project Structure)

```text
lofilm/
├── app/
│   ├── (admin)/               # Phân hệ quản trị (Dashboard, Login, Editor's Choice)
│   ├── (pages)/               # Các trang người dùng
│   │   ├── ca-nhan/           # Trang hồ sơ & cài đặt tài khoản
│   │   ├── dang-nhap/         # Đăng nhập & Đăng ký (Turnstile Protected)
│   │   ├── danh-sach/         # Danh sách phim theo loại (phim-le, phim-bo, ...)
│   │   ├── dat-lai-mat-khau/  # Khôi phục mật khẩu qua Token/OTP
│   │   ├── dien-vien/         # Danh sách & chi tiết diễn viên
│   │   ├── lich-su/           # Lịch sử xem phim người dùng
│   │   ├── phim/              # Trang chi tiết phim & phòng chiếu Video Player
│   │   ├── the-loai/          # Danh mục phim theo thể loại
│   │   ├── quoc-gia/          # Danh mục phim theo quốc gia
│   │   ├── tim-kiem/          # Tìm kiếm thông minh & bộ lọc nâng cao
│   │   ├── xem-sau/           # Danh sách xem sau
│   │   └── yeu-thich/         # Danh sách phim yêu thích
│   ├── actions/               # Next.js Server Actions (Auth, Admin, Reports)
│   ├── api/                   # API Routes (proxy, flush-cache, social, contact, report)
│   ├── auth/                  # Supabase Auth callback handler
│   ├── components/            # UI Components tái sử dụng (Header, Footer, Player, Cards, Modal)
│   ├── config/                # Cấu hình website (site.ts, domain, SEO metadata)
│   ├── hooks/                 # Custom React Hooks
│   ├── lib/                   # Khởi tạo kết nối Redis, Supabase, prefetch logic
│   ├── store/                 # Zustand State Stores
│   ├── types/                 # TypeScript interfaces & types định nghĩa dữ liệu
│   ├── utils/                 # Tiện ích bổ trợ (imageLoader, supabase clients, movieEnricher)
│   ├── globals.css            # Thiết lập Tailwind CSS v4 & theme variables
│   ├── layout.tsx             # Root layout tổng quát của ứng dụng
│   ├── middleware.ts          # Middleware bảo vệ route, kiểm tra maintenance & canonical SEO
│   ├── robots.ts              # Cấu hình robots.txt tự động
│   └── sitemap.ts             # Cấu hình sitemap.xml động
├── public/                    # Static Assets (Logo, icons, placeholders)
├── .env.example               # Mẫu cấu hình biến môi trường
├── next.config.ts             # Cấu hình Next.js (Headers bảo mật, Image domains, Optimization)
├── package.json               # Danh sách thư viện phụ thuộc & scripts
└── tsconfig.json              # Cấu hình TypeScript
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### 1. Yêu cầu tiên quyết (Prerequisites)
- **Node.js**: Phiên bản `>= 20.x` (Khuyến nghị sử dụng bản LTS mới nhất)
- **Package Manager**: `npm`, `pnpm` hoặc `yarn`
- **Tài khoản dịch vụ**: [Supabase](https://supabase.com), [Upstash Redis](https://upstash.com), [Cloudflare](https://dash.cloudflare.com) (tùy chọn).

---

### 2. Clone mã nguồn & Cài đặt thư viện

```bash
# Clone repository
git clone https://github.com/your-username/lofilm.git

# Di chuyển vào thư mục dự án
cd lofilm/lofilm

# Cài đặt toàn bộ dependencies
npm install
```

---

### 3. Thiết lập biến môi trường (.env)

Tạo file `.env.local` từ file mẫu `.env.example`:

```bash
cp .env.example .env.local
```

Điền các thông số chính xác vào file `.env.local`:

```env
# 🌐 Domain & Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 🗄️ Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ⚡ Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# 🛡️ Cloudflare Turnstile Captcha
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# 🔑 Admin Dashboard & Cache Secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_secret_password
CACHE_FLUSH_SECRET=lofilm-flush-2026

# 🤖 Telegram Bot (Tùy chọn - Báo cáo lỗi & liên hệ)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

---

### 4. Chạy môi trường Development

```bash
npm run dev
```

Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**

---

### 5. Build và chạy Production

```bash
# Build dự án
npm run build

# Khởi chạy production server
npm run start
```

---

## 📜 Các lệnh thao tác (Scripts)

| Lệnh | Chức năng |
| :--- | :--- |
| `npm run dev` | Khởi chạy server phát triển (Development Server) |
| `npm run build` | Đóng gói và biên dịch dự án cho môi trường Production |
| `npm run start` | Chạy production server đã được build |
| `npm run lint` | Kiểm tra định dạng code và lỗi cú pháp với ESLint |

---

## 🔒 Bảo mật & Tối ưu hóa (Security & Performance)

1. **Security Headers**: Tự động cấu hình các HTTP headers an toàn (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`).
2. **Turnstile Bot Detection**: Xác thực CAPTCHA vô hình giúp ngăn chặn spam registration và password brute-forcing.
3. **Canonical URL Enforcement**: Middleware tự động chuẩn hóa redirect tránh trùng lặp nội dung gây phạt điểm SEO.
4. **Resilient Fallback Mechanism**: Hệ thống bộ nhớ đệm tự động fallback an toàn nếu dịch vụ Cache hoặc Supabase gặp sự cố gián đoạn.

---

## 🤝 Đóng góp phát triển (Contributing)

Mọi đóng góp nhằm cải thiện chất lượng của LoFilm đều được hoan nghênh:

1. **Fork** dự án về tài khoản của bạn.
2. Tạo branch tính năng mới (`git checkout -b feature/tinh-nang-moi`).
3. Commit những thay đổi của bạn (`git commit -m 'feat: thêm tính năng mới'`).
4. Push lên branch (`git push origin feature/tinh-nang-moi`).
5. Tạo một **Pull Request** giải thích chi tiết về thay đổi.

---

## 📄 Bản quyền (License)

Dự án được phân phối dưới giấy phép **MIT License**. Xem chi tiết tại tệp [LICENSE](LICENSE).

<p align="center">
  Được phát triển với ❤️ bởi <strong>LoFilm Team</strong>
</p>
