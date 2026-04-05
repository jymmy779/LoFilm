import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";

export const useFavorites = (user: any, movieSlug: string, movieName: string, moviePoster: string) => {
    const [isFavorited, setIsFavorited] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkFavorite = async () => {
            if (user) {
                const { data } = await supabase
                    .from('favorites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('movie_slug', movieSlug)
                    .single();
                if (data) setIsFavorited(true);
            }
        };
        checkFavorite();
    }, [movieSlug, user, supabase]);

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
                    movie_poster: moviePoster
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
