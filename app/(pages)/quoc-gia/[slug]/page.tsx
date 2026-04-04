import { Metadata } from "next";
import { Suspense } from "react";
import CountryClient from "./CountryClient";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    // Map slug to country name if needed, or simply title case it
    const displaySlug = slug.split("-").join(" ");
    const title = displaySlug.charAt(0).toUpperCase() + displaySlug.slice(1);

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
