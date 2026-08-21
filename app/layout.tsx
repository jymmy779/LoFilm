import type { Metadata, Viewport } from "next";
import Header from "./components/Layout/Header/Header";
import Footer from "./components/Layout/Footer/Footer";
import InitialLoader from "./components/UI/Transition/InitialLoader";
import ReunificationLoader from "./components/UI/Transition/ReunificationLoader";
import { getSiteSettings } from "./actions/adminSettings";
import { PageTransitionProvider } from "./components/UI/Transition/PageTransitionContext";
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
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

import ClientToaster from "./components/UI/Common/ClientToaster";


import { Suspense } from "react";
import { GoogleAnalytics } from '@next/third-parties/google';


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

import { SITE_URL, getAbsoluteUrl } from "./config/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CineStream - Modern Movie Streaming & Discovery Platform",
    template: "%s | CineStream"
  },
  description: "CineStream - Nền tảng xem phim và khám phá điện ảnh hiện đại với hiệu năng vượt trội, xây dựng trên Next.js 16, React 19 và kiến trúc Multi-Layer Caching.",
  applicationName: 'CineStream',
  authors: [{ name: 'CineStream Showcase' }],
  generator: 'Next.js',
  manifest: '/manifest.json',
  referrer: 'origin-when-cross-origin',
  creator: 'CineStream',
  publisher: 'CineStream',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CineStream',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "CineStream - Nền Tảng Xem Phim Full-Stack Hiện Đại",
    description: "Trải nghiệm điện ảnh đỉnh cao với hiệu năng vượt trội, giao diện tinh tế và kiến trúc Streaming SSR tối ưu.",
    url: SITE_URL,
    siteName: "CineStream",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CineStream - Nền Tảng Xem Phim Full-Stack Hiện Đại",
    description: "Trải nghiệm điện ảnh đỉnh cao với hiệu năng vượt trội, giao diện tinh tế và kiến trúc Streaming SSR tối ưu.",
  },
  alternates: {
    canonical: SITE_URL,
  },
};


import AuthListener from "./components/User/Auth/AuthListener";
import NetworkMonitor from "./components/UI/Network/NetworkMonitor";
import WakeUpMonitor from "./components/UI/Common/WakeUpMonitor";
import ScrollToTop from "./components/UI/Common/ScrollToTop";
import { AuthProvider } from "./components/User/Auth/AuthContext";
import HideOnAdmin from "./components/UI/Common/HideOnAdmin";
import DesktopSidebar from "./components/Layout/Sidebar/DesktopSidebar";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${montserrat.variable}`}>
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
              "name": "CineStream",
              "alternateName": ["CineStream Showcase", "CineStream App"],
              "url": SITE_URL,
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": getAbsoluteUrl("/tim-kiem?q={search_term_string}")
                },
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
              "name": "CineStream",
              "url": SITE_URL,
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
                  "url": getAbsoluteUrl("/danh-sach/phim-moi")
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 2,
                  "name": "Phim Bộ",
                  "url": getAbsoluteUrl("/danh-sach/phim-bo")
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 3,
                  "name": "Phim Lẻ",
                  "url": getAbsoluteUrl("/danh-sach/phim-le")
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 4,
                  "name": "Phim Chiếu Rạp",
                  "url": getAbsoluteUrl("/danh-sach/phim-chieu-rap")
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 5,
                  "name": "Hoạt Hình",
                  "url": getAbsoluteUrl("/danh-sach/hoat-hinh")
                },
                {
                  "@type": "SiteNavigationElement",
                  "position": 6,
                  "name": "Đăng nhập",
                  "url": getAbsoluteUrl("/auth")
                }
              ]
            })
          }}
        />
      </head>
      <body 
        className="bg-[#0F1115] text-white" 
        style={{ backgroundColor: '#0F1115', color: '#ffffff' }}
        suppressHydrationWarning
      >

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
        </HideOnAdmin>
      </body>
    </html>
  );
}
