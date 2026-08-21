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

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;

    return (
        <Suspense key={(resolvedParams.q as string) || "search-root"} fallback={<SearchLoading />}>
            <SearchData resolvedParams={resolvedParams} />
        </Suspense>
    );
}

async function SearchData({
    resolvedParams,
}: {
    resolvedParams: { [key: string]: string | string[] | undefined };
}) {
    const { fetchSearchData } = await import("@/app/utils/serverFetch");
    const query = (resolvedParams.q as string) || "";
    
    const initialData = await fetchSearchData(
        query,
        Number(resolvedParams.page) || 1,
        48,
        {
            category: resolvedParams.cat as string,
            country: resolvedParams.country as string,
            year: resolvedParams.year as string,
            sort: resolvedParams.sort as string
        }
    );

    return <SearchClient key={query} initialData={initialData} />;
}
