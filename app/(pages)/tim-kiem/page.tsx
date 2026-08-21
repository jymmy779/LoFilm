import { Metadata } from "next";
import { getAbsoluteUrl } from "@/app/config/site";
import SearchClient from "@/app/SearchClient";
import CatalogSkeleton from "@/app/components/Movies/MovieCatalog/CatalogSkeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
    const params = await searchParams;
    const query = params.q as string;

    if (query) {
        return {
            title: `Tìm kiếm: ${query} | LoFilm`,
            description: `Kết quả tìm kiếm cho từ khóa "${query}" trên LoFilm. Khám phá kho phim đa dạng, chất lượng cao ngay tại đây.`,
            alternates: {
                canonical: getAbsoluteUrl(`/tim-kiem?q=${encodeURIComponent(query)}`),
            },
        };
    }

    return {
        title: "Tìm kiếm phim | LoFilm",
        description: "Tìm kiếm phim, anime, show truyền hình yêu thích của bạn tại LoFilm.",
        alternates: {
            canonical: getAbsoluteUrl(`/tim-kiem`),
        },
    };
}

import SearchLoading from "./loading";

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchLoading />}>
            <SearchClient />
        </Suspense>
    );
}
