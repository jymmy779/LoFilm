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
            try {
                const tmdbType = ex.type === "single" ? "movie" : "tv";
                const fetchOptions = { signal: AbortSignal.timeout(5000) };
                const [resVi, resEn] = await Promise.all([
                    fetch(`https://api.themoviedb.org/3/${tmdbType}/${ex.tmdb_id}?api_key=${apiKey}&language=vi-VN`, fetchOptions),
                    fetch(`https://api.themoviedb.org/3/${tmdbType}/${ex.tmdb_id}?api_key=${apiKey}&language=en-US`, fetchOptions)
                ]);

                const publishedCount = (ex.exclusive_episodes || []).filter((ep: any) => ep.status === 'published' || !ep.status).length;
                
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
                        episode_current: ex.type === "single" ? "Full" : `Tập ${publishedCount}`,
                        quality: "HD",
                        lang: ex.lang_tag || "Vietsub Độc Quyền",
                        type: ex.type,
                        is_exclusive: true
                    };
                }
                return null;
            } catch (err) {
                console.error(`TMDB Fetch Error for slug ${ex.slug}:`, err);
                return {
                    _id: ex.id,
                    name: `Phim ${ex.slug}`,
                    slug: ex.slug,
                    origin_name: `LoFilm Exclusive`,
                    poster_url: `/poster-placeholder.jpg`,
                    thumb_url: `/poster-placeholder.jpg`,
                    year: new Date().getFullYear(),
                    time: "Đang cập nhật",
                    episode_current: ex.type === "single" ? "Full" : `Tập ${publishedCount}`,
                    quality: "HD",
                    lang: ex.lang_tag || "Vietsub Độc Quyền",
                    type: ex.type,
                    is_exclusive: true
                };
            }
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
