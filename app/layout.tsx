import type { Metadata } from "next";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import InitialLoader from "./components/Transition/InitialLoader";
import { PageTransitionProvider } from "./components/Transition/PageTransitionContext";
import PageTransitionOverlay from "./components/Transition/PageTransitionOverlay";
import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import { SkeletonTheme } from "react-loading-skeleton";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "LoFilm - Xem Phim Online Chất Lượng Cao",
  description: "LoFilm - Không gian điện ảnh chill nhất. Cập nhật liên tục phim lẻ, phim bộ, hoạt hình và TV Shows chất lượng cao hoàn toàn miễn phí.",
  keywords: ["LoFilm", "lofim", "lọ phim", "xem phim online", "phim bộ hd", "phim chiếu rạp", "phim mới"],
  openGraph: {
    title: "LoFilm - Thế giới Điện Ảnh",
    description: "LoFilm - Xem phim với chất lượng cao nhất",
    url: "https://munos.store",
    siteName: "LoFilm",
    locale: "vi_VN",
    type: "website",
  },
};

import AuthListener from "./components/Auth/AuthListener";

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
      </head>
      <body className="bg-[#0f1115] text-white" suppressHydrationWarning>
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
