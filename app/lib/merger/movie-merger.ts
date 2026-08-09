import { createClient } from "@supabase/supabase-js";
import { ExtractedMovie } from "../crawlers/base-crawler";

// Khởi tạo Supabase Client với Service Key để bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function mergeMovieIntoDB(movie: ExtractedMovie): Promise<string> {
  try {
    // 1. Kiểm tra xem phim đã tồn tại trong bảng exclusive_movies chưa (dựa theo slug hoặc tmdb_id)
    let query = supabase.from('exclusive_movies').select('id, slug, tmdb_id');
    
    if (movie.tmdb_id) {
      query = query.or(`slug.eq.${movie.slug},tmdb_id.eq.${movie.tmdb_id}`);
    } else {
      query = query.eq('slug', movie.slug);
    }

    const { data: existingMovies, error: searchError } = await query;

    if (searchError) {
      return `❌ Lỗi khi tìm phim ${movie.name}: ${searchError.message}`;
    }

    // Lấy bộ phim đầu tiên khớp (ưu tiên nhất)
    const existingMovie = existingMovies && existingMovies.length > 0 ? existingMovies[0] : null;

    let movieId = existingMovie?.id;
    let isNew = false;

    // 2. Nếu chưa có, tạo phim mới
    if (!movieId) {
      const { data: insertedMovie, error: insertError } = await supabase
        .from('exclusive_movies')
        .insert({
          name: movie.name,
          origin_name: movie.origin_name,
          slug: movie.slug,
          type: movie.type,
          status: movie.status,
          poster_url: movie.poster_url,
          thumb_url: movie.thumb_url,
          trailer_url: movie.trailer_url,
          time: movie.time,
          episode_current: movie.episode_current,
          episode_total: movie.episode_total,
          quality: movie.quality,
          lang: movie.lang,
          year: movie.year,
          director: movie.director,
          actor: movie.actor,
          category: movie.category,
          country: movie.country,
          content: movie.content,
          tmdb_id: movie.tmdb_id,
          imdb_id: movie.imdb_id,
        })
        .select('id')
        .single();

      if (insertError) {
        return `❌ Lỗi tạo mới phim ${movie.name}: ${insertError.message}`;
      }
      movieId = insertedMovie.id;
      isNew = true;
    } else {
      // (Tuỳ chọn) Update lại episode_current nếu phim đang ra
      await supabase
        .from('exclusive_movies')
        .update({ episode_current: movie.episode_current, status: movie.status })
        .eq('id', movieId);
    }

    // 3. Ghi nhận nguồn phim vào cms_movie_sources để tracking
    await supabase
      .from('cms_movie_sources')
      .upsert({
        movie_id: movieId,
        source_name: movie.source_name,
        source_movie_id: movie.source_movie_id,
        source_slug: movie.source_slug
      }, { onConflict: 'movie_id, source_name' });

    // 4. Lưu hoặc Gộp Episodes (Tạo Server riêng cho nguồn này)
    if (movie.episodes && movie.episodes.length > 0) {
      for (const server of movie.episodes) {
        // Upsert Server dựa trên movie_id + server_name (ví dụ: 'Vietsub #1 (ophim)')
        await supabase
          .from('exclusive_episodes')
          .upsert({
            movie_id: movieId,
            server_name: server.server_name,
            server_data: server.server_data,
            source_name: movie.source_name
          }, { onConflict: 'movie_id, server_name' });
      }
    }

    return isNew 
      ? `✅ [Thêm Mới] Phim "${movie.name}" (Slug: ${movie.slug}) từ nguồn [${movie.source_name}]`
      : `🔄 [Cập Nhật & Gộp Server] Phim "${movie.name}" từ nguồn [${movie.source_name}]`;

  } catch (error: any) {
    return `🔥 Exception khi xử lý ${movie.name}: ${error.message}`;
  }
}
