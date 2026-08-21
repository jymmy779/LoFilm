"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  // Ẩn sidebar trên trang đăng nhập
  if (pathname === "/admin/login") {
    return null;
  }

  const getLinkClasses = (path: string) => {
    const isActive = pathname.startsWith(path);
    if (isActive) {
      return "flex-1 md:flex-none text-center md:text-left px-3 md:px-4 py-2 bg-blue-900/30 text-blue-400 font-medium border border-blue-800/50 rounded-lg transition-colors whitespace-nowrap";
    }
    return "flex-1 md:flex-none text-center md:text-left px-3 md:px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap";
  };

  return (
    <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 bg-gray-950 p-4 md:p-6 flex flex-col items-center md:items-start gap-4 md:gap-8 border-b md:border-b-0 md:border-r border-gray-800 md:shrink-0 z-40">
      <Link href="/admin/dashboard" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent shrink-0">
        LoFilm CMS
      </Link>
      
      <nav className="flex flex-row md:flex-col gap-2 w-full overflow-x-auto hide-scrollbar pb-1 md:pb-0">
        <Link href="/admin/dashboard" className={getLinkClasses("/admin/dashboard")}>
          📊 <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <Link href="/admin/movies" className={getLinkClasses("/admin/movies")}>
          🎬 <span className="hidden sm:inline">Quản lý Phim</span>
        </Link>
      </nav>
    </aside>
  );
}
