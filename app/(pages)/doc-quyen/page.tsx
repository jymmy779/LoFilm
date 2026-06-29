import { Metadata } from "next";
import { Suspense } from "react";

import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";
import { createClient } from "@/app/utils/supabase/server";
import DocQuyenClient from "./DocQuyenClient";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Phim Độc Quyền (Beta) | LoFilm",
    description: "Khám phá danh sách phim độc quyền chất lượng cao, tự làm phụ đề chuẩn Netflix chỉ có tại LoFilm.",
};

async function getExclusiveMovies() {
    try {
        const supabase = await createClient();
        const { data: exclusiveMovies } = await supabase
            .from('exclusive_movies')
            .select(`*, exclusive_episodes (*)`)
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (!exclusiveMovies || exclusiveMovies.length === 0) return [];

        const apiKey = "fb7bb23f03b6994dafc674c074d01761";
        
        const promises = exclusiveMovies.map(async (ex) => {
            const tmdbType = ex.type === "single" ? "movie" : "tv";
            const [resVi, resEn] = await Promise.all([
                fetch(`https://api.themoviedb.org/3/${tmdbType}/${ex.tmdb_id}?api_key=${apiKey}&language=vi-VN`),
                fetch(`https://api.themoviedb.org/3/${tmdbType}/${ex.tmdb_id}?api_key=${apiKey}&language=en-US`)
            ]);

            if (resVi.ok && resEn.ok) {
                const data = await resVi.json();
                const dataEn = await resEn.json();
                return {
                    _id: ex.id,
                    name: data.title || data.name,
                    slug: ex.slug,
                    origin_name: dataEn.title || dataEn.name || data.original_title || data.original_name,
                    poster_url: `https://image.tmdb.org/t/p/w500${dataEn.poster_path || data.poster_path}`,
                    thumb_url: `https://image.tmdb.org/t/p/w780${dataEn.backdrop_path || data.backdrop_path || dataEn.poster_path || data.poster_path}`,
                    year: data.release_date ? parseInt(data.release_date.split('-')[0]) : data.first_air_date ? parseInt(data.first_air_date.split('-')[0]) : new Date().getFullYear(),
                    time: data.runtime ? `${data.runtime} phút` : "Đang cập nhật",
                    episode_current: ex.type === "single" ? "Full" : `Tập ${ex.exclusive_episodes?.length || 0}`,
                    quality: "HD",
                    lang: ex.lang_tag || "Vietsub Độc Quyền",
                    type: ex.type,
                    is_exclusive: true
                };
            }
            return null;
        });

        const results = await Promise.all(promises);
        return results.filter(Boolean);
    } catch (error) {
        return [];
    }
}

export default async function DocQuyenPage() {
    const movies = await getExclusiveMovies();

    return (
        <Suspense fallback={<CatalogSkeleton hideSidebar={true} />}>
            <DocQuyenClient initialMovies={movies} />
        </Suspense>
    );
}
