import axios from "axios";
import { Movie } from "@/app/types/movie";
import { fetchTotalEpisodesFromTMDB } from "./tmdbUtils";

// Global cache to share enriched data across all components on the client side
// This survives component unmounts and prop changes within the same session
const movieDetailCache = new Map<string, Partial<Movie>>();

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
 * Sử dụng Global Cache để hiển thị dữ liệu tức thì cho các phim đã được fetch trước đó.
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
    let hasCacheHit = false;

    // 1. Kiểm tra Cache trước để cập nhật tức thì (Instant Update)
    items.forEach((m, idx) => {
        const cached = movieDetailCache.get(m.slug);
        if (cached) {
            enriched[idx] = { ...enriched[idx], ...cached };
            hasCacheHit = true;
        }
    });

    // Nếu có cache hit, cập nhật UI ngay lập tức để xóa dấu ??
    if (hasCacheHit && isMounted()) {
        setItems([...enriched]);
    }
    
    // 2. Xác định danh sách các mục thực sự cần làm giàu (không có trong cache hoặc cần update)
    const targets = enriched.map((m, idx) => ({ m, idx }))
        .filter(({ m }) => {
            // Nếu vừa mới lấy từ cache xong, có thể cân nhắc bỏ qua fetch lại nếu dữ liệu đã đủ
            const alreadyCached = movieDetailCache.has(m.slug);
            
            // Phải là phim bộ/hoạt hình/tvshows hoặc có flag tmdb tv
            const isMulti = ["series", "hoathinh", "tvshows"].includes(m.type || "") || m.tmdb?.type === "tv";
            
            // Chưa có tổng số tập (hoặc đang là ??)
            const hasTotal = m.episode_total && m.episode_total !== "??" && m.episode_total !== "0";
            
            // Trạng thái tập phim (nếu đang là "Tập 1" hoặc chứa "/" thì nên kiểm tra lại)
            const isPossiblyOutdated = m.episode_current?.includes("/") || m.episode_current === "Tập 1" || m.episode_current === "1";

            // Chưa có đánh giá TMDB
            const hasRating = !!(m.tmdb?.vote_average && m.tmdb.vote_average > 0);

            // Kiểm tra xem total_episode có hợp lệ không (total >= current)
            const currentNum = parseInt(m.episode_current?.match(/\d+/)?.[0] || "0");
            const totalNum = parseInt(m.episode_total?.match(/\d+/)?.[0] || "0");
            const isTotalInvalid = totalNum > 0 && currentNum > totalNum;

            // Nếu đã có trong cache và đủ thông tin quan trọng, không cần fetch lại nữa để tiết kiệm resource
            if (alreadyCached && hasTotal && hasRating && !isPossiblyOutdated && !isTotalInvalid) return false;

            return (isMulti && (!hasTotal || isPossiblyOutdated || isTotalInvalid)) || !hasRating;
        });

    if (targets.length === 0) return;

    // 3. Thực hiện gọi API theo từng đợt để đảm bảo hiệu năng
    for (let i = 0; i < targets.length; i += chunkSize) {
        if (!isMounted()) break;
        
        const chunk = targets.slice(i, i + chunkSize);
        
        await Promise.all(
            chunk.map(async ({ m, idx }) => {
                try {
                    const apiUrl = `https://phimapi.com/phim/${m.slug}`;
                    const detailRes = await axios.get(`/api/proxy?url=${encodeURIComponent(apiUrl)}&revalidate=60`);
                    
                    if (detailRes.data?.movie) {
                        const movieDetail = detailRes.data.movie;
                        
                        // Logic sửa lỗi Total Episode dựa trên TMDB nếu cần
                        let correctTotal = movieDetail.episode_total;
                        const curNum = parseInt(movieDetail.episode_current?.match(/\d+/)?.[0] || "0");
                        const totNum = parseInt(movieDetail.episode_total?.match(/\d+/)?.[0] || "0");
                        
                        // Nếu total vô lý (nhỏ hơn current) hoặc fetch từ api bị thiếu
                        if ((totNum < curNum || !totNum) && movieDetail.tmdb?.id && movieDetail.tmdb.type === "tv") {
                            const tmdbTotal = await fetchTotalEpisodesFromTMDB(movieDetail.tmdb.id);
                            if (tmdbTotal && tmdbTotal >= curNum) {
                                correctTotal = tmdbTotal.toString();
                            } else if (curNum > 0) {
                                // Fallback: nếu tmdb cũng ko có, lấy tạm current làm total nêú đang chiếu (ongoing)
                                correctTotal = curNum.toString();
                            }
                        }

                        const updateData = { 
                            episode_current: movieDetail.episode_current || enriched[idx].episode_current,
                            episode_total: correctTotal || enriched[idx].episode_total,
                            tmdb: movieDetail.tmdb || enriched[idx].tmdb,
                            status: movieDetail.status || enriched[idx].status,
                            actor: movieDetail.actor || enriched[idx].actor,
                            director: movieDetail.director || enriched[idx].director,
                            category: movieDetail.category || enriched[idx].category,
                            country: movieDetail.country || enriched[idx].country,
                            content: movieDetail.content || enriched[idx].content,
                        };

                        // Lưu vào Global Cache
                        movieDetailCache.set(m.slug, updateData);
                        
                        // Cập nhật mảng hiện tại
                        enriched[idx] = { ...enriched[idx], ...updateData };
                    }
                } catch (e) {
                    // Bỏ qua lỗi lẻ tẻ
                }
            })
        );
        
        // Cập nhật state sau mỗi đợt để UI thay đổi mượt mà
        if (isMounted()) {
            setItems([...enriched]);
        }
        
        // Nghỉ giữa các đợt
        if (i + chunkSize < targets.length) {
            await new Promise(r => setTimeout(r, delay));
        }
    }
}
