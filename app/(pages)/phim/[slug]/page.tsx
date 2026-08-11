import { Metadata } from "next";
import { notFound } from "next/navigation";
import MovieDetailClient from "./MovieDetailClient";
import { MovieDetailResponse, Movie } from "@/app/types/movie";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";
export const dynamic = 'force-dynamic';

// API base URL
const API_BASE = "https://phimapi.com";

import { getMovieDetail } from "@/app/utils/movieFetcher";



import { getAbsoluteUrl } from "@/app/config/site";

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
        ...(movie.actor || []),
        ...(movie.director || []),
        "LoFilm", "xem phim online", "phim moi"
    ].filter(Boolean);

    return {
        title: `${movie.name} (${movie.origin_name}) - LoFilm`,
        description,
        keywords: dynamicKeywords,
        openGraph: {
            title: `${movie.name} (${movie.origin_name}) - Xem Phim Vietsub HD | LoFilm`,
            description,
            type: 'video.movie',
            siteName: 'LoFilm',
            locale: 'vi_VN',
            url: getAbsoluteUrl(`/phim/${slug}`),
            images: [{
                url: movie.thumb_url,
                width: 800,
                height: 1200,
                alt: `Xem phim ${movie.name} (${movie.origin_name}) vietsub HD - LoFilm`,
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${movie.name} - Xem Vietsub HD | LoFilm`,
            description,
            images: [movie.poster_url],
        },
        alternates: {
            canonical: getAbsoluteUrl(`/phim/${slug}`),
        },
    };
}

import { getServerActorsFromTMDB } from "@/app/utils/serverTmdbUtils";

export default async function MoviePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const isPreview = false; // Luôn false ở SSR tĩnh. Preview sẽ xử lý sau ở Client nếu cần.

    // Fetch movie detail - Chạy cực nhanh nhờ cơ chế Cache-First Redis mới (<50ms)
    let detail = await getMovieDetail(slug, isPreview);

    // Nếu bị lỗi mạng hoặc API chập chờn nhất thời, retry lại 1 lần sau 300ms trước khi đưa ra notFound
    if (!detail) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        detail = await getMovieDetail(slug, isPreview);
    }

    if (!detail) {
        notFound();
    }

    // SSR fetch actors to prevent skeleton flash
    let initialActors: any[] = [];
    if (detail.movie.tmdb?.id) {
        const tmdbType = detail.movie.tmdb.type === 'tv' ? 'tv' : 'movie';
        initialActors = await getServerActorsFromTMDB(detail.movie.tmdb.id.toString(), tmdbType);
    } else {
        try {
            // Dùng fetch của Nextjs với cache cực lâu
            const res = await fetch(`https://phimapi.com/v1/api/phim/${slug}/peoples`, { next: { revalidate: 2592000 } });
            const data = await res.json();
            if (data.success || data.status === "success") {
                const peoples = data.data?.peoples;
                if (peoples && Array.isArray(peoples)) {
                    initialActors = peoples.map((actor: any) => ({
                        id: actor.tmdb_people_id || Math.random(),
                        name: actor.name,
                        profile_path: actor.profile_path,
                        character: actor.character
                    }));
                }
            }
        } catch (error) {
            console.error("Error fetching peoples fallback:", error);
        }
    }


    // Schema dữ liệu cấu trúc (JSON-LD) cho SEO - Nâng cấp với đầy đủ thông tin & Breadcrumbs
    const isSeries = detail.movie.type !== 'single';
    const primaryCategory = detail.movie.category?.[0];

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": isSeries ? "TVSeries" : "Movie",
        "name": detail.movie.name,
        "alternateName": detail.movie.origin_name,
        "description": (detail.movie.content || "").replace(/<[^>]*>/g, ''),
        "image": [detail.movie.poster_url, detail.movie.thumb_url].filter(Boolean),
        "datePublished": detail.movie.year,
        "director": (detail.movie.director || []).filter(d => d && d !== "Đang cập nhật").map(name => ({
            "@type": "Person",
            "name": name
        })),
        "actor": (detail.movie.actor || []).filter(a => a && a !== "Đang cập nhật").map(name => ({
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
        "url": getAbsoluteUrl(`/phim/${slug}`)
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Trang Chủ",
                "item": getAbsoluteUrl("/")
            },
            ...(primaryCategory ? [{
                "@type": "ListItem",
                "position": 2,
                "name": primaryCategory.name,
                "item": getAbsoluteUrl(`/the-loai/${primaryCategory.slug}`)
            }] : []),
            {
                "@type": "ListItem",
                "position": primaryCategory ? 3 : 2,
                "name": detail.movie.name,
                "item": getAbsoluteUrl(`/phim/${slug}`)
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            <MovieDetailClient
                movie={detail.movie}
                episodes={detail.episodes}
                suggestedMovies={[]}
                slug={slug}
                initialActors={initialActors}
            />
        </>
    );
}
