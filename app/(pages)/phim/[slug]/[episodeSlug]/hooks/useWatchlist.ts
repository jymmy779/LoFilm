import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";

export const useWatchlist = (user: any, movieSlug: string, movieName: string, moviePoster: string, movieThumb?: string) => {
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (!user?.id) return;

        const checkWatchlist = async () => {
            try {
                const { data, error } = await supabase
                    .from('watchlist')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('movie_slug', movieSlug)
                    .maybeSingle();
                
                if (data) setIsInWatchlist(true);
                else setIsInWatchlist(false);
            } catch (err) {
                console.error("Lỗi kiểm tra danh sách xem sau:", err);
            }
        };
        checkWatchlist();
    }, [movieSlug, user?.id]); 

    const toggleWatchlist = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để thêm vào danh sách xem sau!");
            return;
        }

        const prevStatus = isInWatchlist;
        setIsInWatchlist(!isInWatchlist);

        try {
            if (prevStatus) {
                const { error } = await supabase.from('watchlist').delete().eq('movie_slug', movieSlug).eq('user_id', user.id);
                if (error) throw error;
                toast.success("Đã xóa khỏi danh sách xem sau");
            } else {
                const { error } = await supabase.from('watchlist').insert({
                    user_id: user.id,
                    movie_slug: movieSlug,
                    movie_name: movieName,
                    movie_poster: moviePoster || movieThumb
                });
                if (error) throw error;
                toast.success("Đã thêm vào danh sách xem sau");
            }
        } catch (err: any) {
            setIsInWatchlist(prevStatus);
            toast.error("Lỗi: " + err.message);
        }
    };

    return { isInWatchlist, toggleWatchlist };
};
