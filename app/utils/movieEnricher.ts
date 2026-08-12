import { createClient } from "@supabase/supabase-js";

export async function enrichApiDataWithDatabase(data: any): Promise<any> {
    if (!data) return data;
    try {
        let slugs: string[] = [];
        let isList = false;
        let isSingle = false;

        const qualityRanks: Record<string, number> = {
            "CAM": 1, "SD": 2, "HD": 3, "FHD": 4, "2K": 5, "4K": 6
        };
        const getRank = (q: string) => qualityRanks[q?.toUpperCase()] || 0;

        const getBestQuality = (q1: string, q2: string) => {
            if (!q1) return q2;
            if (!q2) return q1;
            return getRank(q1) > getRank(q2) ? q1 : q2;
        };

        const getBestEpisode = (dbEp: string, apiEp: string) => {
            if (!dbEp) return apiEp;
            if (!apiEp) return dbEp;
            
            const dbLower = dbEp.toLowerCase();
            const apiLower = apiEp.toLowerCase();
            
            if (dbLower.includes("hoàn tất") || dbLower.includes("full")) return dbEp;
            if (apiLower.includes("hoàn tất") || apiLower.includes("full")) return apiEp;
            
            // Try extracting episode number to compare (e.g. "Tập 8" vs "Tập 6")
            const dbMatch = dbEp.match(/\d+/);
            const apiMatch = apiEp.match(/\d+/);
            
            if (dbMatch && apiMatch) {
                const dbNum = parseInt(dbMatch[0], 10);
                const apiNum = parseInt(apiMatch[0], 10);
                return apiNum > dbNum ? apiEp : dbEp;
            }
            return dbEp;
        };

        // Identify data structure
        if (data?.data?.items && Array.isArray(data.data.items)) {
            slugs = data.data.items.map((m: any) => m.slug).filter(Boolean);
            isList = true;
        } else if (data?.movie?.slug) {
            slugs = [data.movie.slug];
            isSingle = true;
        }

        if (slugs.length === 0) return data;

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Batch query - chunks of 100 to avoid URL length issues
        let dbMovies: any[] = [];
        for (let i = 0; i < slugs.length; i += 100) {
            const chunk = slugs.slice(i, i + 100);
            const { data: dbData } = await supabase
                .from('exclusive_movies')
                .select('slug, lang_tag, quality, episode_current, episode_total')
                .in('slug', chunk);
            if (dbData) {
                dbMovies = dbMovies.concat(dbData);
            }
        }

        if (dbMovies.length > 0) {
            const dbMap = new Map(dbMovies.map((d: any) => [d.slug, d]));
            
            // Deep clone data to avoid mutating cache by reference if not intended
            const enrichedData = JSON.parse(JSON.stringify(data));

            if (isList) {
                enrichedData.data.items = enrichedData.data.items.map((m: any) => {
                    const dbMatch = dbMap.get(m.slug);
                    if (dbMatch) {
                        return { 
                            ...m, 
                            lang_tag: dbMatch.lang_tag || m.lang_tag || m.lang, 
                            quality: getBestQuality(dbMatch.quality, m.quality),
                            episode_current: getBestEpisode(dbMatch.episode_current, m.episode_current),
                            episode_total: dbMatch.episode_total || m.episode_total
                        };
                    }
                    return m;
                });
            } else if (isSingle) {
                const dbMatch = dbMap.get(enrichedData.movie.slug);
                if (dbMatch) {
                    enrichedData.movie.lang_tag = dbMatch.lang_tag || enrichedData.movie.lang_tag || enrichedData.movie.lang;
                    enrichedData.movie.quality = getBestQuality(dbMatch.quality, enrichedData.movie.quality);
                    enrichedData.movie.episode_current = getBestEpisode(dbMatch.episode_current, enrichedData.movie.episode_current);
                    enrichedData.movie.episode_total = dbMatch.episode_total || enrichedData.movie.episode_total;
                }
            }
            return enrichedData;
        }
    } catch (e) {
        console.error("[Enrichment Error]:", e);
    }
    return data;
}
