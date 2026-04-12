import { Metadata } from "next";
import { Suspense } from "react";
import CountryClient from "./CountryClient";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";

export const revalidate = 30; // Cập nhật danh sách phim mỗi 30 giây

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    
    let title = slug.split("-").join(" ");
    title = title.charAt(0).toUpperCase() + title.slice(1);

    try {
        const countries = await fetchWithRedis("https://phimapi.com/quoc-gia", { revalidate: 60 });
        const country = Array.isArray(countries) ? countries.find((item: any) => item.slug === slug) : null;
        if (country) title = country.name;
    } catch (err) {
        console.error("Lỗi fetch metadata quốc gia:", err);
    }

    return {
        title: `Phim ${title} | LoFilm - Xem phim online chất lượng cao`,
        description: `Tổng hợp các bộ phim sản xuất tại ${title} mới nhất, được cập nhật liên tục trên LoFilm.`,
        alternates: {
            canonical: `https://www.munos.store/quoc-gia/${slug}`,
        },
    };
}

export default async function CountryPage({ params }: Props) {
    const { slug } = await params;
    return (
        <Suspense>
            <CountryClient slug={slug} />
        </Suspense>
    );
}
