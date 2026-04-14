import axios from "axios";
import { Movie } from "@/app/types/movie";

interface EnrichOptions {
    items: Movie[];
    setItems: (updated: Movie[]) => void;
    isMounted: () => boolean;
    chunkSize?: number;
    delay?: number;
}

/**
 * Thống nhất logic "Làm giàu dữ liệu" cho phim bộ/series trên toàn hệ thống.
 * Lọc những phim cần lấy thêm thông tin (tổng số tập) và gọi API theo đợt (chunks).
 */
export async function enrichMoviesMetadata({
    items,
    setItems,
    isMounted,
    chunkSize = 4,
    delay = 100
}: EnrichOptions) {
    if (!items || items.length === 0) return;

    const enriched = [...items];
    
    // 1. Xác định danh sách các mục thực sự cần làm giàu
    const targets = items.map((m, idx) => ({ m, idx }))
        .filter(({ m }) => {
            // Phải là phim bộ/hoạt hình/tvshows hoặc có flag tmdb tv
            const isMulti = ["series", "hoathinh", "tvshows"].includes(m.type || "") || m.tmdb?.type === "tv";
            
            // Chưa có tổng số tập (hoặc đang là ??)
            const hasTotal = m.episode_total && m.episode_total !== "??" && m.episode_total !== "0";
            
            // Trạng thái tập phim (nếu đang là "Tập 1" hoặc chứa "/" thì nên kiểm tra lại)
            const isPossiblyOutdated = m.episode_current?.includes("/") || m.episode_current === "Tập 1" || m.episode_current === "1";

            // Chưa có đánh giá TMDB
            const hasRating = !!(m.tmdb?.vote_average && m.tmdb.vote_average > 0);

            // Làm giàu nếu:
            // 1. Là phim bộ mà thiếu thông tin HOẶC có khả năng dữ liệu tập bị cũ
            // 2. Phim lẻ thiếu rating/metadata
            return (isMulti && (!hasTotal || isPossiblyOutdated)) || !hasRating;
        });

    if (targets.length === 0) return;

    // 2. Thực hiện gọi API theo từng đợt để đảm bảo hiệu năng
    for (let i = 0; i < targets.length; i += chunkSize) {
        if (!isMounted()) break;
        
        const chunk = targets.slice(i, i + chunkSize);
        
        await Promise.all(
            chunk.map(async ({ m, idx }) => {
                try {
                    // Sử dụng proxy để tránh CORS và tận dụng cache Vercel Edge
                    const apiUrl = `https://phimapi.com/phim/${m.slug}`;
                    const detailRes = await axios.get(`/api/proxy?url=${encodeURIComponent(apiUrl)}&revalidate=60`);
                    
                    if (detailRes.data?.movie) {
                        const movieDetail = detailRes.data.movie;
                        enriched[idx] = { 
                            ...enriched[idx], 
                            episode_current: movieDetail.episode_current || enriched[idx].episode_current,
                            episode_total: movieDetail.episode_total || enriched[idx].episode_total,
                            tmdb: movieDetail.tmdb || enriched[idx].tmdb,
                            status: movieDetail.status || enriched[idx].status,
                            actor: movieDetail.actor || enriched[idx].actor,
                            director: movieDetail.director || enriched[idx].director,
                            category: movieDetail.category || enriched[idx].category,
                            country: movieDetail.country || enriched[idx].country,
                            content: movieDetail.content || enriched[idx].content,
                        };
                    }
                } catch (e) {
                    // Bỏ qua lỗi lẻ tẻ của từng phim
                }
            })
        );
        
        // Cập nhật state sau mỗi đợt để UI thay đổi mượt mà
        if (isMounted()) {
            setItems([...enriched]);
        }
        
        // Nghỉ giữa các đợt để nhường Main Thread cho scroll/animation
        if (i + chunkSize < targets.length) {
            await new Promise(r => setTimeout(r, delay));
        }
    }
}
