import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import { SkeletonTheme } from "react-loading-skeleton";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className="bg-[#0f1115] text-white" suppressHydrationWarning>
        <SkeletonTheme baseColor="#1e293b" highlightColor="#334155">
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </SkeletonTheme>
      </body>
    </html>
  );
}
