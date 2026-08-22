"use client";

import { Flag, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface ReportCommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
    commentContent: string;
    authorName: string;
    isLoading?: boolean;
}

const REPORT_REASONS = [
    "Tiết lộ trước nội dung phim (Spoiler)",
    "Ngôn từ xúc phạm, thô tục hoặc kích động thù địch",
    "Quảng cáo, spam hoặc chứa liên kết độc hại",
    "Thông tin sai lệch, quấy rối hoặc bôi nhọ",
    "Lý do khác..."
];

export default function ReportCommentModal({
    isOpen,
    onClose,
    onSubmit,
    commentContent,
    authorName,
    isLoading = false,
}: ReportCommentModalProps) {
    const [mounted, setMounted] = useState(false);
    const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
    const [customReason, setCustomReason] = useState("");
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
            setSelectedReason(REPORT_REASONS[0]);
            setCustomReason("");
            html.classList.add("no-scroll");
            body.classList.add("no-scroll");
        } else if (shouldRender) {
            setIsClosing(true);
            html.classList.remove("no-scroll");
            body.classList.remove("no-scroll");
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 250);
            return () => {
                clearTimeout(timer);
                html.classList.remove("no-scroll");
                body.classList.remove("no-scroll");
            };
        }
        return () => {
            html.classList.remove("no-scroll");
            body.classList.remove("no-scroll");
        };
    }, [isOpen, shouldRender]);

    if (!mounted || !shouldRender) return null;

    const handleConfirm = () => {
        const finalReason = selectedReason === "Lý do khác..."
            ? (customReason.trim() || "Lý do khác")
            : selectedReason;
        onSubmit(finalReason);
    };

    return createPortal(
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${isClosing ? 'pointer-events-none' : ''}`}>
            {/* Backdrop chuẩn CommonModal & ReportModal */}
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/60 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
                style={{ animationDuration: '0.3s' }}
            />

            {/* Modal Box đồng bộ pop-in / pop-out & background #0F1115 */}
            <div
                className={`relative w-[92%] max-w-md bg-[#0F1115] border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl p-5 md:p-6 ${
                    isClosing ? 'animate-pop-out' : 'animate-pop-in'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                            <Flag size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-tight">Báo cáo bình luận</h3>
                            <p className="text-xs text-white/40">Của {authorName}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4">
                    {/* Trích dẫn bình luận */}
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5 border-l-2 border-l-amber-500/50">
                        <p className="text-xs text-white/60 italic line-clamp-2 leading-relaxed">
                            "{commentContent}"
                        </p>
                    </div>

                    {/* Danh sách lý do (Hiển thị trọn vẹn, không cần cuộn bên trong) */}
                    <div>
                        <label className="block text-xs font-semibold text-white/70 mb-2">
                            Chọn lý do vi phạm:
                        </label>
                        <div className="space-y-1.5">
                            {REPORT_REASONS.map((reason) => (
                                <label
                                    key={reason}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                        selectedReason === reason
                                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold"
                                            : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="report_reason"
                                        checked={selectedReason === reason}
                                        onChange={() => setSelectedReason(reason)}
                                        className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span>{reason}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Ô nhập tùy chỉnh khi chọn "Lý do khác..." */}
                    {selectedReason === "Lý do khác..." && (
                        <div className="animate-fade-in">
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Vui lòng mô tả chi tiết lý do báo cáo..."
                                rows={2}
                                maxLength={200}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
                            />
                        </div>
                    )}
                </div>

                {/* Footer Buttons chuẩn CommonModal */}
                <div className="flex w-full gap-2 mt-5 pt-3 border-t border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 md:py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all tracking-wider cursor-pointer"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading || (selectedReason === "Lý do khác..." && !customReason.trim())}
                        className="flex-1 px-4 py-2.5 md:py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none text-[10px] md:text-xs font-bold text-white transition-all tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span>Gửi báo cáo</span>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
