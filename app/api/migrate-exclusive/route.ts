import { NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        
        // Lấy tất cả phim độc quyền chưa có tên (hoặc rỗng)
        const { data: movies, error } = await supabase
            .from('exclusive_movies')
            .select('*')
            .or('name.eq.,name.is.null');
            
        if (error) throw error;
        
        let count = 0;
        const apiKey = "fb7bb23f03b6994dafc674c074d01761";
        
        for (const movie of movies) {
            let movieName = "";
            let originName = "";
            let thumbUrl = "";
            let posterUrl = "";
            let year = 2026;
            let tmdbId = movie.tmdb_id;
            
            // 1. Thử PhimAPI trước
            try {
                const check = await fetch(`https://phimapi.com/v1/api/phim/${movie.slug}`);
                const checkData = await check.json();
                if (checkData?.status && checkData.movie) {
                    movieName = checkData.movie.name || "";
                    originName = checkData.movie.origin_name || "";
                    thumbUrl = checkData.movie.thumb_url || "";
                    posterUrl = checkData.movie.poster_url || "";
                    year = checkData.movie.year || 2026;
                    
                    if (!tmdbId && checkData.movie.tmdb?.id) {
                        tmdbId = checkData.movie.tmdb.id;
                    }
                }
            } catch (e) {}
            
            // 2. Nếu PhimAPI không có (Phim Độc Quyền xịn), thử TMDB
            if (!movieName && tmdbId) {
                try {
                    const tmdbType = movie.type === "single" ? "movie" : "tv";
                    const [resVi, resEn] = await Promise.all([
                        fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?api_key=${apiKey}&language=vi-VN`),
                        fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?api_key=${apiKey}&language=en-US`)
                    ]);
                    
                    const dataVi = resVi.ok ? await resVi.json() : null;
                    const dataEn = resEn.ok ? await resEn.json() : null;
                    
                    if (dataVi || dataEn) {
                        const data = dataVi || dataEn;
                        const enData = dataEn || dataVi;
                        
                        movieName = data.title || data.name || "";
                        originName = enData.title || enData.name || data.original_title || data.original_name || "";
                        
                        const pPath = enData.poster_path || data.poster_path || "";
                        const bPath = enData.backdrop_path || data.backdrop_path || pPath;
                        posterUrl = pPath ? `https://image.tmdb.org/t/p/w500${pPath}` : "";
                        thumbUrl = bPath ? `https://image.tmdb.org/t/p/w780${bPath}` : "";
                        
                        const releaseDate = data.release_date || data.first_air_date || "";
                        if (releaseDate) {
                            year = parseInt(releaseDate.split('-')[0]);
                        }
                    }
                } catch (e) {}
            }
            
            // 3. Update lại vào DB
            if (movieName) {
                await supabase.from('exclusive_movies').update({
                    tmdb_id: tmdbId,
                    name: movieName,
                    origin_name: originName,
                    thumb_url: thumbUrl,
                    poster_url: posterUrl,
                    year: year
                }).eq('id', movie.id);
                count++;
            }
        }
        
        return NextResponse.json({ status: "success", message: `Đã cập nhật thành công ${count} phim cũ!` });
        
    } catch (err: any) {
        return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
    }
}
