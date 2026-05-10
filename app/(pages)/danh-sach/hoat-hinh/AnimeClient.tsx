"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";
import { useSearchParams } from "next/navigation";

export default function AnimeClient() {
    const searchParams = useSearchParams();
    const isAnime = searchParams.get('country') === 'nhat-ban';

    return (
        <MovieCatalogClient
            title={isAnime ? "Phim Anime" : "Phim Hoạt Hình"}
            baseApiUrl="https://phimapi.com/v1/api/danh-sach/hoat-hinh"
            defaultType="hoathinh"
        />
    );
}
