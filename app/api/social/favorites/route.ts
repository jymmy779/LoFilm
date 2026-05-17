import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getImageUrl } from '@/app/utils/movieUtils';

export const revalidate = 43200; // Cache this route for 12 hours

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration");
        }

        // Initialize admin client to bypass RLS safely on the server side
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch all favorites
        const { data, error } = await supabase
            .from("favorites")
            .select("movie_slug, movie_name, movie_poster");

        if (error) {
            console.error("Error fetching favorites from DB:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Group and count favorites by movie_slug
        const counts: Record<string, { count: number; name: string; poster: string }> = {};
        data.forEach((fav) => {
            if (fav.movie_slug) {
                if (!counts[fav.movie_slug]) {
                    counts[fav.movie_slug] = {
                        count: 0,
                        name: fav.movie_name || "Phim",
                        poster: fav.movie_poster || ""
                    };
                }
                counts[fav.movie_slug].count++;
            }
        });

        // 3. Sort by favorites count DESC and take top 10
        const top10 = Object.entries(counts)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([slug, item]) => {
                const rawPoster = getImageUrl(item.poster);
                const wsrvPoster = rawPoster && !rawPoster.includes("data:") 
                    ? `https://wsrv.nl/?url=${encodeURIComponent(rawPoster)}&w=80&q=70&output=webp` 
                    : rawPoster;

                return {
                    slug,
                    title: item.name,
                    avatar: wsrvPoster
                };
            });

        return NextResponse.json(top10, {
            headers: {
                'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=600, max-age=0'
            }
        });
    } catch (err: any) {
        console.error("Favorites API error (using local fallback data due to connection issue):", err);
        try {
            const { WEEKLY_FAVORITES } = require('@/app/data/social-stats');
            const fallbackFavorites = WEEKLY_FAVORITES.map((m: any) => {
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
                    avatar: m.avatar
                };
            });
            return NextResponse.json(fallbackFavorites, {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60, max-age=0'
                }
            });
        } catch (fallbackErr) {
            return NextResponse.json({ error: 'Server error and fallback failed' }, { status: 500 });
        }
    }
}
