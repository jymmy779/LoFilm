import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getImageUrl } from '@/app/utils/movieUtils';
import { fetchWithRedis } from '@/app/lib/fetch-with-redis';
import { OWNER_USER_ID } from '@/app/utils/owner-utils';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Combined Social API - Replaces 4 separate endpoints with 1 request
// Endpoints merged: /api/social/top-comments, trending, favorites, new-comments
// ---------------------------------------------------------------------------

let supabaseClient: any = null;

async function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase configuration');
    
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    return supabaseClient;
}

const FALLBACK_SLUGS = [
    'mai', 'dat-rung-phuong-nam', 'nha-ba-nu', 'bo-gia', 'tay-du-ky',
    'one-piece', 'naruto', 'doraemon', 'conan', 'dau-pha-thuong-khung',
];

function extractBaseSlug(slug: string): string {
    return slug.includes('/') ? slug.split('/')[0] : slug;
}

function normalizeAvatar(avatar: string | null): string | null {
    if (avatar && avatar.startsWith('http') && !avatar.includes('wsrv.nl')) {
        return `https://wsrv.nl/?url=${encodeURIComponent(avatar)}&w=50&q=75&output=webp`;
    }
    return avatar;
}

export async function GET() {
    try {
        const supabase = await getSupabaseClient();

        // Run all Supabase queries in parallel - single round-trip
        const [commentsResult, favoritesResult] = await Promise.all([
            supabase
                .from('comments')
                .select(`
                    id, user_name, user_avatar, user_id, content, movie_slug, created_at,
                    reactions:comment_reactions(type)
                `)
                .is('parent_id', null)
                .order('created_at', { ascending: false })
                .limit(100),
            supabase
                .from('favorites')
                .select('movie_slug, movie_name, movie_poster'),
        ]);

        const rawComments: any[] = commentsResult.data || [];
        const favoritesData: any[] = favoritesResult.data || [];

        // --- Process Top Comments ---
        const mappedComments = rawComments.map((c: any) => ({
            ...c,
            upvotes: c.reactions?.filter((r: any) => r.type === 'up').length || 0,
            downvotes: c.reactions?.filter((r: any) => r.type === 'down').length || 0,
            createdAt: new Date(c.created_at).getTime(),
        }));
        mappedComments.sort((a: any, b: any) => b.upvotes !== a.upvotes ? b.upvotes - a.upvotes : b.createdAt - a.createdAt);

        const seenTopContents = new Set<string>();
        const uniqueTopComments = mappedComments.filter((c: any) => {
            const norm = (c.content || '').trim().toLowerCase();
            if (seenTopContents.has(norm)) return false;
            seenTopContents.add(norm);
            return true;
        }).slice(0, 20);

        // --- Process New Comments ---
        const seenNewContents = new Set<string>();
        const uniqueNewComments = rawComments.filter((c: any) => {
            const norm = (c.content || '').trim().toLowerCase();
            if (seenNewContents.has(norm)) return false;
            seenNewContents.add(norm);
            return true;
        }).slice(0, 10);

        // --- Process Trending (by comment count) ---
        const commentCounts: Record<string, number> = {};
        rawComments.forEach((c: any) => {
            if (c.movie_slug) {
                const base = extractBaseSlug(c.movie_slug);
                commentCounts[base] = (commentCounts[base] || 0) + 1;
            }
        });
        let trendingSlugs = Object.entries(commentCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([slug]) => slug);
        for (const fb of FALLBACK_SLUGS) {
            if (!trendingSlugs.includes(fb)) trendingSlugs.push(fb);
        }
        trendingSlugs = trendingSlugs.slice(0, 15);

        // --- Process Favorites ---
        const favCounts: Record<string, { count: number; name: string; poster: string }> = {};
        favoritesData.forEach((fav: any) => {
            if (fav.movie_slug) {
                if (!favCounts[fav.movie_slug]) {
                    favCounts[fav.movie_slug] = { count: 0, name: fav.movie_name || 'Phim', poster: fav.movie_poster || '' };
                }
                favCounts[fav.movie_slug].count++;
            }
        });
        const top10FavSlugs = Object.entries(favCounts)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([slug]) => slug);

        // --- Collect all unique slugs that need movie metadata ---
        const allSlugs = Array.from(new Set([
            ...uniqueTopComments.map((c: any) => c.movie_slug ? extractBaseSlug(c.movie_slug) : null).filter(Boolean) as string[],
            ...uniqueNewComments.map((c: any) => c.movie_slug ? extractBaseSlug(c.movie_slug) : null).filter(Boolean) as string[],
            ...trendingSlugs,
            ...top10FavSlugs,
        ]));

        // --- Fetch movie metadata in ONE batch from Supabase, then fill gaps with Redis ---
        const { data: moviesInDb } = await supabase
            .from('movies')
            .select('slug, name, poster_url, thumb_url')
            .in('slug', allSlugs);

        const dbMap = new Map(moviesInDb?.map((m: any) => [m.slug, m]) || []);

        const movieMetaMap: Record<string, { title: string; poster: string; backdrop: string }> = {};
        
        // Chunking (giới hạn concurrent requests để tránh OOM / 502 Bad Gateway)
        const CHUNK_SIZE = 5;
        for (let i = 0; i < allSlugs.length; i += CHUNK_SIZE) {
            const chunk = allSlugs.slice(i, i + CHUNK_SIZE);
            await Promise.all(
                chunk.map(async (slug) => {
                    const dbMovie: any = dbMap.get(slug);
                    if (dbMovie) {
                        movieMetaMap[slug] = {
                            title: dbMovie.name || 'Phim',
                            poster: getImageUrl(dbMovie.poster_url),
                            backdrop: getImageUrl(dbMovie.thumb_url),
                        };
                        return;
                    }
                    try {
                        const INTERNAL_API_URL = process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:5000/api';
                        const data = await fetchWithRedis(`${INTERNAL_API_URL}/phim/${slug}`, { revalidate: 3600 });
                        if (data?.movie) {
                            movieMetaMap[slug] = {
                                title: data.movie.name || 'Phim',
                                poster: getImageUrl(data.movie.poster_url),
                                backdrop: getImageUrl(data.movie.thumb_url),
                            };
                        }
                    } catch {
                        // Skip slugs that fail to fetch
                    }
                })
            );
        }

        // --- Build response objects ---
        const topComments = uniqueTopComments
            .map((c: any) => {
                if (!c.movie_slug) return null;
                const slug = extractBaseSlug(c.movie_slug);
                const meta = movieMetaMap[slug];
                if (!meta) return null;
                return {
                    id: c.id,
                    user: { name: c.user_name, avatar: normalizeAvatar(c.user_avatar), isOwner: c.user_id === OWNER_USER_ID },
                    movie: { slug, title: meta.title, poster: meta.poster, backdrop: meta.backdrop },
                    content: c.content || '',
                    upvotes: c.upvotes,
                    downvotes: c.downvotes,
                    replies: 0,
                };
            })
            .filter(Boolean);

        const newComments = uniqueNewComments
            .map((c: any) => {
                if (!c.movie_slug) return null;
                const slug = extractBaseSlug(c.movie_slug);
                const meta = movieMetaMap[slug];
                if (!meta) return null;
                return {
                    id: c.id,
                    user: c.user_name,
                    avatar: normalizeAvatar(c.user_avatar),
                    content: c.content || '',
                    movie: meta.title,
                    slug,
                    isOwner: c.user_id === OWNER_USER_ID,
                };
            })
            .filter(Boolean);

        const trending = trendingSlugs
            .map((slug) => {
                const meta = movieMetaMap[slug];
                if (!meta) return null;
                return { slug, title: meta.title, poster: meta.poster };
            })
            .filter(Boolean)
            .slice(0, 10);

        const favorites = top10FavSlugs
            .map((slug) => {
                const meta = movieMetaMap[slug];
                const favItem = favCounts[slug];
                if (!meta || !favItem) return null;
                return { slug, title: meta.title || favItem.name, avatar: meta.poster || getImageUrl(favItem.poster) };
            })
            .filter(Boolean);

        return NextResponse.json(
            { topComments, newComments, trending, favorites },
            {
                headers: {
                    // Short TTL for realtime feel, SWR for next requestor
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300, max-age=0',
                }
            }
        );
    } catch (err: any) {
        console.error('[/api/social/combined] error, serving fallback:', err.message);
        try {
            const { TOP_COMMENTS, TRENDING_MOVIES, WEEKLY_FAVORITES, NEW_COMMENTS } = require('@/app/data/social-stats');
            return NextResponse.json(
                {
                    topComments: TOP_COMMENTS,
                    newComments: NEW_COMMENTS,
                    trending: TRENDING_MOVIES,
                    favorites: WEEKLY_FAVORITES,
                },
                { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60, max-age=0' } }
            );
        } catch {
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    }
}
