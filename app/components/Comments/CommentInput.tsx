"use client";

import { useState, useEffect } from "react";
import { Send, EyeOff } from "lucide-react";

interface CommentInputProps {
    onSubmit: (content: string, isSpoiler: boolean) => Promise<void>;
    placeholder?: string;
    isReply?: boolean;
    onCancel?: () => void;
}

export default function CommentInput({ onSubmit, placeholder = "Viết bình luận của bạn...", isReply = false, onCancel }: CommentInputProps) {
    const [content, setContent] = useState("");
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

    return (
        <form onSubmit={handleSubmit} className={`comment-form-container ${isReply ? 'mt-4 border-l-2 border-amber-400/20' : ''}`}>
            <textarea
                className="comment-textarea"
                placeholder={placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
            />
            <div className="form-footer flex justify-end items-center w-full">
                <div className="flex items-center gap-3">
                    {isReply && onCancel && (
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
                        disabled={!content.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Send size={14} />
                        )}
                        <span>{isReply ? "Trả lời" : "Gửi"}</span>
                    </button>
                </div>
            </div>
        </form>
    );
}
