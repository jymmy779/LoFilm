import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";

export const useFavorites = (user: any, movieSlug: string, movieName: string, moviePoster: string, movieThumb?: string) => {
    const [isFavorited, setIsFavorited] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // Guard clause: Không query nếu không có user -> tránh 406/401
        if (!user?.id) return;

        const checkFavorite = async () => {
            try {
                const { data, error } = await supabase
                    .from('favorites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('movie_slug', movieSlug)
                    .maybeSingle(); // maybeSingle() trả về null thay vì error 406 nếub không tìm thấy row
                
                if (data) setIsFavorited(true);
                else setIsFavorited(false);
            } catch (err) {
                console.error("Lỗi kiểm tra yêu thích:", err);
            }
        };
        checkFavorite();
    }, [movieSlug, user?.id]); 

    const toggleFavorite = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để lưu phim yêu thích!");
            return;
        }

        const prevStatus = isFavorited;
        setIsFavorited(!isFavorited);

        try {
            if (prevStatus) {
                const { error } = await supabase.from('favorites').delete().eq('movie_slug', movieSlug).eq('user_id', user.id);
                if (error) throw error;
                toast.success("Đã xóa khỏi danh sách yêu thích");
            } else {
                const { error } = await supabase.from('favorites').insert({
                    user_id: user.id,
                    movie_slug: movieSlug,
                    movie_name: movieName,
                    movie_poster: movieThumb || moviePoster
                });
                if (error) throw error;
                toast.success("Đã thêm vào danh sách yêu thích");
            }
        } catch (err: any) {
            setIsFavorited(prevStatus);
            toast.error("Lỗi: " + err.message);
        }
    };

    return { isFavorited, toggleFavorite };
};
