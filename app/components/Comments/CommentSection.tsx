/* app/components/Comments/CommentSection.tsx */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";
import CommentItem from "./CommentItem";
import CommentInput from "./CommentInput";
import Skeleton from "../Skeleton/Skeleton";
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
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching comments:", error);
            } else if (data) {
                // Phân loại comment: cha và con
                const parentComments = data.filter(c => !c.parent_id);
                const replies = data.filter(c => c.parent_id);

                // Gắn reply vào comment cha
                const structuredComments = parentComments.map(parent => ({
                    ...parent,
                    replies: replies.filter(reply => reply.parent_id === parent.id).reverse(), // reverse để reply cũ ở trên, mới ở dưới (do query đang desc)
                    reply_count: replies.filter(reply => reply.parent_id === parent.id).length
                }));

                setComments(structuredComments);
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
            .maybeSingle(); // maybeSingle() trả về null thay vì error 406

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
                 <MovieInteractions movieSlug={movieSlug} user={user} />
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
                    <div className="flex flex-col gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="w-10 h-10 shrink-0" rounded="full" />
                                <div className="flex-1 space-y-3 pt-1">
                                    <Skeleton className="w-32 h-4" rounded="md" />
                                    <Skeleton className="w-full h-12" rounded="xl" />
                                </div>
                            </div>
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
                    <div className="text-center py-10 md:py-14 bg-white/[0.02] border border-white/10 rounded-2xl">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-white/10">
                            <i className="fa-solid fa-comment-slash text-xl"></i>
                        </div>
                        <p className="text-white/20 italic font-medium text-xs md:text-sm px-4">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm xúc!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
