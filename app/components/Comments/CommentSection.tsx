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
import { logActivity } from "@/app/utils/log-activity";
import "./Comments.css";

interface CommentSectionProps {
    movieSlug: string;
}

import React from "react";

function CommentSection({ movieSlug }: CommentSectionProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(5);
    const supabase = createClient();

    // Lấy slug gốc của phim (bỏ phần tập phim đằng sau nếu có) để đồng bộ lượt thích của cả bộ phim
    const mainMovieSlug = movieSlug.includes('/') ? movieSlug.split('/')[0] : movieSlug;

    useEffect(() => {
        setVisibleCount(5); // Reset visible count when movie changes
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
            let query = supabase
                .from('comments')
                .select(`
                    id, user_id, user_name, user_avatar, movie_slug, content, parent_id, is_spoiler, is_reported, created_at,
                    reactions:comment_reactions (id, user_id, type)
                `);

            if (movieSlug.includes('/')) {
                // Trang xem tập phim cụ thể -> Lấy bình luận của tập đó VÀ bình luận chung của phim (trang detail)
                query = query.or(`movie_slug.eq.${movieSlug},movie_slug.eq.${mainMovieSlug}`);
            } else {
                // Trang chi tiết phim -> Lấy bình luận chung của phim VÀ của tất cả các tập
                query = query.or(`movie_slug.eq.${movieSlug},movie_slug.like.${movieSlug}/%`);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

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

    // Tự động scroll đến bình luận nếu URL có chứa hash (khi bấm từ trang khác sang)
    useEffect(() => {
        if (!loading && comments.length > 0) {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#comment-')) {
                // Đợi 1 chút để DOM render xong các comment
                setTimeout(() => {
                    const el = document.getElementById(hash.substring(1));
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.style.transition = 'background-color 0.5s';
                        const originalBg = el.style.backgroundColor;
                        el.style.backgroundColor = 'rgba(245, 166, 35, 0.2)'; // amber-500/20
                        setTimeout(() => {
                            el.style.backgroundColor = originalBg;
                        }, 2000);
                    }
                }, 500);
            }
        }
    }, [loading, comments.length]);

    const handleAddComment = async (content: string, isSpoiler: boolean) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('comments')
            .insert({
                user_id: user.id,
                user_name: user?.user_metadata?.full_name,
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
            logActivity(user.id, "comment", { movie_slug: movieSlug, content: content.substring(0, 100) });
        }
    };

    return (
        <div className="comment-section">
            <div className="mb-6">
                <MovieInteractions movieSlug={mainMovieSlug} user={user} />
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
                    <>
                        <div className="flex flex-col gap-6">
                            {comments.slice(0, visibleCount).map(comment => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    user={user}
                                    movieSlug={movieSlug}
                                    onReplyAdded={() => { }}
                                    onDelete={(id) => setComments(comments.filter(c => c.id !== id))}
                                />
                            ))}
                        </div>

                        {(comments.length > visibleCount || visibleCount > 5) && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                                {comments.length > visibleCount && (
                                    <button
                                        onClick={() => setVisibleCount(prev => prev + 5)}
                                        className="group text-[12px] md:text-[13px] text-white/40 hover:text-[#f5a623] font-semibold transition-colors duration-300 cursor-pointer flex items-center gap-1.5 py-2 px-4"
                                    >
                                        <span>Xem thêm bình luận (+{comments.length - visibleCount})</span>
                                        <i className="fa-solid fa-chevron-down text-[10px] group-hover:translate-y-0.5 transition-transform duration-300"></i>
                                    </button>
                                )}

                                {visibleCount > 5 && (
                                    <button
                                        onClick={() => {
                                            setVisibleCount(5);
                                            document.querySelector('.comment-section')?.scrollIntoView({ behavior: 'instant', block: 'start' });
                                        }}
                                        className="group text-[12px] md:text-[13px] text-white/30 hover:text-red-400 font-semibold transition-colors duration-300 cursor-pointer flex items-center gap-1.5 py-2 px-4"
                                    >
                                        <span>Thu gọn</span>
                                        <i className="fa-solid fa-chevron-up text-[10px] group-hover:-translate-y-0.5 transition-transform duration-300"></i>
                                    </button>
                                )}
                            </div>
                        )}
                    </>
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

export default React.memo(CommentSection);
