/* app/components/Comments/CommentSection.tsx */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";
import CommentItem from "./CommentItem";
import CommentInput from "./CommentInput";
import AuthPrompt from "./AuthPrompt";
import { toast } from "react-hot-toast";
import MovieInteractions from "../../(pages)/phim/[slug]/[episodeSlug]/MovieInteractions";
import "./Comments.css";

interface CommentSectionProps {
    movieSlug: string;
}

export default function CommentSection({ movieSlug }: CommentSectionProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        fetchUser();

        // Lắng nghe sự kiện auth (login/logout) để cập nhật UI ngay lập tức
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        const fetchComments = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    id, user_id, user_name, user_avatar, movie_slug, content, parent_id, is_spoiler, is_reported, created_at,
                    reactions:comment_reactions (id, user_id, type)
                `)
                .eq('movie_slug', movieSlug)
                .is('parent_id', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching comments:", error);
            } else {
                setComments(data || []);
            }
            setLoading(false);
        };

        fetchComments();

        return () => subscription.unsubscribe();
    }, [movieSlug, supabase]);

    const handleAddComment = async (content: string, isSpoiler: boolean) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('comments')
            .insert({
                user_id: user.id,
                user_name: user?.user_metadata?.full_name || "Thành viên",
                user_avatar: user?.user_metadata?.avatar_url || null,
                movie_slug: movieSlug,
                content: content,
                is_spoiler: isSpoiler
            })
            .select(`
                id, user_id, user_name, user_avatar, movie_slug, content, parent_id, is_spoiler, is_reported, created_at,
                reactions:comment_reactions (id, user_id, type)
            `)
            .single();

        if (error) {
            toast.error("Không thể gửi bình luận");
        } else {
            setComments([data, ...comments]);
            toast.success("Đã gửi bình luận");
        }
    };

    return (
        <div className="comment-section">
            <div className="mb-6">
                 <MovieInteractions movieSlug={movieSlug} />
            </div>

            <h3 className="comment-label">
                <i className="fa-solid fa-comments text-[#f5a623]"></i>
                Bình luận
            </h3>

            {user ? (
                <CommentInput 
                    onSubmit={handleAddComment} 
                    hasCommented={comments.some(c => c.user_id === user.id)}
                    userCommentId={comments.find(c => c.user_id === user.id)?.id}
                />
            ) : (
                <AuthPrompt />
            )}

            <div className="comment-list mt-8">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : comments.length > 0 ? (
                    comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            user={user}
                            movieSlug={movieSlug}
                            onReplyAdded={() => { }}
                            onDelete={(id) => setComments(comments.filter(c => c.id !== id))}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-white/10">
                            <i className="fa-solid fa-message-slash text-2xl"></i>
                        </div>
                        <p className="text-white/20 italic font-medium">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm xúc!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
