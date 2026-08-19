import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { getImageUrl } from '@/app/utils/movieUtils';
import { fetchWithRedis } from '@/app/lib/fetch-with-redis';

export const dynamic = 'force-dynamic';

const FALLBACK_SLUGS = [
    "mai",
    "dat-rung-phuong-nam",
    "nha-ba-nu",
    "bo-gia",
    "tay-du-ky",
    "one-piece",
    "naruto",
    "doraemon",
    "conan",
    "dau-pha-thuong-khung",
    "the-gioi-hoan-my",
    "linh-vu-thien-ha",
    "pham-nhan-tu-tien"
];

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration");
        }

        // Initialize admin client to bypass RLS safely on the server side
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch all parent comments to aggregate by movie_slug
        const { data: comments, error } = await supabase
            .from("comments")
            .select("movie_slug")
            .is("parent_id", null);

        if (error) {
            console.error("Error fetching comments for trending:", error);
        }

        // 2. Count comments per movie_slug (extracting base slug if it's episode-specific)
        const counts: Record<string, number> = {};
        if (comments) {
            comments.forEach((c) => {
                if (c.movie_slug) {
                    const baseSlug = c.movie_slug.includes('/') ? c.movie_slug.split('/')[0] : c.movie_slug;
                    counts[baseSlug] = (counts[baseSlug] || 0) + 1;
                }
            });
        }

        // 3. Sort slugs by comment count descending
        let candidateSlugs = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map((entry) => entry[0]);

        // Append fallback slugs to ensure we always have candidates
        for (const fb of FALLBACK_SLUGS) {
            if (!candidateSlugs.includes(fb)) {
                candidateSlugs.push(fb);
            }
        }

        // Limit to top 15 candidates before fetching details to avoid rate limits and timeouts
        candidateSlugs = candidateSlugs.slice(0, 15);

        // 4. Fetch movie details in parallel, prioritize local Supabase DB to get R2 URLs
        const { data: moviesInDb } = await supabase
            .from('movies')
            .select('slug, name, poster_url, thumb_url')
            .in('slug', candidateSlugs);
            
        const dbMoviesMap = new Map(moviesInDb?.map(m => [m.slug, m]) || []);
        
        const fetchedMovies = await Promise.all(
            candidateSlugs.map(async (slug) => {
                try {
                    const dbMovie = dbMoviesMap.get(slug);
                    if (dbMovie) {
                        return {
                            slug,
                            title: dbMovie.name || "Phim",
                            poster: getImageUrl(dbMovie.poster_url)
                        };
                    }

                    const INTERNAL_API_URL = process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:5000/api';
                    const data = await fetchWithRedis(`${INTERNAL_API_URL}/phim/${slug}`, { revalidate: 60 });
                    const movieData = data?.movie;
                    if (movieData) {
                        const rawPoster = getImageUrl(movieData.poster_url);

                        return {
                            slug,
                            title: movieData.name || "Phim",
                            poster: rawPoster
                        };
                    }
                } catch (fetchErr) {
                    console.error(`Error fetching trending movie details for ${slug}:`, fetchErr);
                }
                return null;
            })
        );

        // Filter out nulls (failed fetches/invalid slugs) and take the top 10
        const top10 = fetchedMovies
            .filter((m): m is { slug: string; title: string; poster: string } => m !== null)
            .slice(0, 10);

        return NextResponse.json(top10, {
            headers: {
                'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=600, max-age=0'
            }
        });
    } catch (err: any) {
        console.error("Trending API error (using local fallback data due to connection issue):", err);
        try {
            const { TRENDING_MOVIES } = require('@/app/data/social-stats');
            const fallbackTrending = TRENDING_MOVIES.map((m: any) => {
                const slug = m.title.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d")
                    .replace(/Đ/g, "d")
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-");

                return {
                    slug: slug,
                    title: m.title,
                    poster: m.poster
                };
            });
            return NextResponse.json(fallbackTrending, {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60, max-age=0'
                }
            });
        } catch (fallbackErr) {
            return NextResponse.json({ error: 'Server error and fallback failed' }, { status: 500 });
        }
    }
}
