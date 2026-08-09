"use server";
import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Parse textarea input "label|url" per line into SubtitleTrack array
function parseSubtitleInput(raw: string | null): { lang: string; label: string; url: string }[] {
    if (!raw || !raw.trim()) return [];
    const LANG_MAP: Record<string, string> = {
        'tiếng việt': 'vi', 'viet': 'vi', 'việt': 'vi', 'vietnamese': 'vi',
        'english': 'en', 'anh': 'en', 'tiếng anh': 'en',
        'hàn': 'ko', 'korean': 'ko', 'tiếng hàn': 'ko', 'hàn quốc': 'ko',
        'trung': 'zh', 'chinese': 'zh', 'tiếng trung': 'zh', 'zh': 'zh',
        'japanese': 'ja', 'nhật': 'ja', 'tiếng nhật': 'ja',
        'thai': 'th', 'thái': 'th', 'tiếng thái': 'th',
        'french': 'fr', 'pháp': 'fr',
        'spanish': 'es', 'tây ban nha': 'es',
    };
    return raw.split('\n')
        .map(line => line.trim())
        .filter(line => line.includes('|'))
        .map(line => {
            const pipeIdx = line.indexOf('|');
            const label = line.slice(0, pipeIdx).trim();
            const url = line.slice(pipeIdx + 1).trim();
            if (!label || !url) return null;
            const lang = LANG_MAP[label.toLowerCase()] || label.slice(0, 2).toLowerCase();
            return { lang, label, url };
        })
        .filter(Boolean) as { lang: string; label: string; url: string }[];
}

export async function updateCMSMovie(id: string, data: Record<string, string>) {
    const supabase = await createClient();
    const subDocquyen = data.sub_docquyen === 'true' || data.sub_docquyen === 'on' || (data.sub_docquyen as unknown) === true;
    
    // update is_exclusive property directly in exclusive_movies since we removed exclusive_movies table
    const { error } = await supabase
        .from("exclusive_movies")
        .update({
            slug: data.slug.toLowerCase().trim(),
            tmdb_id: data.tmdb_id?.trim() || null,
            type: data.type,
            status: data.status,
            lang_tag: data.lang_tag || "Vietsub",
            is_exclusive: subDocquyen
        })
        .eq("id", id);

    if (error) return { error: `Lỗi cập nhật phim: ${error.message}` };
    
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function addCMSEpisode(movieId: string, data: Record<string, string>) {
    const name = data.name;
    const slug = data.slug;
    const linkM3u8 = data.link_m3u8;
    const linkVtt = data.link_vtt;
    const linkEmbed = data.link_embed;
    const order = parseInt(data.order || "1");
    const subtitleTracks = data.subtitle_tracks;
    const status = data.status || "published";

    if (!name || !slug || (!linkM3u8 && !linkEmbed)) return { error: "Thiếu trường bắt buộc" };

    try {
        const supabase = await createClient();
        
        // Find or create 'Vietsub' server source for this manual episode
        let { data: source } = await supabase.from('cms_movie_sources').select('id').eq('movie_id', movieId).eq('server_name', 'Vietsub').single();
        if (!source) {
            const { data: newSource, error: errSource } = await supabase.from('cms_movie_sources').insert({ movie_id: movieId, server_name: 'Vietsub' }).select().single();
            if (errSource) return { error: "Lỗi tạo nguồn phim Vietsub" };
            source = newSource;
        }

        const { error } = await supabase
            .from("exclusive_episodes")
            .insert({
                movie_id: movieId,
                source_id: source!.id,
                name,
                slug: slug.toLowerCase().trim(),
                link_m3u8: linkM3u8 ? linkM3u8.trim() : "",
                link_embed: linkEmbed ? linkEmbed.trim() : "",
                order_num: order
            });
            
        if (error) return { error: error.message };
    } catch (e: any) {
        return { error: `Lỗi kết nối DB: ${e.message}` };
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function updateCMSEpisode(id: string, data: Record<string, string>) {
    const name = data.name;
    const slug = data.slug;
    const linkM3u8 = data.link_m3u8;
    const linkEmbed = data.link_embed;
    const order = parseInt(data.order || "1");
    const status = data.status || "published";

    if (!name || !slug || (!linkM3u8 && !linkEmbed)) return { error: "Thiếu trường bắt buộc" };

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from("exclusive_episodes")
            .update({
                name,
                slug: slug.toLowerCase().trim(),
                link_m3u8: linkM3u8 ? linkM3u8.trim() : "",
                link_embed: linkEmbed ? linkEmbed.trim() : "",
                order_num: order
            })
            .eq("id", id);
            
        if (error) return { error: error.message };
    } catch (e: any) {
        return { error: `Lỗi kết nối DB: ${e.message}` };
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function deleteCMSEpisode(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("exclusive_episodes").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function bulkAddCMSEpisodes(movieId: string, startEpisode: number, linksText: string, vttLinksText: string, embedLinksText: string = "", status: string = "published") {
    if (!linksText.trim() && !embedLinksText.trim()) return { error: "Danh sách link trống" };
    
    const rawM3u8 = linksText.split('\n').map(l => l.trim());
    const rawEmbed = embedLinksText ? embedLinksText.split('\n').map(l => l.trim()) : [];
    
    let validCount = 0;
    const maxLen = Math.max(rawM3u8.length, rawEmbed.length);
    for (let i = 0; i < maxLen; i++) {
        if ((rawM3u8[i] && rawM3u8[i].length > 0) || (rawEmbed[i] && rawEmbed[i].length > 0)) validCount++;
    }
    if (validCount === 0) return { error: "Không tìm thấy link hợp lệ" };

    const supabase = await createClient();
    
    let { data: source } = await supabase.from('cms_movie_sources').select('id').eq('movie_id', movieId).eq('server_name', 'Vietsub').single();
    if (!source) {
        const { data: newSource, error: errSource } = await supabase.from('cms_movie_sources').insert({ movie_id: movieId, server_name: 'Vietsub' }).select().single();
        if (errSource) return { error: "Lỗi tạo nguồn phim Vietsub" };
        source = newSource;
    }

    const episodesToInsert = [];
    let epOffset = 0;
    
    for (let i = 0; i < maxLen; i++) {
        if ((rawM3u8[i] && rawM3u8[i].length > 0) || (rawEmbed[i] && rawEmbed[i].length > 0)) {
            const epNum = startEpisode + epOffset;
            const epNumStr = String(epNum).padStart(2, '0');
            episodesToInsert.push({
                movie_id: movieId,
                source_id: source.id,
                name: `Tập ${epNumStr}`,
                slug: `tap-${epNumStr}`,
                link_m3u8: rawM3u8[i] || "",
                link_embed: rawEmbed[i] || "",
                order_num: epNum
            });
            epOffset++;
        }
    }

    try {
        const { error } = await supabase.from('exclusive_episodes').insert(episodesToInsert);
        if (error) return { error: `Lỗi thêm hàng loạt: ${error.message}` };
    } catch (e: any) {
        return { error: `Lỗi kết nối cơ sở dữ liệu: ${e.message}` };
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}
