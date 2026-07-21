import { Metadata } from "next";
import { Suspense } from "react";
import CountryClient from "./CountryClient";
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
        const res = await fetchWithRedis("https://phimapi.com/quoc-gia", { revalidate: 60 });
        const countries = (res as any)?.data?.items || (Array.isArray(res) ? res : []);
        const country = countries.find((item: any) => item.slug === slug);
        if (country) title = country.name;
    } catch (err) {
        console.error("Lỗi fetch metadata quốc gia:", err);
    }

    return {
        title: `Phim ${title} | LoFilm - Xem phim online chất lượng cao`,
        description: `Tổng hợp các bộ phim sản xuất tại ${title} mới nhất, được cập nhật liên tục trên LoFilm. Xem phim ${title} vietsub chất lượng 4K.`,
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
            canonical: `https://www.munos.store/quoc-gia/${slug}`,
        },
    };
}

export default async function CountryPage({ params }: Props) {
    const { slug } = await params;
    
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <CountryData slug={slug} />
        </Suspense>
    );
}

async function CountryData({ slug }: { slug: string }) {
    let countryName = slug.split("-").join(" ");
    countryName = countryName.charAt(0).toUpperCase() + countryName.slice(1);

    try {
        const res = await fetchWithRedis("https://phimapi.com/quoc-gia", { revalidate: 60 });
        const countries = (res as any)?.data?.items || (Array.isArray(res) ? res : []);
        const country = countries.find((item: any) => item.slug === slug);
        if (country) countryName = country.name;
    } catch (err) {
        console.error("Lỗi fetch tên quốc gia:", err);
    }

    const initialData = await fetchCatalogData(
        `https://phimapi.com/v1/api/quoc-gia/${slug}`,
        1,
        48
    );

    return (
        <CountryClient slug={slug} title={`Danh sách phim ${countryName}`} initialData={initialData} />
    );
}

