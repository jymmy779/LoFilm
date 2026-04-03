import { Metadata } from "next";
import { notFound } from "next/navigation";
import MovieDetailClient from "./MovieDetailClient";
import { MovieDetailResponse, Movie } from "@/app/types/movie";

// API base URL
const API_BASE = "https://phimapi.com";

// Fetch movie detail by slug
async function getMovieDetail(slug: string): Promise<MovieDetailResponse | null> {
    try {
        const res = await fetch(`${API_BASE}/phim/${slug}`, {
            next: { revalidate: 3600 }, // Cache 1 hour
        });
        if (!res.ok) return null;
        const data: MovieDetailResponse = await res.json();
        if (!data.status || !data.movie) return null;
        return data;
    } catch {
        return null;
    }
}

// Fetch suggested movies by first category
async function getSuggestedMovies(movie: Movie): Promise<Movie[]> {
    try {
        const firstCategory = movie.category?.[0]?.slug;
        if (!firstCategory) return [];

        const res = await fetch(`${API_BASE}/v1/api/the-loai/${firstCategory}?page=1&limit=12`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();

        // Filter out current movie from suggestions
        const items: Movie[] = data.data?.items || [];
        return items.filter((m: Movie) => m.slug !== movie.slug).slice(0, 12);
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

    return {
        title: `${movie.name} (${movie.origin_name}) - LoFilm`,
        description,
        openGraph: {
            title: `${movie.name} - LoFilm`,
            description,
            images: [movie.poster_url],
        },
    };
}

export default async function MoviePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const detail = await getMovieDetail(slug);

    if (!detail) {
        notFound();
    }

    const suggestedMovies = await getSuggestedMovies(detail.movie);

    return (
        <MovieDetailClient
            movie={detail.movie}
            episodes={detail.episodes}
            suggestedMovies={suggestedMovies}
        />
    );
}
