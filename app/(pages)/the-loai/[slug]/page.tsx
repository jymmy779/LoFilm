import { Metadata } from "next";
import { Suspense } from "react";
import CategoryClient from "./CategoryClient";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    let title = slug.split("-").join(" ");
    title = title.charAt(0).toUpperCase() + title.slice(1);

    try {
        const res = await fetchWithRedis("https://phimapi.com/the-loai", { revalidate: 60 });
        const categories = (res as any)?.data?.items || (Array.isArray(res) ? res : []);
        const category = categories.find((cat: any) => cat.slug === slug);
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
        const res = await fetchWithRedis("https://phimapi.com/the-loai", { revalidate: 60 });
        const categories = (res as any)?.data?.items || (Array.isArray(res) ? res : []);
        const category = categories.find((cat: any) => cat.slug === slug);
        if (category) categoryName = category.name;
    } catch (err) {
        console.error("Lỗi fetch tên thể loại:", err);
    }

    const initialData = await fetchCatalogData(
        `https://phimapi.com/v1/api/the-loai/${slug}`,
        1,
        48
    );

    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <CategoryClient slug={slug} title={`Danh sách phim ${categoryName}`} initialData={initialData} />
        </Suspense>
    );
}
