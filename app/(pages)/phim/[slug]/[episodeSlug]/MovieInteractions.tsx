"use client";

import React, { useState, useEffect, useRef } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import { logActivity } from "@/app/utils/log-activity";

interface MovieInteractionsProps {
    movieSlug: string;
    user: any;
}

export default function MovieInteractions({ movieSlug, user }: MovieInteractionsProps) {
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userInteraction, setUserInteraction] = useState<'like' | 'dislike' | null>(null);
    const [loading, setLoading] = useState(true);
    const [burstKey, setBurstKey] = useState(0);
    
    const interactionRef = useRef<'like' | 'dislike' | null>(null);
    const lastClickRef = useRef<number>(0);
    const apiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Đồng bộ state sang ref để xử lý spam click nhanh (tránh race condition của React)
    useEffect(() => {
        interactionRef.current = userInteraction;
    }, [userInteraction]);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get counts
                const { data: counts } = await supabase
                    .from('movie_interactions')
                    .select('type')
                    .eq('movie_slug', movieSlug);

                if (counts) {
                    setLikes(counts.filter(c => c.type === 'like').length);
                    setDislikes(counts.filter(c => c.type === 'dislike').length);
                }

                // 2. Get user current interaction
                if (user) {
                    const { data: interactionRes } = await supabase
                        .from('movie_interactions')
                        .select('type')
                        .eq('movie_slug', movieSlug)
                        .eq('user_id', user.id)
                        .limit(1)
                        .maybeSingle();

                    if (interactionRes) {
                        setUserInteraction(interactionRes.type as 'like' | 'dislike');
                        interactionRef.current = interactionRes.type as 'like' | 'dislike';
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [movieSlug, supabase, user]);

    const handleInteraction = async (type: 'like' | 'dislike') => {
        if (!user) {
            toast.error("Bạn cần đăng nhập để thực hiện!");
            return;
        }

        const now = Date.now();
        // CƠ CHẾ CHỐNG SPAM UI: Bỏ qua các cú click liên tiếp dưới 400ms để bảo vệ animation
        if (now - lastClickRef.current < 400) return;
        lastClickRef.current = now;

        const currentTrueInteraction = interactionRef.current;

        // Trigger micro-animation ONLY when transitioning TO 'like'
        if (currentTrueInteraction !== 'like' && type === 'like') {
            setBurstKey(Date.now()); // Ép React render lại DOM mới tinh để chạy lại animation
        }

        if (currentTrueInteraction === type) {
            setUserInteraction(null);
            interactionRef.current = null;
            if (type === 'like') setLikes(prev => prev - 1);
            else setDislikes(prev => prev - 1);
        } else {
            if (currentTrueInteraction === 'like') setLikes(prev => prev - 1);
            if (currentTrueInteraction === 'dislike') setDislikes(prev => prev - 1);
            if (type === 'like') setLikes(prev => prev + 1);
            if (type === 'dislike') setDislikes(prev => prev + 1);
            setUserInteraction(type);
            interactionRef.current = type;
        }

        // CƠ CHẾ CHỐNG SPAM API: Chỉ gọi Database sau khi user đã DỪNG bấm 1 giây
        if (apiTimeoutRef.current) clearTimeout(apiTimeoutRef.current);
        
        apiTimeoutRef.current = setTimeout(async () => {
            const finalInteraction = interactionRef.current;
            try {
                if (finalInteraction === null) {
                    await supabase.from('movie_interactions').delete().eq('movie_slug', movieSlug).eq('user_id', user.id);
                } else {
                    await supabase.from('movie_interactions').upsert(
                        { movie_slug: movieSlug, user_id: user.id, type: finalInteraction },
                        { onConflict: 'movie_slug,user_id' }
                    );
                    logActivity(user.id, finalInteraction === 'like' ? 'like_movie' : 'dislike_movie', { movie_slug: movieSlug });
                }
            } catch (err: any) {
                toast.error("Lỗi cập nhật tương tác: " + err.message);
            }
        }, 1000);
    };

    if (loading) {
        return <div className="flex gap-4">
            <Skeleton className="w-16 h-8" rounded="lg" />
            <Skeleton className="w-16 h-8" rounded="lg" />
        </div>;
    }

    return (
        <div className="flex items-center gap-3">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes like-spark-anim {
                    0% { transform: rotate(var(--r)) translateY(-8px) scale(0.5); opacity: 1; }
                    100% { transform: rotate(var(--r)) translateY(-24px) scale(1.2); opacity: 0; }
                }
            `}} />
            <div className="flex bg-[#111419] p-1 rounded-2xl border border-white/5">
                <button
                    onClick={() => handleInteraction('like')}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${userInteraction === 'like'
                        ? "bg-[#D497FF] text-black font-bold"
                        : "text-white/40 hover:text-white"
                        }`}
                >
                    {burstKey > 0 && userInteraction === 'like' && (
                        <div key={burstKey} className="absolute top-1/2 left-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                                <div
                                    key={deg}
                                    className="absolute w-[3px] h-[8px] bg-[#D497FF] rounded-full origin-center"
                                    style={{
                                        '--r': `${deg}deg`,
                                        animation: 'like-spark-anim 0.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards'
                                    } as React.CSSProperties}
                                />
                            ))}
                        </div>
                    )}
                    <ThumbsUp 
                        size={16} 
                        className={`relative z-10 origin-bottom-left ${userInteraction === 'like' ? "fill-black" : ""}`} 
                        style={burstKey > 0 && userInteraction === 'like' ? { animation: 'thumb-raise 0.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards' } : {}}
                    />
                    <span className="text-xs relative z-10">{likes}</span>
                </button>

                <button
                    onClick={() => handleInteraction('dislike')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${userInteraction === 'dislike'
                        ? "bg-[#D497FF] text-black font-bold"
                        : "text-white/40 hover:text-white border-l border-white/10"
                        }`}
                >
                    <ThumbsDown size={16} className={userInteraction === 'dislike' ? "fill-black" : ""} />
                    <span className="text-xs">{dislikes}</span>
                </button>
            </div>
        </div>
    );
}
