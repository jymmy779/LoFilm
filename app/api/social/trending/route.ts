import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { getImageUrl } from '@/app/utils/movieUtils';

export const revalidate = 43200; // Cache this route for 12 hours

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

        // 2. Count comments per movie_slug
        const counts: Record<string, number> = {};
        if (comments) {
            comments.forEach((c) => {
                if (c.movie_slug) {
                    counts[c.movie_slug] = (counts[c.movie_slug] || 0) + 1;
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

        // 4. Fetch movie details in parallel
        const fetchedMovies = await Promise.all(
            candidateSlugs.map(async (slug) => {
                try {
                    const res = await axios.get(`https://phimapi.com/phim/${slug}`, { timeout: 5000 });
                    if (res.data && res.data.movie) {
                        const movieData = res.data.movie;
                        const rawPoster = getImageUrl(movieData.poster_url);
                        const wsrvPoster = rawPoster && !rawPoster.includes("data:") 
                            ? `https://wsrv.nl/?url=${encodeURIComponent(rawPoster)}&w=80&q=70&output=webp` 
                            : rawPoster;

                        return {
                            slug,
                            title: movieData.name || "Phim",
                            poster: wsrvPoster
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
        console.error("Trending API error:", err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
