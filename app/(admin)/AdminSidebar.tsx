"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const getLinkClasses = (path: string) => {
    const isActive = pathname.startsWith(path);
    if (isActive) {
      return "px-4 py-2 bg-blue-900/30 text-blue-400 font-medium border border-blue-800/50 rounded-lg transition-colors";
    }
    return "px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors";
  };

  return (
    <aside className="w-64 bg-gray-950 p-6 flex flex-col gap-4 border-r border-gray-800">
      <Link href="/admin/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8">
        LoFilm CMS
      </Link>
      
      <nav className="flex flex-col gap-2">
        <Link href="/admin/dashboard" className={getLinkClasses("/admin/dashboard")}>
          📊 Dashboard
        </Link>
        <Link href="/admin/movies" className={getLinkClasses("/admin/movies")}>
          🎬 Quản lý Phim
        </Link>

      </nav>
    </aside>
  );
}
