import { Metadata } from "next";
import { Suspense } from "react";
import CountryClient from "./CountryClient";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    
    let title = slug.split("-").join(" ");
    title = title.charAt(0).toUpperCase() + title.slice(1);

    try {
        const res = await fetch("https://phimapi.com/quoc-gia");
        const countries = await res.json();
        const country = countries.find((item: any) => item.slug === slug);
        if (country) title = country.name;
    } catch (err) {
        console.error("Lỗi fetch metadata quốc gia:", err);
    }

    return {
        title: `Phim ${title} | LoFilm - Xem phim online chất lượng cao`,
        description: `Tổng hợp các bộ phim sản xuất tại ${title} mới nhất, được cập nhật liên tục trên LoFilm.`,
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
