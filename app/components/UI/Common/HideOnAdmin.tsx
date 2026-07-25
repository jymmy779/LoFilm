"use client";
import { usePathname } from "next/navigation";

export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Nếu đang ở trang admin, không render các component con (Header, Footer, Popup...)
    if (pathname.startsWith("/admin")) {
        return null;
    }
    
    return <>{children}</>;
}
