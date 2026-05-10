import { Metadata } from "next";
import { Suspense } from "react";
import CategoryClient from "./CategoryClient";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    let title = slug.split("-").join(" ");
    title = title.charAt(0).toUpperCase() + title.slice(1);

    try {
        const categories = await fetchWithRedis("https://phimapi.com/the-loai", { revalidate: 60 });
        const category = Array.isArray(categories) ? categories.find((cat: any) => cat.slug === slug) : null;
        if (category) title = category.name;
    } catch (err) {
        console.error("Lỗi fetch metadata thể loại:", err);
    }

    return {
        title: `Phim ${title} | LoFilm - Xem phim online chất lượng cao`,
        description: `Danh sách phim thuộc thể loại ${title} mới nhất, cập nhật liên tục mỗi ngày trên LoFilm. Xem phim ${title} vietsub, thuyet minh 4K.`,
        keywords: [
            `phim ${title}`,
            `xem phim ${title}`,
            `phim ${title} moi`,
            `phim ${title} hay`,
            `phim ${title} vietsub`,
            `phim ${title} thuyet minh`,
            "lofilm",
            "xem phim online"
        ],
        alternates: {
            canonical: `https://www.munos.store/the-loai/${slug}`,
        },
    };
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    
    let categoryName = slug.split("-").join(" ");
    categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

    try {
        const categories = await fetchWithRedis("https://phimapi.com/the-loai", { revalidate: 60 });
        const category = Array.isArray(categories) ? categories.find((cat: any) => cat.slug === slug) : null;
        if (category) categoryName = category.name;
    } catch (err) {
        console.error("Lỗi fetch tên thể loại:", err);
    }

    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <CategoryClient slug={slug} title={`Danh sách phim ${categoryName}`} />
        </Suspense>
    );
}
