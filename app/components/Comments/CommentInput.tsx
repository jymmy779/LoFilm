"use client";

import { useState, useEffect } from "react";
import { Send, EyeOff, CheckCircle2 } from "lucide-react";

interface CommentInputProps {
    onSubmit: (content: string, isSpoiler: boolean) => Promise<void>;
    placeholder?: string;
    isReply?: boolean;
    isEdit?: boolean;
    initialContent?: string;
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
    hasCommented = false,
    userCommentId,
    onCancel 
}: CommentInputProps) {
    const [content, setContent] = useState(initialContent);
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tự động nhận diện từ khóa Spoiler
    const spoilerKeywords = [
        // Sống chết / Số phận
        "chết", "ngủm", "bay màu", "hẹo", "hi sinh", "tử nạn", "sống sót", "hồi sinh", "bị giết", "tự sát", "tự tử",
        // Thân phận / Phản diện
        "hung thủ", "thủ phạm", "là trùm", "trùm cuối", "boss cuối", "là kẻ", "kẻ đứng sau", "chủ mưu", "gián điệp", "nội gián", "phản bội", "hắc hóa",
        // Plot twist
        "bí mật là", "sự thật là", "thực chất là", "thì ra là", "hóa ra là", "té ra", "cú lừa", "lật kèo", "plot twist", "quay xe",
        // Kết thúc
        "kết thúc", "kết cục", "cuối cùng thì", "cuối cùng cũng", "kết phim", "đoạn cuối", "khúc cuối", "cảnh cuối", "tập cuối", "after credit",
        // Từ lóng
        "spoil", "spoiler", "xì poi", "xì poil", "spoi"
    ];

    useEffect(() => {
        if (!content.trim()) {
            setIsSpoiler(false);
            return;
        }
        
        const lowerContent = content.toLowerCase();
        // Dùng includes để kiểm tra từng từ khóa trong nội dung
        const hasSpoiler = spoilerKeywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
        
        // Tự động bật/tắt checkbox dựa trên nội dung
        setIsSpoiler(hasSpoiler);
    }, [content]);

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
            targetComment.style.backgroundColor = 'rgba(245, 166, 35, 0.1)';
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
                <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500">
                    <CheckCircle2 size={20} />
                </div>
                <p className="text-white/60 text-sm font-medium">Bạn đã chia sẻ nhận xét về phim này.</p>
                <div className="flex flex-col gap-2 mt-4 max-w-xs mx-auto">
                    {userCommentId && (
                        <button
                            onClick={scrollToMyComment}
                            className="w-full py-3 bg-amber-400 text-black rounded-2xl text-[11px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
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
        <form onSubmit={handleSubmit} className={`comment-form-container ${isReply || isEdit ? 'mt-4 border-l-2 border-amber-400/20' : ''}`}>
            <textarea
                className="comment-textarea"
                placeholder={isEdit ? "Chỉnh sửa bình luận..." : placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus={isEdit}
                disabled={isSubmitting}
            />
            <div className="form-footer flex justify-end items-center w-full">
                <div className="flex items-center gap-3">
                    {(isReply || isEdit) && onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-xs text-white/40 hover:text-white transition-all cursor-pointer"
                        >
                            Hủy
                        </button>
                    )}
                    <button
                        type="submit"
                        className="btn-submit flex items-center gap-2"
                        disabled={(!content.trim() || isSubmitting) || (isEdit && content === initialContent)}
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Send size={14} />
                        )}
                        <span>{isEdit ? "Cập nhật" : (isReply ? "Trả lời" : "Gửi")}</span>
                    </button>
                </div>
            </div>
        </form>
    );
}
