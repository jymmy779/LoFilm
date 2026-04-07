import type { Metadata, Viewport } from "next";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import InitialLoader from "./components/Transition/InitialLoader";
import { PageTransitionProvider } from "./components/Transition/PageTransitionContext";
import PageTransitionOverlay from "./components/Transition/PageTransitionOverlay";
import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import { SkeletonTheme } from "react-loading-skeleton";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a1628',
};

export const metadata: Metadata = {
  title: "LoFilm - Xem Phim Online Chất Lượng Cao, Phim 4K, Vietsub",
  description: "Trải nghiệm xem phim online chất lượng cao 4K, Vietsub tại LoFilm. Kho phim lẻ, phim bộ, anime mới nhất 2026 cập nhật mỗi ngày với tốc độ cực nhanh và không quảng cáo!",
  manifest: '/manifest.json',
  keywords: ["LoFilm", "lofim", "lo film", "xem phim lofilm", "xem phim lo film", "lofilm tv", "lofilm net", "lofilm me", "lofilm chill", "lo phim"],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'none',
    },
  },
  openGraph: {
    title: "LoFilm - Xem Phim Online Chất Lượng Cao, Phim 4K, Vietsub",
    description: "Trải nghiệm xem phim chất lượng cao 4K, Vietsub, thuyết minh hoàn toàn miễn phí tại LoFilm. Kho phim mới cập nhật mỗi ngày, không quảng cáo khó chịu.",
    url: "https://munos.store",
    siteName: "LoFilm",
    locale: "vi_VN",
    type: "website",
  },
};

import TopProgressBar from "./components/Transition/TopProgressBar";
import AuthListener from "./components/Auth/AuthListener";
import NetworkMonitor from "./components/Network/NetworkMonitor";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://phimimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.phimapi.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://phimapi.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "LoFilm",
              "alternateName": ["Lo Film", "LoFilm TV", "Xem Phim LoFilm", "Phim LoFilm"],
              "url": "https://munos.store",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://munos.store/?search={search_term_string}",
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
              "@type": "ItemList",
              "itemListElement": [
                {
                  "@type": "SiteNavigationElement",
                  "position": 1,
                  "name": "Trang Chủ",
                  "url": "https://munos.store"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 2,
                  "name": "Phim Mới",
                  "url": "https://munos.store/danh-sach/phim-moi"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 3,
                  "name": "Phim Bộ",
                  "url": "https://munos.store/danh-sach/phim-bo"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 4,
                  "name": "Phim Lẻ",
                  "url": "https://munos.store/danh-sach/phim-le"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 5,
                  "name": "Phim Chiếu Rạp",
                  "url": "https://munos.store/danh-sach/phim-chieu-rap"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 6,
                  "name": "Đăng nhập",
                  "url": "https://munos.store/auth"
                }
              ]
            })
          }}
        />
      </head>
      <body className="bg-[#0f1115] text-white" suppressHydrationWarning>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <NetworkMonitor />
        <AuthListener />
        <InitialLoader />
        <PageTransitionProvider>
          <PageTransitionOverlay />
          <SkeletonTheme baseColor="#1e293b" highlightColor="#334155">
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </SkeletonTheme>
        </PageTransitionProvider>
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
      </body>
    </html>
  );
}
