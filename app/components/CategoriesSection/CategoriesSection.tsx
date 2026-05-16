"use client"

import { useEffect, useState } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import axios from "axios";
import Container from "@/app/components/Container";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import type { HomeCategory } from "@/app/types/home-prefetch";

// Các màu gradient giống với màn hình tham khảo
const gradientVariants = [
    "from-[#6a5af9] to-[#d66efd]", // Âm nhạc (Tím - Hồng)
    "from-[#439e80] to-[#b3a88a]", // Bí ẩn (Xanh ngọc - Nâu nhạt)
    "from-[#9d7bb0] to-[#de8594]", // Chiến tranh (Tím nhạt - Hồng đất)
    "from-[#cd6c54] to-[#c26d70]", // Chính kịch (Cam đất - Hồng đậm)
    "from-[#4d86b9] to-[#b17b8f]", // Cổ trang (Xanh lam dương - Tím nhạt)
    "from-[#d6a152] to-[#c76558]", // Gia đình (Vàng đất - Đỏ gạch)
    "from-[#cc6b8c] to-[#d5776d]", // Hài hước (Hồng - Cam đào)
    "from-[#7faa8a] to-[#c27a72]", // Hành động (Xanh rêu - Đỏ nhạt)
];

interface CategoriesSectionProps {
    initialCategories?: HomeCategory[];
}

export default function CategoriesSection({ initialCategories }: CategoriesSectionProps) {
    const [categories, setCategories] = useState<HomeCategory[]>(() => initialCategories ?? []);

    useEffect(() => {
        if ((initialCategories?.length ?? 0) > 0) return;

        axios.get(`/api/proxy?url=${encodeURIComponent("https://phimapi.com/the-loai")}&revalidate=86400`)
            .then(res => {
                const sortedCategories = (res.data as HomeCategory[]).sort((a, b) =>
                    a.name.localeCompare(b.name, "vi")
                );
                setCategories(sortedCategories);
            })
            .catch(err => console.error("Lỗi fetch the-loai:", err));
    }, [initialCategories?.length]);

    // Hiển thị skeleton loading nếu chưa tải xong
    if (categories.length === 0) {
        return (
            <Container as="section" className="relative z-30 -mt-[80px] md:-mt-[140px] mb-10">
                <Skeleton className="w-[250px] h-8 mb-6" rounded="lg" />
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="w-full h-[120px]" rounded="xl" />
                    ))}
                </div>
            </Container>
        );
    }

    // Lấy đúng 8 danh mục đầu tiên
    const displayCategories = categories.slice(0, 8);

    return (
        <Container as="section" className="relative z-30 -mt-[90px] md:-mt-[120px] pointer-events-none animate-fade-in">
            <h2 className=" text-xl lg:text-2xl font-bold text-white mb-6">Bạn đang quan tâm gì?</h2>

            {/* Grid layout cho 8 danh mục */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4 pointer-events-auto">
                {displayCategories.map((cat, index) => {
                    const gradientClass = gradientVariants[index % gradientVariants.length];

                    return (
                        <TransitionLink
                            key={cat.slug}
                            href={`/the-loai/${cat.slug}`}
                            className="block w-full h-[120px] rounded-xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
                        >
                            {/* Gradient nền có hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-85 group-hover:opacity-100 transition-opacity duration-300`} />

                            {/* Thêm một lớp đen mờ gradient từ dưới lên để chữ hiển thị rõ hơn */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />

                            {/* Nội dung thẻ */}
                            <div className="relative z-10 w-full h-full flex flex-col justify-end">
                                <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md leading-tight group-hover:text-[#f5a623] transition-colors">
                                    {cat.name}
                                </h3>
                                <p className="text-xs text-white/70 font-medium flex items-center gap-1 group-hover:text-white transition-colors">
                                    Xem chủ đề
                                    <span className="text-[14px] leading-none mb-[2px]">›</span>
                                </p>
                            </div>
                        </TransitionLink>
                    );
                })}
            </div>
        </Container>
    );
}
