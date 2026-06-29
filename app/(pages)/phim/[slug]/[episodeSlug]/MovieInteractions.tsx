"use client";

import React, { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";
import Skeleton from "@/app/components/Skeleton/Skeleton";

interface MovieInteractionsProps {
    movieSlug: string;
    user: any;
}

export default function MovieInteractions({ movieSlug, user }: MovieInteractionsProps) {
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userInteraction, setUserInteraction] = useState<'like' | 'dislike' | null>(null);
    const [loading, setLoading] = useState(true);

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

        const prevInteraction = userInteraction;
        const prevLikes = likes;
        const prevDislikes = dislikes;

        if (userInteraction === type) {
            setUserInteraction(null);
            if (type === 'like') setLikes(prev => prev - 1);
            else setDislikes(prev => prev - 1);
        } else {
            if (userInteraction === 'like') setLikes(prev => prev - 1);
            if (userInteraction === 'dislike') setDislikes(prev => prev - 1);
            if (type === 'like') setLikes(prev => prev + 1);
            if (type === 'dislike') setDislikes(prev => prev + 1);
            setUserInteraction(type);
        }

        try {
            if (prevInteraction === type) {
                await supabase.from('movie_interactions').delete().eq('movie_slug', movieSlug).eq('user_id', user.id);
            } else {
                await supabase.from('movie_interactions').upsert(
                    { movie_slug: movieSlug, user_id: user.id, type: type },
                    { onConflict: 'movie_slug,user_id' }
                );
            }
        } catch (err: any) {
            setUserInteraction(prevInteraction);
            setLikes(prevLikes);
            setDislikes(prevDislikes);
            toast.error("Lỗi: " + err.message);
        }
    };

    if (loading) {
        return <div className="flex gap-4">
            <Skeleton className="w-16 h-8" rounded="lg" />
            <Skeleton className="w-16 h-8" rounded="lg" />
        </div>;
    }

    return (
        <div className="flex items-center gap-3">
            <div className="flex bg-[#111b33] p-1 rounded-2xl border border-white/5">
                <button
                    onClick={() => handleInteraction('like')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${userInteraction === 'like'
                            ? "bg-amber-400 text-black font-bold"
                            : "text-white/40 hover:text-white"
                        }`}
                >
                    <ThumbsUp size={16} className={userInteraction === 'like' ? "fill-black" : ""} />
                    <span className="text-xs">{likes}</span>
                </button>

                <button
                    onClick={() => handleInteraction('dislike')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${userInteraction === 'dislike'
                            ? "bg-red-500 text-white font-bold"
                            : "text-white/40 hover:text-white border-l border-white/10"
                        }`}
                >
                    <ThumbsDown size={16} className={userInteraction === 'dislike' ? "fill-white" : ""} />
                    <span className="text-xs">{dislikes}</span>
                </button>
            </div>
        </div>
    );
}
