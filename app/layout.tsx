import type { Metadata, Viewport } from "next";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import InitialLoader from "./components/Transition/InitialLoader";
import ReunificationLoader from "./components/Transition/ReunificationLoader";
import { getSiteSettings } from "./actions/adminSettings";
import { PageTransitionProvider } from "./components/Transition/PageTransitionContext";
import "./globals.css";
import { Inter, Montserrat } from "next/font/google";

async function EventLoaderWrapper() {
  const settings = await getSiteSettings();
  if (settings.active_event === 'reunification') {
    return <ReunificationLoader />;
  }
  return <InitialLoader />;
}

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

import ClientToaster from "./components/Common/ClientToaster";


import { Suspense } from "react";
import { GoogleAnalytics } from '@next/third-parties/google'
import AdsterraSocialBar from "./components/Ads/AdsterraSocialBar";


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Cho phép zoom để cải thiện accessibility
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0F1115' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.munos.store'),
  title: {
    default: "LoFilm - Xem Phim Online Chất Lượng Cao | Phim 4K Vietsub Miễn Phí",
    template: "%s | LoFilm"
  },
  description: "LoFilm - Trang xem phim online chất lượng cao 4K, Vietsub, thuyết minh hoàn toàn miễn phí. Kho phim lẻ, phim bộ, anime, phim chiếu rạp mới nhất 2025-2026. Trải nghiệm xem phim LoFilm không quảng cáo, tốc độ tải cực nhanh, giao diện hiện đại.",
  applicationName: 'LoFilm',
  authors: [{ name: 'LoFilm Team' }],
  generator: 'Next.js',
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
  referrer: 'origin-when-cross-origin',
  creator: 'LoFilm',
  publisher: 'LoFilm',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LoFilm',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/images/lofilm_logo.webp',
  },
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
      url: "https://www.munos.store/images/lofilm_logo.webp",
      width: 1200,
      height: 630,
      alt: "LoFilm - Xem Phim Online Chất Lượng Cao",
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoFilm - Xem Phim Online Chất Lượng Cao',
    description: 'Xem phim LoFilm miễn phí, chất lượng 4K, Vietsub. Kho phim mới cập nhật mỗi ngày.',
    images: ['https://www.munos.store/images/lofilm_logo.webp'],
  },
  alternates: {
    canonical: 'https://www.munos.store',
  },
};


import AuthListener from "./components/Auth/AuthListener";
import NetworkMonitor from "./components/Network/NetworkMonitor";
import WakeUpMonitor from "./components/Common/WakeUpMonitor";
import ScrollToTop from "./components/Common/ScrollToTop";
import { AuthProvider } from "./components/Auth/AuthContext";
import HideOnAdmin from "./components/Common/HideOnAdmin";
import DesktopSidebar from "./components/Sidebar/DesktopSidebar";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="clckd" content="7b88ce9a85e401383596fcdebfbf0c88" />
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
              "logo": "https://www.munos.store/images/lofilm_logo.webp",
              "sameAs": [
                "https://t.me/ponpornsec",
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
      <body className={`${inter.variable} ${montserrat.variable} bg-[#0F1115] text-white font-sans`} suppressHydrationWarning>

        <NetworkMonitor />
        <WakeUpMonitor />
        <AuthListener />
        {/* Render Event Loader or Default Loader based on admin settings */}
        <EventLoaderWrapper />
        <AuthProvider>
          <PageTransitionProvider>
            <div className="min-h-screen flex flex-col">
              <HideOnAdmin>
                <DesktopSidebar />
                <Suspense fallback={<div className="h-[64px] bg-[#0F1115] w-full fixed top-0 left-0 z-50 border-b border-white/10" />}>
                  <Header />
                </Suspense>
              </HideOnAdmin>
              <main className="flex-1 min-h-[70vh] md:min-h-[80vh] flex flex-col xl:ml-[100px] transition-all">
                {children}
              </main>
              <HideOnAdmin>
                <div className="xl:ml-[100px] transition-all">
                  <Footer />
                </div>
              </HideOnAdmin>
            </div>
          </PageTransitionProvider>
        </AuthProvider>

        <ClientToaster />
        <HideOnAdmin>
          <ScrollToTop />
          <GoogleAnalytics gaId="G-FCV3H66SFX" />
          {/* Adsterra Social Bar - 4 hours cooldown */}
          <AdsterraSocialBar />
        </HideOnAdmin>
      </body>
    </html>
  );
}
