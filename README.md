# 🎬 LoFilm - Nền Tảng Xem Phim Trực Tuyến Hiện Đại (Full-Stack)

<p align="center">
  <img src="./public/banner.png" alt="LoFilm Banner" width="100%" onerror="this.style.display='none'" />
</p>

<p align="center">
  <strong>Trải nghiệm điện ảnh đỉnh cao với hiệu năng vượt trội, giao diện tinh tế, Backend crawler tự động & cơ sở dữ liệu nội bộ 30.000+ phim.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express%20%26%20Prisma-339933?style=for-the-badge&logo=node.js" alt="Backend" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Redis-Local%20%26%20ioRedis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Storage-Cloudflare%20R2-F38020?style=for-the-badge&logo=cloudflare" alt="Cloudflare R2" />
</p>

---

## 📖 Giới thiệu (Overview)

**LoFilm** là hệ thống xem phim trực tuyến toàn diện, hoạt động độc lập và tự chủ dữ liệu với kiến trúc **Full-Stack**:
- **Frontend**: Xây dựng bằng **Next.js 16 (App Router)** và **React 19**, streaming SSR, tối ưu hóa tốc độ tải trang cực nhanh và giao diện Dark Cinema cao cấp.
- **Backend & Crawler Service**: Dịch vụ Node.js / Express / Prisma chuyên trách lưu trữ hơn **30.000+ bộ phim**, hỗ trợ API nội bộ hiệu năng cao và **Cronjob tự động đồng bộ tập phim mới định kỳ mỗi 15 phút**.

---

## ✨ Tính năng nổi bật (Key Features)

### 🎥 1. Trình phát Video chuyên nghiệp (Artplayer & HLS)
- **Hỗ trợ HLS đa độ phân giải**: Tự động chuyển luồng mượt mà, hỗ trợ nhiều server phát dự phòng.
- **Tính năng cao cấp**: Tùy chỉnh tốc độ, chế độ rạp chiếu (Theater mode), Picture-in-Picture (PiP), phím tắt điều khiển nhanh.
- **Ghi nhớ tiến trình xem**: Tự động lưu mốc thời gian đang xem và tự động chuyển tiếp tập kế tiếp.

### ⚡ 2. Backend Nội Bộ & Crawler Tự Động (Self-Hosted Database & Auto-Sync)
- **Kho dữ liệu 30.000+ phim độc lập**: Không phụ thuộc trực tiếp vào API bên thứ 3 từ phía Frontend.
- **Cronjob ngầm (Background Worker)**: Tự động quét và cập nhật phim mới / tập phim mới mỗi 15 phút.
- **Tìm kiếm thông minh (Smart Search Engine)**: Hỗ trợ tìm kiếm siêu tốc tiếng Việt có dấu, không dấu, chữ hoa/thường, tên gốc tiếng Anh và slug.

### 🚀 3. Hiệu năng & Bộ nhớ đệm Đa tầng (Multi-Layer Caching)
- **Dual-layer Cache**: Kết hợp **RAM L1 Cache** và **Local Redis (ioredis)** để lưu bộ nhớ đệm dữ liệu với độ trễ siêu thấp dưới 1ms.
- **Smart Image Loader**: Tự động tối ưu hóa hình ảnh WebP kết hợp lưu trữ CDN trên Cloudflare R2.

### 🎨 4. Giao diện Điện ảnh Hiện đại & Responsive (UI/UX)
- **Phong cách Dark Cinema**: Gam màu tối sang trọng, micro-animations mượt mà với **Framer Motion** và thanh trượt **Swiper 12**.
- **Responsive 100%**: Tương thích hoàn hảo mọi thiết bị (Mobile, Tablet, Desktop, Smart TV).

### 🔐 5. Xác thực & Tính năng Người dùng (Supabase Auth)
- Đăng nhập, đăng ký, khôi phục mật khẩu OTP, bảo vệ chống bot với **Cloudflare Turnstile**.
- Đồng bộ danh sách yêu thích, xem sau và lịch sử xem phim trên Cloud.

---

## 🛠️ Công nghệ cốt lõi (Tech Stack)

| Lĩnh vực | Công nghệ sử dụng |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions), [React 19](https://react.dev/) |
| **Backend & API Service** | [Express.js](https://expressjs.com/), [Prisma ORM](https://www.prisma.io/), [Node-Cron](https://github.com/node-cron/node-cron) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Video Player** | [Artplayer](https://artplayer.org/) & [HLS.js](https://github.com/video-dev/hls.js/) |
| **Cơ sở dữ liệu** | SQLite / PostgreSQL (Prisma), [Supabase](https://supabase.com/) |
| **Caching Layer** | [Local Redis](https://redis.io/) & [ioredis](https://github.com/redis/ioredis) |
| **Lưu trữ CDN** | Cloudflare R2 |
| **Triển khai & CI/CD** | GitHub Actions, PM2 (Process Manager), Ubuntu VPS |

---

## 📂 Cấu trúc dự án (Project Structure)

```text
lofilm/
├── app/                       # Ứng dụng Next.js Frontend
│   ├── (admin)/               # Phân hệ quản trị (Dashboard, Settings)
│   ├── (pages)/               # Các trang người dùng (danh-sach, the-loai, quoc-gia, phim...)
│   ├── actions/               # Server Actions
│   ├── api/                   # API Routes (proxy, social, warm-cache...)
│   ├── components/            # UI Components tái sử dụng (Header, Footer, Player, Cards)
│   ├── lib/                   # Kết nối Redis, Supabase, prefetch bundle
│   └── utils/                 # Tiện ích bổ trợ (serverFetch, apiConfig, movieUtils)
├── backend/                   # 🚀 Dịch vụ Backend & Crawler nội bộ
│   ├── prisma/                # Schema database & migrations
│   ├── src/
│   │   ├── controllers/       # Xử lý API catalog, chi tiết phim, tìm kiếm
│   │   ├── routes/            # Khai báo endpoint /api/v1/...
│   │   ├── services/          # Crawler engine, Cronjob & Sync service
│   │   └── scripts/           # Scripts cào dữ liệu (seedInitial, manualSync)
│   ├── ecosystem.config.cjs   # Cấu hình PM2 cho Backend
│   └── package.json           # Cấu hình dependencies Backend
├── .github/workflows/         # CI/CD tự động deploy lên VPS (deploy.yml)
├── public/                    # Static Assets (Logo, icons, banner)
├── next.config.ts             # Cấu hình Next.js
└── package.json               # Cấu hình Frontend
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### 1. Khởi chạy Backend (Dịch vụ API & Crawler)

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt dependencies
npm install

# 3. Khởi tạo Database
npx prisma generate
npx prisma db push

# 4. (Tùy chọn) Cào dữ liệu 30.000 phim lần đầu
npm run seed:initial

# 5. Khởi chạy Backend Server
npm run dev
# Backend chạy tại http://localhost:5000/api/v1
```

---

### 2. Khởi chạy Frontend (Next.js)

```bash
# 1. Quay lại thư mục gốc Frontend
cd ..

# 2. Cài đặt dependencies
npm install

# 3. Tạo file cấu hình môi trường
cp .env.example .env.local

# 4. Khởi chạy Frontend
npm run dev
```

Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**.

---

## 📜 Các lệnh thao tác chính (Scripts)

### Frontend:
| Lệnh | Chức năng |
| :--- | :--- |
| `npm run dev` | Khởi chạy server phát triển Frontend (Port 3000) |
| `npm run build` | Đóng gói và biên dịch dự án cho môi trường Production |
| `npm run start` | Chạy Production server |

### Backend (`cd backend`):
| Lệnh | Chức năng |
| :--- | :--- |
| `npm run dev` | Khởi chạy server Backend kèm Cronjob tự động (Port 5000) |
| `npm run sync:now` | Quét và đồng bộ ngay lập tức 3 trang phim/tập phim mới nhất |
| `npm run seed:initial` | Cào toàn bộ 30.000 phim vào Database (chạy 1 lần khởi tạo) |
| `npm run build` | Build TypeScript sang JavaScript |

---

## 🚢 Triển khai tự động (CI/CD Deployment)

Dự án tích hợp sẵn quy trình CI/CD qua **GitHub Actions** (`.github/workflows/deploy.yml`). Khi bạn đẩy code lên nhánh `main`, hệ thống sẽ tự động SSH vào VPS để:
1. `git pull` code mới nhất.
2. Build và tối ưu hóa Frontend Next.js.
3. Build Backend và khởi chạy dịch vụ qua **PM2**.
4. Reload toàn bộ hệ thống với độ trễ (downtime) bằng 0.

---

## 📄 Bản quyền (License)

Dự án được phân phối dưới giấy phép **MIT License**.

<p align="center">
  Được phát triển với ❤️ bởi <strong>LoFilm Team</strong>
</p>
