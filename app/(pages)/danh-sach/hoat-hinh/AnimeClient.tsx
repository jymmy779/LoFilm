"use client";

import MovieCatalogClient from "@/app/components/Movies/MovieCatalog/MovieCatalogClient";
import { useSearchParams } from "next/navigation";
import { CatalogInitialData } from "@/app/utils/serverFetch";

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export default function AnimeClient({ initialData }: { initialData?: CatalogInitialData }) {
    const searchParams = useSearchParams();
    const isAnime = searchParams.get('country') === 'nhat-ban';

    return (
        <MovieCatalogClient
            title={isAnime ? "Phim Anime" : "Phim Hoạt Hình"}
            baseApiUrl={`${INTERNAL_API_URL}/danh-sach/hoat-hinh`}
            defaultType="hoathinh"
            initialData={initialData}
        />
    );
}
