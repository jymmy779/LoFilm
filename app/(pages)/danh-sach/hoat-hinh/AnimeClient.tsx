"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";
import { useSearchParams } from "next/navigation";
import { CatalogInitialData } from "@/app/utils/serverFetch";

export default function AnimeClient({ initialData }: { initialData?: CatalogInitialData }) {
    const searchParams = useSearchParams();
    const isAnime = searchParams.get('country') === 'nhat-ban';

    return (
        <MovieCatalogClient
            title={isAnime ? "Phim Anime" : "Phim Hoạt Hình"}
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/hoat-hinh"
            defaultType="hoathinh"
            initialData={initialData}
        />
    );
}
