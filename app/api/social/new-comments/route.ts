import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { fetchWithRedis } from '@/app/lib/fetch-with-redis';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration");
        }

        // Initialize admin client to bypass RLS safely on the server side
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch 20 most recent comments
        const { data: rawComments, error } = await supabase
            .from("comments")
            .select("id, user_name, user_avatar, content, movie_slug, created_at")
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            throw error;
        }

        if (!rawComments || rawComments.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Deduplicate comments with identical content (case-insensitive, trimmed) to keep only the newest one
        const seenContents = new Set();
        const uniqueRawComments = [];
        for (const comment of rawComments) {
            if (!comment) continue;
            const normContent = (comment.content || "").trim().toLowerCase();
            if (!seenContents.has(normContent)) {
                seenContents.add(normContent);
                uniqueRawComments.push(comment);
            }
        }

        // Take only top 10 newest unique comments
        const top10RawComments = uniqueRawComments.slice(0, 10);

        // 3. Extract unique movie slugs from top 10 only (extract base slug if it's episode-specific)
        const uniqueSlugs = Array.from(new Set(top10RawComments.map(c => {
            const slug = c.movie_slug;
            if (!slug) return null;
            return slug.includes('/') ? slug.split('/')[0] : slug;
        }).filter(Boolean) as string[]));

        // 4. Fetch movie details in parallel
        const movieNamesMap: Record<string, string> = {};

        await Promise.all(
            uniqueSlugs.map(async (slug) => {
                try {
                    const data = await fetchWithRedis(`https://phimapi.com/phim/${slug}`, { revalidate: 60 });
                    const movieData = data?.movie;
                    if (movieData) {
                        movieNamesMap[slug] = movieData.name || "Phim";
                    }
                } catch (fetchErr) {
                    console.error(`Error fetching movie details for new comment slug ${slug}:`, fetchErr);
                }
            })
        );

        // 5. Map comments and return
        const top10Comments = top10RawComments
            .map((comment) => {
                const slug = comment.movie_slug;
                if (!slug) return null;

                const baseMovieSlug = slug.includes('/') ? slug.split('/')[0] : slug;
                const movieName = movieNamesMap[baseMovieSlug];
                if (!movieName) return null; // Filter out invalid movies

                let userAvatar = comment.user_avatar;
                if (userAvatar && userAvatar.startsWith("http") && !userAvatar.includes("wsrv.nl")) {
                    userAvatar = `https://wsrv.nl/?url=${encodeURIComponent(userAvatar)}&w=50&q=75&output=webp`;
                }

                return {
                    id: comment.id,
                    user: comment.user_name || "Thành viên",
                    avatar: userAvatar,
                    content: comment.content || "",
                    movie: movieName,
                    slug: baseMovieSlug
                };
            })
            .filter((c) => c !== null);

        return NextResponse.json(top10Comments, {
            headers: {
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=180, max-age=0'
            }
        });
    } catch (err: any) {
        console.error("New Comments API error (using local fallback data due to connection issue):", err);
        try {
            const { NEW_COMMENTS } = require('@/app/data/social-stats');
            const fallbackComments = NEW_COMMENTS.map((c: any) => {
                const slug = c.movie.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d")
                    .replace(/Đ/g, "d")
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-");

                return {
                    id: `fallback-${c.id}`,
                    user: c.user || "Thành viên",
                    avatar: c.avatar,
                    content: c.content || "",
                    movie: c.movie,
                    slug: slug
                };
            });
            return NextResponse.json(fallbackComments, {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60, max-age=0'
                }
            });
        } catch (fallbackErr) {
            return NextResponse.json({ error: 'Server error and fallback failed' }, { status: 500 });
        }
    }
}
