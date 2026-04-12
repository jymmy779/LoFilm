import type { Metadata, Viewport } from "next";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import InitialLoader from "./components/Transition/InitialLoader";
import { PageTransitionProvider } from "./components/Transition/PageTransitionContext";
import PageTransitionOverlay from "./components/Transition/PageTransitionOverlay";
import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import { SkeletonTheme } from "react-loading-skeleton";
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

import FontAwesomeLoader from "@/app/components/Common/FontAwesomeLoader";
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
  metadataBase: new URL('https://www.munos.store'),
  title: "LoFilm - Kho Phim Giải Trí Đỉnh Cao , Xem Phim Online 4K , Vietsub",
  description: "Xem LoFilm chất lượng cao, phim 4K, Vietsub, thuyết minh. Kho phim lẻ, phim bộ, anime mới nhất 2026 cập nhật mỗi ngày với tốc độ cực nhanh và không quảng cáo! Trải nghiệm điện ảnh đỉnh cao ngay tại nhà.",
  manifest: '/manifest.json',
  keywords: ["LoFilm", "lofim", "lo film", "xem phim lofilm", "xem phim lo film", "lofilm tv", "lofilm net", "lofilm me", "lofilm chill", "lo phim", "phim moi", "phim hay 2026"],
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
    title: "LoFilm - Kho Phim Giải Trí Đỉnh Cao , Xem Phim Online 4K , Vietsub",
    description: "Trải nghiệm xem phim chất lượng cao 4K, Vietsub, thuyết minh hoàn toàn miễn phí tại LoFilm. Kho phim mới cập nhật mỗi ngày, không quảng cáo khó chịu.",
    url: "https://www.munos.store",
    siteName: "LoFilm",
    locale: "vi_VN",
    type: "website",
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
        <link rel="dns-prefetch" href="https://wsrv.nl" />
        <link rel="preconnect" href="https://phimimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.phimapi.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://phimapi.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <FontAwesomeLoader />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "LoFilm",
              "alternateName": ["Lo Film", "LoFilm TV", "Xem Phim LoFilm", "Phim LoFilm", "LoFilm Net"],
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
              "@type": "Organization",
              "name": "LoFilm",
              "url": "https://munos.store",
              "logo": "https://munos.store/lofilm_logo.webp",
              "sameAs": [
                "https://facebook.com/lofilm",
                "https://twitter.com/lofilm",
                "https://youtube.com/lofilm"
              ]
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
                  "url": "https://munos.store/danh-sach/phim-chieu-rap"
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 5,
                  "name": "Hoạt Hình",
                  "url": "https://munos.store/danh-sach/hoat-hinh"
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
      <body className={`${inter.variable} ${montserrat.variable} bg-[#0f1115] text-white font-sans`} suppressHydrationWarning>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <NetworkMonitor />
        <AuthListener />
        <InitialLoader />
        <AuthProvider>
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
      </body>
    </html>
  );
}
