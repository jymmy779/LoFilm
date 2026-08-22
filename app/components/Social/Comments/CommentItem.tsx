/* app/components/Comments/CommentItem.tsx */
"use client";

import { useState, useEffect, useRef } from "react";
import { ThumbsUp, ThumbsDown, Reply, MoreHorizontal, Eye, Flag, Trash2, EyeOff, Pencil } from "lucide-react";

import Image from "next/image";
import { createClient } from "@/app/utils/supabase/client";
import CommentInput from "./CommentInput";
import { toast } from "react-hot-toast";
import CommonModal from "@/app/components/UI/Modals/CommonModal";
import ReportCommentModal from "./ReportCommentModal";
import { reportCommentToTelegram } from "@/app/actions/reportActions";
import { isOwner } from "@/app/utils/owner-utils";
import { logActivity } from "@/app/utils/log-activity";
import { getUserAvatarUrl } from "@/app/utils/avatar-helper";
import { sendLikeNotification } from "@/app/actions/notificationActions";

interface CommentItemProps {
    comment: any;
    user: any;
    onReplyAdded: (newReply?: any) => void;
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
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [commentContent, setCommentContent] = useState(comment.content);
    const supabase = createClient();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    const displayName = comment.user_name || "Thành viên";
    const avatarUrl = comment.user_avatar || getUserAvatarUrl(undefined, displayName);

    const isDetailMoviePage = movieSlug && !movieSlug.includes('/');
    const commentHasEpisode = comment.movie_slug && comment.movie_slug.includes('/');

    let episodeBadge = null;
    if (isDetailMoviePage && commentHasEpisode) {
        const rawEp = comment.movie_slug.split('/')[1];
        let epText = '';
        if (rawEp === 'full' || rawEp === 'tap-full') {
            epText = 'Bản Full';
        } else {
            const numMatch = rawEp.match(/\d+/);
            epText = numMatch ? `Tập ${parseInt(numMatch[0])}` : rawEp;
        }
        episodeBadge = (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#D497FF]/10 text-[#D497FF] border border-[#D497FF]/20 ml-2 select-none animate-fade-in">
                {epText}
            </span>
        );
    }

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

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const persistedReactionTypeRef = useRef<string | null>(null);
    const latestReactionTypeRef = useRef<string | null>(null);

    useEffect(() => {
        // Initial reactions calculation
        const upCount = comment.reactions?.filter((r: any) => r.type === 'up').length || 0;
        const downCount = comment.reactions?.filter((r: any) => r.type === 'down').length || 0;
        const userReaction = comment.reactions?.find((r: any) => r.user_id === user?.id)?.type || null;

        setReactions({ up: upCount, down: downCount, userType: userReaction });
        persistedReactionTypeRef.current = userReaction;
        latestReactionTypeRef.current = userReaction;
    }, [comment.reactions, user?.id]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const syncReactionToDatabase = async (finalType: string | null) => {
        if (!user || finalType === persistedReactionTypeRef.current) return;
        persistedReactionTypeRef.current = finalType;

        try {
            // 1. Cập nhật bảng reactions
            await supabase.from('comment_reactions').delete().eq('comment_id', comment.id).eq('user_id', user.id);

            if (finalType !== null) {
                logActivity(user.id, finalType === 'up' ? 'like' : 'dislike', { comment_id: comment.id, movie_slug: comment.movie_slug });
                await supabase.from('comment_reactions').insert({
                    comment_id: comment.id,
                    user_id: user.id,
                    type: finalType
                });
            }

            // 2. Xử lý thông báo chuẩn YouTube:
            // - Tuyệt đối KHÔNG gửi thông báo khi Dislike.
            // - CHỈ gửi thông báo khi Like (upvote).
            // - Gắn cờ kiểm tra trên server: Người này chỉ tạo tối đa 1 thông báo Like duy nhất cho bình luận này.
            if (finalType === 'up' && comment.user_id && comment.user_id !== user.id) {
                const actorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Thành viên';
                await sendLikeNotification({
                    recipientUserId: comment.user_id,
                    actorName: actorName,
                    actorAvatar: getUserAvatarUrl(user),
                    commentId: comment.id,
                    movieSlug: comment.movie_slug,
                    content: comment.content || ''
                });
            }
        } catch (error) {
            console.error("Error syncing comment reaction:", error);
        }
    };

    const handleReact = (type: 'up' | 'down') => {
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

        // 1. Cập nhật Optimistic UI tức thì (0ms) cho cảm giác mượt mà
        setReactions({ up: newUp, down: newDown, userType: newType });
        latestReactionTypeRef.current = newType;

        // 2. Debounce 350ms chuẩn mạng xã hội trước khi gửi lên Server/Database
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            syncReactionToDatabase(latestReactionTypeRef.current);
        }, 350);
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

        const targetParentId = isReply ? comment.parent_id : comment.id;

        const { data, error } = await supabase
            .from('comments')
            .insert({
                user_id: user.id,
                user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
                user_avatar: getUserAvatarUrl(user),
                movie_slug: comment.movie_slug,
                content: content,
                parent_id: targetParentId,
                is_spoiler: isSpoiler
            })
            .select(`
                *,
                reactions:comment_reactions (*)
            `)
            .maybeSingle();

        if (error) {
            toast.error("Không thể trả lời bình luận");
        } else {
            if (isReply && onReplyAdded) {
                // If this is already a reply, pass the new reply up to the parent CommentItem
                onReplyAdded(data);
                setShowReplyForm(false);
                toast.success("Đã gửi trả lời");
            } else {
                setReplies([...replies, data]);
                setIsRepliesExpanded(true);
                setVisibleReplies(prev => Math.max(prev, replies.length + 1));
                setShowReplyForm(false);
                toast.success("Đã gửi trả lời");
            }
            logActivity(user.id, "reply", { movie_slug: comment.movie_slug, content: content.substring(0, 100), parent_id: comment.id });

            // Add notification
            if (comment.user_id && comment.user_id !== user.id) {
                supabase.from('user_notifications').insert({
                    user_id: comment.user_id,
                    actor_name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
                    actor_avatar: getUserAvatarUrl(user),
                    type: 'reply',
                    comment_id: comment.id,
                    movie_slug: comment.movie_slug,
                    content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
                }).then(({ error }) => {
                    if (error) console.error("Notification error:", error);
                });
            }
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

    const handleOpenReportModal = () => {
        if (!user) {
            toast.error("Bạn cần đăng nhập để báo cáo!");
            return;
        }
        if (user.id === comment.user_id) {
            toast.error("Bạn không thể báo cáo bình luận của chính mình!");
            return;
        }
        setIsReportModalOpen(true);
        setIsMenuOpen(false);
    };

    const handleConfirmReport = async (reason: string) => {
        setIsReporting(true);
        try {
            // 1. Cập nhật vào DB
            await supabase.from('comments').update({ is_reported: true }).eq('id', comment.id);

            // 2. Gửi về Telegram kèm lý do
            reportCommentToTelegram({
                author: displayName,
                content: comment.content,
                commentId: comment.id,
                movieSlug: movieSlug,
                reportedBy: user.email || user.id,
                reason: reason
            });

            toast.success("Báo cáo của bạn đã được gửi tới ban quản trị!");
            setIsReportModalOpen(false);
        } catch (error) {
            console.error("Lỗi khi gửi báo cáo:", error);
            toast.error("Không thể gửi báo cáo, vui lòng thử lại sau.");
        } finally {
            setIsReporting(false);
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
        <div className={`comment-item-wrap ${isReply ? 'is-reply' : ''} ${isMenuOpen ? 'relative z-[100]' : ''}`}>
            <div className="d-item" id={`comment-${comment.id}`}>
                <div className="user-avatar overflow-hidden rounded-full shrink-0">
                    <Image src={avatarUrl} alt={displayName} width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div className="info">
                    <div className="comment-header flex items-center">
                        <div className={`user-name line-center ${isOwner(comment.user_id) ? 'rgb-text' : ''}`}>{displayName}</div>
                        {episodeBadge}
                        <div className="ch-logs">
                            <div className="c-time">{getTimeAgo(comment.created_at)}</div>
                        </div>
                    </div>

                    <div className="text text-sm overflow-hidden">
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isEditing ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            {isEditing && (
                                <CommentInput
                                    isEdit={true}
                                    initialContent={commentContent}
                                    initialIsSpoiler={comment.is_spoiler}
                                    onSubmit={handleUpdate}
                                    onCancel={() => setIsEditing(false)}
                                />
                            )}
                        </div>
                        {!isEditing && (
                            comment.is_spoiler ? (
                                <div
                                    onClick={() => !showSpoiler && setShowSpoiler(true)}
                                    className={`${!showSpoiler ? "text-spoiler" : "text-spoiler revealed"} animate-fade-in`}
                                    title={!showSpoiler ? "Nhấp để xem nội dung ẩn" : undefined}
                                >
                                    {commentContent}
                                </div>
                            ) : (
                                <div className="animate-fade-in break-words whitespace-pre-wrap">
                                    {commentContent}
                                </div>
                            )
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

                        <button
                            type="button"
                            className="btn btn-xs btn-basic btn-comment"
                            onClick={() => setShowReplyForm(!showReplyForm)}
                        >
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em"><path d="M205 34.8c11.5 5.1 19 16.6 19 29.2l0 64 112 0c97.2 0 176 78.8 176 176c0 113.3-81.5 163.9-100.2 174.1c-2.5 1.4-5.3 1.9-8.1 1.9c-10.9 0-19.7-8.9-19.7-19.7c0-7.5 4.3-14.4 9.8-19.5c9.4-8.8 22.2-26.4 22.2-56.7c0-53-43-96-96-96l-96 0 0 64c0 12.6-7.4 24.1-19 29.2s-25 3-34.4-5.4l-160-144C3.9 225.7 0 217.1 0 208s3.9-17.7 10.6-23.8l160-144c9.4-8.5 22.9-10.6 34.4-5.4z"></path></svg>
                        </button>

                        <div className="comment-menu" ref={menuRef}>
                            <button
                                type="button"
                                className="btn btn-xs btn-basic btn-menu"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em"><path d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0A56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z"></path></svg>
                            </button>

                            <div
                                className={`v-dropdown-menu border border-white/10 transition-all duration-200 ${isMenuOpen ? 'visible opacity-100 scale-100 translate-y-0' : 'invisible opacity-0 scale-95 translate-y-2'}`}
                            >
                                {comment.is_spoiler && (
                                    <button className="dropdown-item text-[#D497FF]" onClick={() => { setShowSpoiler(!showSpoiler); setIsMenuOpen(false); }}>
                                        {showSpoiler ? <EyeOff size={14} /> : <Eye size={14} />}
                                        <span>{showSpoiler ? "Ẩn nội dung này" : "Tiết lộ nội dung này"}</span>
                                    </button>
                                )}
                                {user?.id !== comment.user_id && (
                                    <button className="dropdown-item text-amber-400/90 hover:text-amber-400" onClick={handleOpenReportModal}>
                                        <Flag size={14} /> <span>Báo xấu</span>
                                    </button>
                                )}
                                {user?.id === comment.user_id && (
                                    <>
                                        <button className="dropdown-item text-[#D497FF]/80" onClick={handleEdit}>
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
                </div>
            </div>

            <div className="reply-form-wrap">
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${showReplyForm ? 'max-h-[500px] opacity-100 mt-2.5' : 'max-h-0 opacity-0'}`}
                >
                    {showReplyForm && (
                        <div className="pl-3 sm:pl-8">
                            <CommentInput
                                isReply={true}
                                placeholder={`Trả lời ${displayName}...`}
                                onSubmit={handleAddReply}
                                onCancel={() => setShowReplyForm(false)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div
                className={`reply-list ${replies.length > 0 ? 'has-replies' : ''} transition-all duration-400 ease-in-out ${isRepliesExpanded && replies.length > 0 ? 'max-h-[5000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}
            >
                {replies.slice(0, visibleReplies).map(reply => (
                    <CommentItem
                        key={reply.id}
                        comment={reply}
                        user={user}
                        movieSlug={movieSlug}
                        isReply={true}
                        onReplyAdded={(newReply) => {
                            setReplies([...replies, newReply]);
                            setIsRepliesExpanded(true);
                            setVisibleReplies(prev => Math.max(prev, replies.length + 1));
                        }}
                        onDelete={(id) => setReplies(replies.filter(r => r.id !== id))}
                    />
                ))}
                <div className="reply-actions mt-2 ml-10 flex items-center gap-4">
                    {replies.length > visibleReplies && (
                        <button
                            className="show-more-replies lg:text-sm text-xs cursor-pointer btn btn-xs btn-link text-[#D497FF]/70 hover:text-[#D497FF] flex items-center gap-2"
                            onClick={() => setVisibleReplies(prev => prev + 5)}
                        >
                            <span className="w-8 h-px bg-[#D497FF]/20"></span>
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

            <CommonModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title="Xóa bình luận?"
                message="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bình luận này không?"
                confirmText="Vẫn xóa"
                icon={Trash2}
                variant="danger"
            />

            <ReportCommentModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleConfirmReport}
                commentContent={comment.content}
                authorName={displayName}
                isLoading={isReporting}
            />
        </div>
    );
}
