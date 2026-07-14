import { Metadata } from "next";
import { notFound } from "next/navigation";
import MovieDetailClient from "./MovieDetailClient";
import { MovieDetailResponse, Movie } from "@/app/types/movie";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";
export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

// API base URL
const API_BASE = "https://phimapi.com";

import { getMovieDetail } from "@/app/utils/movieFetcher";



// Dynamic metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const detail = await getMovieDetail(slug);

    if (!detail) {
        return { title: "Phim không tìm thấy - LoFilm" };
    }

    const movie = detail.movie;
    const description = movie.content
        ? movie.content.replace(/<[^>]*>/g, '').substring(0, 160)
        : `Xem phim ${movie.name} (${movie.origin_name}) vietsub chất lượng cao tại LoFilm`;

    // Tạo danh sách keywords động
    const dynamicKeywords = [
        movie.name,
        movie.origin_name,
        `xem phim ${movie.name}`,
        `${movie.name} vietsub`,
        `${movie.name} thuyet minh`,
        `${movie.name} full hd`,
        `${movie.name} lofilm`,
        ...(movie.category?.map(c => c.name) || []),
        ...(movie.category?.map(c => `phim ${c.name}`) || []),
        ...(movie.actor?.slice(0, 5) || []),
        ...(movie.director || []),
        "LoFilm", "xem phim online", "phim moi"
    ].filter(Boolean);

    return {
        title: `${movie.name} (${movie.origin_name}) - LoFilm`,
        description,
        keywords: dynamicKeywords,
        openGraph: {
            title: `${movie.name} - LoFilm`,
            description,
            images: [movie.poster_url],
        },
        alternates: {
            canonical: `https://www.munos.store/phim/${slug}`,
        },
    };
}

export default async function MoviePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const isPreview = false; // Luôn false ở SSR tĩnh. Preview sẽ xử lý sau ở Client nếu cần.

    // Fetch movie detail - Chạy cực nhanh nhờ cơ chế Cache-First Redis mới (<50ms)
    const detail = await getMovieDetail(slug, isPreview);

    if (!detail) {
        notFound();
    }


    // Schema dữ liệu cấu trúc (JSON-LD) cho SEO - Nâng cấp với đầy đủ thông tin
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": detail.movie.name,
        "alternateName": detail.movie.origin_name,
        "description": (detail.movie.content || "").replace(/<[^>]*>/g, ''),
        "image": detail.movie.poster_url,
        "datePublished": detail.movie.year,
        "director": (detail.movie.director || []).map(name => ({
            "@type": "Person",
            "name": name
        })),
        "actor": (detail.movie.actor || []).slice(0, 10).map(name => ({
            "@type": "Person",
            "name": name
        })),
        "genre": detail.movie.category?.map(c => c.name),
        "duration": detail.movie.time,
        "aggregateRating": detail.movie.tmdb?.vote_average ? {
            "@type": "AggregateRating",
            "ratingValue": detail.movie.tmdb.vote_average,
            "bestRating": "10",
            "worstRating": "1",
            "ratingCount": detail.movie.tmdb.vote_count || "100"
        } : undefined,
        "url": `https://www.munos.store/phim/${slug}`
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <MovieDetailClient
                movie={detail.movie}
                episodes={detail.episodes}
                suggestedMovies={[]}
                slug={slug}
            />
        </>
    );
}
