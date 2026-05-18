import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { getImageUrl } from '@/app/utils/movieUtils';
import { fetchWithRedis } from '@/app/lib/fetch-with-redis';

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

        // 1. Fetch 100 parent comments to evaluate their popularity
        const { data: rawComments, error } = await supabase
            .from("comments")
            .select(`
                id,
                user_name,
                user_avatar,
                content,
                movie_slug,
                created_at,
                reactions:comment_reactions(type)
            `)
            .is("parent_id", null)
            .order("created_at", { ascending: false })
            .limit(100);

        if (error) {
            throw error;
        }

        if (!rawComments || rawComments.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Extract unique movie slugs (extract base slug if it's episode-specific)
        const uniqueSlugs = Array.from(new Set(rawComments.map(c => {
            const slug = c.movie_slug;
            if (!slug) return null;
            return slug.includes('/') ? slug.split('/')[0] : slug;
        }).filter(Boolean) as string[]));

        // 3. Fetch movie details in parallel
        const movieMetaMap: Record<string, { title: string; poster: string; backdrop: string; isValid: boolean }> = {};

        await Promise.all(
            uniqueSlugs.map(async (slug) => {
                try {
                    const data = await fetchWithRedis(`https://phimapi.com/phim/${slug}`, { revalidate: 43200 });
                    const movieData = data?.movie;
                    if (movieData) {
                        const rawPoster = getImageUrl(movieData.poster_url);
                        const rawBackdrop = getImageUrl(movieData.thumb_url);

                        movieMetaMap[slug] = {
                            title: movieData.name || "Phim",
                            poster: rawPoster && !rawPoster.includes("data:") 
                                ? `https://wsrv.nl/?url=${encodeURIComponent(rawPoster)}&w=120&q=75&output=webp` 
                                : rawPoster,
                            backdrop: rawBackdrop && !rawBackdrop.includes("data:") 
                                ? `https://wsrv.nl/?url=${encodeURIComponent(rawBackdrop)}&w=600&q=65&output=webp` 
                                : rawBackdrop,
                            isValid: true
                        };
                    } else {
                        movieMetaMap[slug] = { title: "", poster: "", backdrop: "", isValid: false };
                    }
                } catch (fetchErr) {
                    console.error(`Error fetching movie details for comment slug ${slug}:`, fetchErr);
                    movieMetaMap[slug] = { title: "", poster: "", backdrop: "", isValid: false };
                }
            })
        );

        // 4. Map, sort by upvotes DESC, and slice top 20
        const mappedComments = rawComments
            .map((comment) => {
                const slug = comment.movie_slug;
                if (!slug) return null;

                const baseMovieSlug = slug.includes('/') ? slug.split('/')[0] : slug;
                const meta = movieMetaMap[baseMovieSlug];
                if (!meta || !meta.isValid) return null;

                const upvotes = comment.reactions?.filter((r: any) => r.type === "up").length || 0;
                const downvotes = comment.reactions?.filter((r: any) => r.type === "down").length || 0;

                let userAvatar = comment.user_avatar;
                if (userAvatar && userAvatar.startsWith("http") && !userAvatar.includes("wsrv.nl")) {
                    userAvatar = `https://wsrv.nl/?url=${encodeURIComponent(userAvatar)}&w=50&q=75&output=webp`;
                }

                return {
                    id: comment.id,
                    user: {
                        name: comment.user_name || "Thành viên",
                        avatar: userAvatar
                    },
                    movie: {
                        slug: baseMovieSlug,
                        title: meta.title,
                        poster: meta.poster,
                        backdrop: meta.backdrop
                    },
                    content: comment.content || "",
                    upvotes,
                    downvotes,
                    replies: 0,
                    createdAt: new Date(comment.created_at).getTime()
                };
            })
            .filter((c) => c !== null);

        // Sort by upvotes DESC, then by createdAt DESC (newest first)
        mappedComments.sort((a: any, b: any) => {
            if (b.upvotes !== a.upvotes) {
                return b.upvotes - a.upvotes;
            }
            return b.createdAt - a.createdAt;
        });

        const top20Comments = mappedComments.slice(0, 20);

        return NextResponse.json(top20Comments, {
            headers: {
                'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=600, max-age=0'
            }
        });
    } catch (err: any) {
        console.error("Top Comments API error (using local fallback data due to connection issue):", err);
        try {
            const { TOP_COMMENTS } = require('@/app/data/social-stats');
            const fallbackComments = TOP_COMMENTS.map((c: any) => {
                const slug = c.movie.title.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d")
                    .replace(/Đ/g, "d")
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-");

                return {
                    id: `fallback-${c.id}`,
                    user: {
                        name: c.user.name || "Thành viên",
                        avatar: c.user.avatar
                    },
                    movie: {
                        slug: slug,
                        title: c.movie.title,
                        poster: c.movie.poster,
                        backdrop: c.movie.backdrop
                    },
                    content: c.content || "",
                    upvotes: c.upvotes || 0,
                    downvotes: c.downvotes || 0,
                    replies: c.replies || 0,
                    createdAt: Date.now()
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
