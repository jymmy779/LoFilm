import { Metadata } from "next";
import { notFound } from "next/navigation";
import MovieDetailClient from "./MovieDetailClient";
import { MovieDetailResponse, Movie } from "@/app/types/movie";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";
export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

// API base URL
const API_BASE = "https://phimapi.com";

// Fetch movie detail by slug
async function getMovieDetail(slug: string): Promise<MovieDetailResponse | null> {
    const data = await fetchWithRedis(`${API_BASE}/phim/${slug}`);
    if (!data || !data.status || !data.movie) return null;
    return data;
}

// Fetch suggested movies by first category
async function getSuggestedMovies(movie: Movie): Promise<Movie[]> {
    try {
        const firstCategory = movie.category?.[0]?.slug;
        if (!firstCategory) return [];

        const data = await fetchWithRedis(`${API_BASE}/v1/api/the-loai/${firstCategory}?page=1&limit=20`);


        // Filter out current movie from suggestions
        const items: Movie[] = data.data?.items || [];
        return items.filter((m: Movie) => m.slug !== movie.slug).slice(0, 18);
    } catch {
        return [];
    }
}

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
    
    // Fetch movie detail - Chạy cực nhanh nhờ cơ chế Cache-First Redis mới (<50ms)
    const detail = await getMovieDetail(slug);

    if (!detail) {
        notFound();
    }

    // Suggested movies - Chạy song song sau khi có data category
    const suggestedMovies = await getSuggestedMovies(detail.movie);

    // Schema dữ liệu cấu trúc (JSON-LD) cho SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": detail.movie.name,
        "alternateName": detail.movie.origin_name,
        "description": (detail.movie.content || "").replace(/<[^>]*>/g, ''),
        "image": detail.movie.poster_url,
        "datePublished": detail.movie.year,
        "director": {
            "@type": "Person",
            "name": detail.movie.director?.[0] || "Đang cập nhật"
        },
        "genre": detail.movie.category?.map(c => c.name),
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
                suggestedMovies={suggestedMovies}
            />
        </>
    );
}
