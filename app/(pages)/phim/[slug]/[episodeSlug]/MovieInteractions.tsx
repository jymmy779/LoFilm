"use client";

import React, { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";

interface MovieInteractionsProps {
    movieSlug: string;
}

export default function MovieInteractions({ movieSlug }: MovieInteractionsProps) {
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userInteraction, setUserInteraction] = useState<'like' | 'dislike' | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get counts
                const { data: counts, error: countError } = await supabase
                    .from('movie_interactions')
                    .select('type', { count: 'exact' })
                    .eq('movie_slug', movieSlug);

                if (countError && !countError.message.includes("does not exist")) {
                    console.error(countError);
                }

                if (counts) {
                    setLikes(counts.filter(c => c.type === 'like').length);
                    setDislikes(counts.filter(c => c.type === 'dislike').length);
                }

                // 2. Get user current interaction
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: interaction } = await supabase
                        .from('movie_interactions')
                        .select('type')
                        .eq('movie_slug', movieSlug)
                        .eq('user_id', user.id)
                        .single();
                    
                    if (interaction) {
                        setUserInteraction(interaction.type as 'like' | 'dislike');
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [movieSlug, supabase]);

    const handleInteraction = async (type: 'like' | 'dislike') => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            toast.error("Bạn cần đăng nhập để thực hiện tính năng này!");
            return;
        }

        // --- OPTIMISTIC UPDATE ---
        const prevInteraction = userInteraction;
        const prevLikes = likes;
        const prevDislikes = dislikes;

        // Cập nhật UI ngay lập tức
        if (userInteraction === type) {
            // Un-vote
            setUserInteraction(null);
            if (type === 'like') setLikes(prev => prev - 1);
            else setDislikes(prev => prev - 1);
        } else {
            // Change vote or New vote
            if (userInteraction === 'like') setLikes(prev => prev - 1);
            if (userInteraction === 'dislike') setDislikes(prev => prev - 1);
            
            if (type === 'like') setLikes(prev => prev + 1);
            if (type === 'dislike') setDislikes(prev => prev + 1);
            setUserInteraction(type);
        }
        // -------------------------

        try {
            if (prevInteraction === type) {
                // Remove interaction from DB
                const { error } = await supabase
                    .from('movie_interactions')
                    .delete()
                    .eq('movie_slug', movieSlug)
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                // Upsert interaction to DB
                const { error } = await supabase
                    .from('movie_interactions')
                    .upsert({
                        movie_slug: movieSlug,
                        user_id: user.id,
                        type: type
                    });
                if (error) throw error;
            }
        } catch (err: any) {
            // Rollback if error
            setUserInteraction(prevInteraction);
            setLikes(prevLikes);
            setDislikes(prevDislikes);
            toast.error("Lỗi: " + err.message);
        }
    };

    if (loading) {
        return <div className="flex gap-4 animate-pulse">
            <div className="w-16 h-8 bg-white/5 rounded-lg" />
            <div className="w-16 h-8 bg-white/5 rounded-lg" />
        </div>;
    }

    return (
        <div className="flex items-center gap-3">
            <button 
                onClick={() => handleInteraction('like')}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                    userInteraction === 'like' 
                    ? "bg-amber-400 text-black border-amber-400 font-bold" 
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
            >
                <ThumbsUp size={16} className={userInteraction === 'like' ? "fill-black" : ""} />
                <span className="text-xs">{likes}</span>
            </button>

            <button 
                onClick={() => handleInteraction('dislike')}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                    userInteraction === 'dislike' 
                    ? "bg-red-500 text-white border-red-500 font-bold" 
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
            >
                <ThumbsDown size={16} className={userInteraction === 'dislike' ? "fill-white" : ""} />
                <span className="text-xs">{dislikes}</span>
            </button>
        </div>
    );
}
