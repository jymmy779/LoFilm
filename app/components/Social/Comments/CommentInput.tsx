"use client";

import { useState, useEffect } from "react";
import { Send, ShieldAlert, CheckCircle2 } from "lucide-react";

interface CommentInputProps {
    onSubmit: (content: string, isSpoiler: boolean) => Promise<void>;
    placeholder?: string;
    isReply?: boolean;
    isEdit?: boolean;
    initialContent?: string;
    initialIsSpoiler?: boolean;
    hasCommented?: boolean;
    userCommentId?: string;
    onCancel?: () => void;
}

export default function CommentInput({
    onSubmit,
    placeholder = "Viết bình luận của bạn...",
    isReply = false,
    isEdit = false,
    initialContent = "",
    initialIsSpoiler = false,
    hasCommented = false,
    userCommentId,
    onCancel
}: CommentInputProps) {
    const [content, setContent] = useState(initialContent);
    const [isSpoiler, setIsSpoiler] = useState(initialIsSpoiler);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(content, isSpoiler);
            setContent("");
            setIsSpoiler(false);
        } catch (error) {
            console.error("Error submitting comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const scrollToMyComment = () => {
        if (!userCommentId) return;
        const targetComment = document.getElementById(`comment-${userCommentId}`);
        if (targetComment) {
            targetComment.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Highlight hiệu ứng nháy nhẹ
            targetComment.style.transition = 'all 0.5s ease-in-out';
            targetComment.style.backgroundColor = 'rgba(212,151,255, 0.1)';
            targetComment.style.transform = 'scale(1.02)';

            setTimeout(() => {
                targetComment.style.backgroundColor = '';
                targetComment.style.transform = '';
            }, 1500);
        }
    };

    if (hasCommented && !isReply && !isEdit) {
        return (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center">
                <div className="w-10 h-10 bg-[#D497FF]/10 rounded-full flex items-center justify-center mx-auto mb-3 text-[#D497FF]">
                    <CheckCircle2 size={20} />
                </div>
                <p className="text-white/60 text-sm font-medium">Bạn đã chia sẻ nhận xét về phim này.</p>
                <div className="flex flex-col gap-2 mt-4 max-w-xs mx-auto">
                    {userCommentId && (
                        <button
                            onClick={scrollToMyComment}
                            className="w-full py-3 bg-[#D497FF] text-black rounded-2xl text-[11px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Send size={12} className="rotate-[-45deg] translate-y-[-1px]" />
                            Đi tới bình luận của tôi
                        </button>
                    )}
                    <p className="text-white/20 text-[10px]">Bạn có thể chỉnh sửa bình luận hiện có của mình bên dưới.</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`comment-form-container ${isReply || isEdit ? 'is-nested mt-3 border-l-2 border-[#D497FF]/30' : ''}`}>
            <textarea
                className="comment-textarea"
                placeholder={isEdit ? "Chỉnh sửa bình luận..." : placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus={isEdit}
                disabled={isSubmitting}
            />
            <div className="form-footer flex items-center justify-between flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setIsSpoiler(!isSpoiler)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer border shrink-0 ${isSpoiler
                        ? 'bg-[#D497FF]/10 border-[#D497FF]/30 text-[#D497FF]'
                        : 'bg-white/5 border-transparent text-white/50 hover:text-white hover:bg-white/10'}`}
                >
                    <span className="text-[11px] sm:text-xs font-semibold select-none whitespace-nowrap">Làm mờ</span>

                    {/* Toggle Switch */}
                    <div className={`relative w-6 h-3.5 rounded-full transition-colors duration-300 shrink-0 ${isSpoiler ? 'bg-[#D497FF]' : 'bg-white/20'}`}>
                        <div className={`absolute top-[2px] left-[2px] w-2.5 h-2.5 bg-white rounded-full transition-transform duration-300 shadow-sm ${isSpoiler ? 'translate-x-[10px]' : 'translate-x-0'}`} />
                    </div>
                </button>

                <div className="flex items-center gap-2">
                    {(isReply || isEdit) && onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-2.5 py-1 text-xs text-white/40 hover:text-white transition-all cursor-pointer"
                        >
                            Hủy
                        </button>
                    )}
                    <button
                        type="submit"
                        className="btn-submit flex items-center gap-1.5"
                        disabled={(!content.trim() || isSubmitting) || (isEdit && content === initialContent && isSpoiler === initialIsSpoiler)}
                    >
                        {isSubmitting ? (
                            <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Send size={13} />
                        )}
                        <span>{isEdit ? "Cập nhật" : (isReply ? "Trả lời" : "Gửi")}</span>
                    </button>
                </div>
            </div>
        </form>
    );
}
