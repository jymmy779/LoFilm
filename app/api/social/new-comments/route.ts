import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export const revalidate = 900; // Cache this route for 15 minutes

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

        // 2. Extract unique movie slugs
        const uniqueSlugs = Array.from(new Set(rawComments.map(c => c.movie_slug).filter(Boolean) as string[]));

        // 3. Fetch movie details in parallel
        const movieNamesMap: Record<string, string> = {};

        await Promise.all(
            uniqueSlugs.map(async (slug) => {
                try {
                    const res = await axios.get(`https://phimapi.com/phim/${slug}`, { timeout: 5000 });
                    const movieData = res.data?.movie;
                    if (movieData) {
                        movieNamesMap[slug] = movieData.name || "Phim";
                    }
                } catch (fetchErr) {
                    console.error(`Error fetching movie details for new comment slug ${slug}:`, fetchErr);
                }
            })
        );

        // 4. Map comments and return
        const mappedComments = rawComments
            .map((comment) => {
                const slug = comment.movie_slug;
                if (!slug) return null;

                const movieName = movieNamesMap[slug];
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
                    slug: slug
                };
            })
            .filter((c) => c !== null);

        // Take only top 10 newest comments
        const top10Comments = mappedComments.slice(0, 10);

        return NextResponse.json(top10Comments, {
            headers: {
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=180, max-age=0'
            }
        });
    } catch (err: any) {
        console.error("New Comments API error:", err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
