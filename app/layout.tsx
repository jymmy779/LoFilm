import type { Metadata, Viewport } from "next";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import InitialLoader from "./components/Transition/InitialLoader";
import ReunificationLoader from "./components/Transition/ReunificationLoader";
import { PageTransitionProvider } from "./components/Transition/PageTransitionContext";
import "./globals.css";
import { Inter, Montserrat } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  display: "swap",
});


import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import { GoogleAnalytics } from '@next/third-parties/google'
import AdsterraSocialBar from "./components/Ads/AdsterraSocialBar";


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a1628',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.munos.store'),
  title: "LoFilm - Xem Phim Online Chất Lượng Cao | Phim 4K Vietsub Miễn Phí",
  description: "LoFilm - Trang xem phim online chất lượng cao 4K, Vietsub, thuyết minh hoàn toàn miễn phí. Kho phim lẻ, phim bộ, anime, phim chiếu rạp mới nhất 2025-2026. Trải nghiệm xem phim LoFilm không quảng cáo, tốc độ tải cực nhanh, giao diện hiện đại.",
  manifest: '/manifest.json',
  keywords: [
    "LoFilm", "lofilm", "lo film", "lofilmtv", "lofilm net", "lofilm me", "lofilm chill", "lofilm phim", 
    "xem phim lofilm", "xem phim lo film", "trang phim lofilm", "web phim lofilm", "lofilm xem phim", 
    "lofilm phim hay", "lofilm vietsub", "lofilm 4k", "phim moi", "phim hay 2026", "xem phim online", 
    "phim vietsub", "phim bo moi", "phim le hay", "phim chieu rap", "phim thuyet minh", "phim long tieng", 
    "xem phim hd", "phim online mien phi", "phim nhanh", "phim khong quang cao", "kho phim hay", 
    "phim hanh dong", "phim tinh cam", "phim hai", "phim co trang", "phim ma", "phim kinh di", 
    "phim hoat hinh", "anime vietsub", "phim trung quoc", "phim han quoc", "phim au my", "phim thai lan", 
    "phim nhat ban", "phim viet nam", "phim moi nhat", "xem phim nhanh", "phim chat luong cao", 
    "phim 1080p", "phim bluray", "phim netflix", "phim hulu", "phim disney", "phim hay moi ngay"
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: "LoFilm - Kho Phim Giải Trí Đỉnh Cao , Xem Phim Online 4K , Vietsub",
    description: "Trải nghiệm xem phim chất lượng cao 4K, Vietsub, thuyết minh hoàn toàn miễn phí tại LoFilm. Kho phim mới cập nhật mỗi ngày, không quảng cáo khó chịu.",
    url: "https://www.munos.store",
    siteName: "LoFilm",
    locale: "vi_VN",
    type: "website",
    images: [{
      url: "https://www.munos.store/lofilm_logo.webp",
      width: 1200,
      height: 630,
      alt: "LoFilm - Xem Phim Online Chất Lượng Cao",
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoFilm - Xem Phim Online Chất Lượng Cao',
    description: 'Xem phim LoFilm miễn phí, chất lượng 4K, Vietsub. Kho phim mới cập nhật mỗi ngày.',
    images: ['https://www.munos.store/lofilm_logo.webp'],
  },
  alternates: {
    canonical: '/',
  },
};

import TopProgressBar from "./components/Transition/TopProgressBar";
import AuthListener from "./components/Auth/AuthListener";
import NetworkMonitor from "./components/Network/NetworkMonitor";
import ScrollToTop from "./components/Common/ScrollToTop";
import { AuthProvider } from "./components/Auth/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://wsrv.nl" />
        <link rel="preconnect" href="https://phimimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.phimapi.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://phimapi.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "LoFilm",
              "alternateName": ["Lo Film", "LoFilm TV", "Xem Phim LoFilm", "Phim LoFilm", "LoFilm Net"],
              "url": "https://www.munos.store",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.munos.store/?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "LoFilm",
              "url": "https://www.munos.store",
              "logo": "https://www.munos.store/lofilm_logo.webp",
              "sameAs": [
                "https://t.me/janencl",
                "https://t.me/+5S1xkPn1SCAxZWZl"
              ],
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Menu Chính",
              "itemListElement": [
                {
                  "@type": "SiteNavigationElement",
                  "position": 1,
                  "name": "Phim Mới",
                  "url": "https://www.munos.store/danh-sach/phim-moi"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 2,
                  "name": "Phim Bộ",
                  "url": "https://www.munos.store/danh-sach/phim-bo"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 3,
                  "name": "Phim Lẻ",
                  "url": "https://www.munos.store/danh-sach/phim-le"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 4,
                  "name": "Phim Chiếu Rạp",
                  "url": "https://www.munos.store/danh-sach/phim-chieu-rap"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 5,
                  "name": "Hoạt Hình",
                  "url": "https://www.munos.store/danh-sach/hoat-hinh"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 6,
                  "name": "Đăng nhập",
                  "url": "https://www.munos.store/auth"
                }
              ]
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} bg-[#0f1115] text-white font-sans`} suppressHydrationWarning>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <NetworkMonitor />
        <AuthListener />
        {(() => {
          const today = new Date();
          const month = today.getMonth() + 1;
          const day = today.getDate();
          const isEventPeriod = (month === 4 && day >= 25) || (month === 5 && day <= 2);
          return isEventPeriod ? <ReunificationLoader /> : <InitialLoader />;
        })()}
        <AuthProvider>
            <PageTransitionProvider>
              <div className="min-h-screen flex flex-col">
                <Suspense fallback={<div className="h-[64px] bg-[#0d1b2e] w-full fixed top-0 left-0 z-50 border-b border-white/10" />}>
                  <Header />
                </Suspense>
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </PageTransitionProvider>
        </AuthProvider>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              background: '#14233e',
              color: '#fff',
              border: '1px solid rgba(255, 255, 254, 0.1)',
              borderRadius: '16px',
            },
          }}
        />
        <ScrollToTop />
        <GoogleAnalytics gaId="G-FCV3H66SFX" />
        {/* Adsterra Social Bar - 4 hours cooldown */}
        <AdsterraSocialBar />
      </body>
    </html>
  );
}
