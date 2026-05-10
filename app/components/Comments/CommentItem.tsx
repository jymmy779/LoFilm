/* app/components/Comments/CommentItem.tsx */
"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Reply, MoreHorizontal, Eye, Flag, Trash2, EyeOff, Pencil } from "lucide-react";

import Image from "next/image";
import { createClient } from "@/app/utils/supabase/client";
import CommentInput from "./CommentInput";
import { toast } from "react-hot-toast";
import ConfirmModal from "./ConfirmModal";
import { reportCommentToTelegram } from "@/app/actions/reportActions";

interface CommentItemProps {
    comment: any;
    user: any;
    onReplyAdded: () => void;
    onDelete?: (id: string) => void;
    isReply?: boolean;
    movieSlug?: string;
}

export default function CommentItem({ comment, user, onReplyAdded, onDelete, isReply = false, movieSlug }: CommentItemProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replies, setReplies] = useState<any[]>(comment.replies || []);
    const [isRepliesExpanded, setIsRepliesExpanded] = useState(true);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [visibleReplies, setVisibleReplies] = useState(5);
    const [reactions, setReactions] = useState({ up: 0, down: 0, userType: null as string | null });
    const [showSpoiler, setShowSpoiler] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [commentContent, setCommentContent] = useState(comment.content);
    const supabase = createClient();

    const displayName = comment.user_name || "Thành viên";
    const avatarUrl = comment.user_avatar;

    // Calculate relative time
    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "vừa xong";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    useEffect(() => {
        // Initial reactions calculation
        const upCount = comment.reactions?.filter((r: any) => r.type === 'up').length || 0;
        const downCount = comment.reactions?.filter((r: any) => r.type === 'down').length || 0;
        const userReaction = comment.reactions?.find((r: any) => r.user_id === user?.id)?.type || null;

        setReactions({ up: upCount, down: downCount, userType: userReaction });
    }, [comment.reactions, user?.id]);

    const handleReact = async (type: 'up' | 'down') => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để thực hiện bình luận!");
            return;
        }

        const prevType = reactions.userType;
        let newUp = reactions.up;
        let newDown = reactions.down;
        let newType: string | null = type;

        if (prevType === type) {
            // Remove reaction
            newType = null;
            if (type === 'up') newUp--;
            else newDown--;
        } else {
            // Change or add reaction
            if (type === 'up') {
                newUp++;
                if (prevType === 'down') newDown--;
            } else {
                newDown++;
                if (prevType === 'up') newUp--;
            }
        }

        setReactions({ up: newUp, down: newDown, userType: newType });

        try {
            if (newType === null) {
                await supabase.from('comment_reactions').delete().eq('comment_id', comment.id).eq('user_id', user.id);
            } else {
                await supabase.from('comment_reactions').upsert({
                    comment_id: comment.id,
                    user_id: user.id,
                    type: type
                });
            }
        } catch (error) {
            console.error("Error reacting to comment:", error);
            // Rollback on error if needed
        }
    };

    const handleFetchReplies = async () => {
        if (isRepliesExpanded) {
            setIsRepliesExpanded(false);
            setVisibleReplies(5); // Reset limit khi đóng
            return;
        }

        if (replies.length > 0) {
            setIsRepliesExpanded(true);
            return;
        }

        setLoadingReplies(true);
        const { data, error } = await supabase
            .from('comments')
            .select(`
                id, user_id, user_name, user_avatar, movie_slug, content, parent_id, is_spoiler, is_reported, created_at,
                reactions:comment_reactions (id, user_id, type)
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setReplies(data);
            setIsRepliesExpanded(true);
        }
        setLoadingReplies(false);
    };

    const handleAddReply = async (content: string, isSpoiler: boolean) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('comments')
            .insert({
                user_id: user.id,
                user_name: user?.user_metadata?.full_name || "Thành viên",
                user_avatar: user?.user_metadata?.avatar_url || null,
                movie_slug: comment.movie_slug,
                content: content,
                parent_id: comment.id,
                is_spoiler: isSpoiler
            })
            .select(`
                *,
                reactions:comment_reactions (*)
            `)
            .maybeSingle(); // maybeSingle() trả về null thay vì error 406

        if (error) {
            toast.error("Không thể trả lời bình luận");
        } else {
            setReplies([...replies, data]);
            setIsRepliesExpanded(true);
            setVisibleReplies(prev => Math.max(prev, replies.length + 1));
            setShowReplyForm(false);
            toast.success("Đã gửi trả lời");
        }
    };

    const toggleSpoiler = async () => {
        if (user?.id === comment.user_id) {
            const { error } = await supabase.from('comments').update({ is_spoiler: !comment.is_spoiler }).eq('id', comment.id);
            if (!error) {
                toast.success("Đã cập nhật trạng thái tiết lộ nội dung");
                comment.is_spoiler = !comment.is_spoiler;
            }
        } else {
            toast.error("Bạn không có quyền thực hiện!");
        }
        setIsMenuOpen(false);
    };

    const reportComment = async () => {
        if (!user) {
            toast.error("Bạn cần đăng nhập để báo cáo!");
            return;
        }

        // Báo thành công và đóng menu ngay lập tức cho mượt
        toast.success("Báo cáo của bạn đã được gởi tới ban quản trị!");
        setIsMenuOpen(false);

        try {
            // 1. Cập nhật vào DB (Chạy ngầm)
            await supabase.from('comments').update({ is_reported: true }).eq('id', comment.id);

            // 2. Gởi về Telegram (Chạy ngầm, không await để tránh delay UI)
            reportCommentToTelegram({
                author: displayName,
                content: comment.content,
                commentId: comment.id,
                movieSlug: movieSlug,
                reportedBy: user.email || user.id
            });
        } catch (error) {
            console.error("Lỗi khi gởi báo cáo:", error);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setIsMenuOpen(false);
    };

    const handleUpdate = async (content: string, isSpoiler: boolean) => {
        try {
            const { error } = await supabase
                .from('comments')
                .update({ content, is_spoiler: isSpoiler })
                .eq('id', comment.id);

            if (error) {
                toast.error("Không thể cập nhật bình luận");
            } else {
                setCommentContent(content);
                comment.is_spoiler = isSpoiler;
                comment.content = content; // Cập nhật cho logic spoiler
                setIsEditing(false);
                toast.success("Đã cập nhật bình luận");
            }
        } catch (err) {
            toast.error("Lỗi kết nối");
        }
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
        setIsMenuOpen(false);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('comments').delete().eq('id', comment.id);
            if (!error) {
                toast.success("Đã xóa bình luận");
                if (onDelete) onDelete(comment.id);
                // Nếu là reply trong chính component này
                setReplies(replies.filter(r => r.id !== comment.id));
            } else {
                toast.error("Không thể xóa bình luận");
            }
        } catch (err) {
            toast.error("Lỗi kết nối server");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className={`comment-item-wrap ${isReply ? 'is-reply' : ''}`}>
            <div className="d-item" id={`comment-${comment.id}`}>
                <div className="user-avatar">
                    {avatarUrl ? (
                        <Image src={avatarUrl} alt={displayName} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                        <div className="avatar-fallback">
                            <i className="fa-solid fa-user"></i>
                        </div>
                    )}
                </div>
                <div className="info">
                    <div className="comment-header">
                        <div className="user-name line-center">{displayName}</div>
                        <div className="ch-logs">
                            <div className="c-time">{getTimeAgo(comment.created_at)}</div>
                        </div>
                    </div>

                    <div className="text text-sm overflow-hidden">
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isEditing ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            <CommentInput
                                isEdit={true}
                                initialContent={commentContent}
                                onSubmit={handleUpdate}
                                onCancel={() => setIsEditing(false)}
                            />
                        </div>
                        {!isEditing && (
                            <div className={`${comment.is_spoiler && !showSpoiler ? "text-spoiler" : "text-spoiler revealed"} animate-fade-in`}>
                                {commentContent}
                            </div>
                        )}
                    </div>

                    <div className="comment-bottom line-center d-flex">
                        <div className="group-react line-center">
                            <div
                                className={`item item-up line-center ${reactions.userType === 'up' ? 'active' : ''}`}
                                onClick={() => handleReact('up')}
                            >
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="16" width="16"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm11.3-395.3l112 112c4.6 4.6 5.9 11.5 3.5 17.4s-8.3 9.9-14.8 9.9l-64 0 0 96c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-96-64 0c-6.5 0-12.3-3.9-14.8-9.9s-1.1-12.9 3.5-17.4l112-112c6.2-6.2 16.4-6.2 22.6 0z"></path></svg>
                                <span>{reactions.up}</span>
                            </div>
                            <div
                                className={`item item-down line-center ${reactions.userType === 'down' ? 'active' : ''}`}
                                onClick={() => handleReact('down')}
                            >
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="16" width="16"><path d="M256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM244.7 395.3l-112-112c-4.6-4.6-5.9-11.5-3.5-17.4s8.3-9.9 14.8-9.9l64 0 0-96c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 96 64 0c6.5 0 12.3 3.9 14.8 9.9s1.1 12.9-3.5 17.4l-112 112c-6.2 6.2-16.4 6.2-22.6 0z"></path></svg>
                                <span>{reactions.down}</span>
                            </div>
                        </div>

                        {!isReply && (
                            <button
                                type="button"
                                className="btn btn-xs btn-basic btn-comment"
                                onClick={() => setShowReplyForm(!showReplyForm)}
                            >
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em"><path d="M205 34.8c11.5 5.1 19 16.6 19 29.2l0 64 112 0c97.2 0 176 78.8 176 176c0 113.3-81.5 163.9-100.2 174.1c-2.5 1.4-5.3 1.9-8.1 1.9c-10.9 0-19.7-8.9-19.7-19.7c0-7.5 4.3-14.4 9.8-19.5c9.4-8.8 22.2-26.4 22.2-56.7c0-53-43-96-96-96l-96 0 0 64c0 12.6-7.4 24.1-19 29.2s-25 3-34.4-5.4l-160-144C3.9 225.7 0 217.1 0 208s3.9-17.7 10.6-23.8l160-144c9.4-8.5 22.9-10.6 34.4-5.4z"></path></svg>
                            </button>
                        )}

                        <div className="comment-menu">
                            <button
                                type="button"
                                className="btn btn-xs btn-basic btn-menu"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em"><path d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0A56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z"></path></svg>
                            </button>

                            <div
                                className={`v-dropdown-menu border border-white/10 shadow-2xl transition-all duration-200 ${isMenuOpen ? 'visible opacity-100 scale-100 translate-y-0' : 'invisible opacity-0 scale-95 translate-y-2'}`}
                            >
                                {comment.is_spoiler && (
                                    <button className="dropdown-item text-amber-500" onClick={() => { setShowSpoiler(!showSpoiler); setIsMenuOpen(false); }}>
                                        <Eye size={14} /> <span>Tiết lộ nội dung này</span>
                                    </button>
                                )}
                                <button className="dropdown-item" onClick={reportComment}>
                                    <Flag size={14} /> <span>Báo xấu</span>
                                </button>
                                {user?.id === comment.user_id && (
                                    <>
                                        <button className="dropdown-item text-amber-500/80" onClick={handleEdit}>
                                            <Pencil size={14} /> <span>Chỉnh sửa</span>
                                        </button>
                                        <button className="dropdown-item text-red-500/80" onClick={handleDelete}>
                                            <Trash2 size={14} /> <span>Xóa bình luận</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>


                    </div>

                    <div className="reply-form-wrap">
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${showReplyForm ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            <CommentInput
                                isReply={true}
                                placeholder={`Trả lời ${displayName}...`}
                                onSubmit={handleAddReply}
                                onCancel={() => setShowReplyForm(false)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`reply-list overflow-hidden transition-all duration-400 ease-in-out ${isRepliesExpanded && replies.length > 0 ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                {replies.slice(0, visibleReplies).map(reply => (
                    <CommentItem
                        key={reply.id}
                        comment={reply}
                        user={user}
                        movieSlug={movieSlug}
                        isReply={true}
                        onReplyAdded={() => {/* NOP */ }}
                        onDelete={(id) => setReplies(replies.filter(r => r.id !== id))}
                    />
                ))}
                <div className="reply-actions mt-2 ml-10 flex items-center gap-4">
                    {replies.length > visibleReplies && (
                        <button
                            className="show-more-replies lg:text-sm text-xs cursor-pointer btn btn-xs btn-link text-amber-500/70 hover:text-amber-400 flex items-center gap-2"
                            onClick={() => setVisibleReplies(prev => prev + 5)}
                        >
                            <span className="w-8 h-px bg-amber-500/20"></span>
                            Xem thêm trả lời khác
                        </button>
                    )}
                    {visibleReplies > 5 && (
                        <button
                            className="hide-replies lg:text-sm text-xs cursor-pointer btn btn-xs btn-link text-white/30 hover:text-white/60 flex items-center gap-2"
                            onClick={() => setVisibleReplies(5)}
                        >
                            <span className="w-4 h-px bg-white/10"></span>
                            Ẩn bớt
                        </button>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title="Xóa bình luận?"
                message="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bình luận này không?"
                confirmLabel="Vẫn xóa"
            />
        </div>
    );
}
