"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Share2 } from "lucide-react";
import { FaFacebookF, FaTwitter, FaTelegramPlane } from "react-icons/fa";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    movieName: string;
    shareUrl: string;
}

export default function ShareModal({ isOpen, onClose, movieName, shareUrl }: ShareModalProps) {
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
            setCanNativeShare(true);
        }
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
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

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Đã sao chép liên kết!");
        } catch (err) {
            console.error("Failed to copy", err);
            toast.error("Không thể sao chép liên kết");
        }
    };

    const handleShare = (platform: string) => {
        const text = encodeURIComponent(`Xem phim ${movieName} siêu hay tại đây:`);
        const url = encodeURIComponent(shareUrl);
        let shareLink = "";

        switch (platform) {
            case "facebook":
                shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case "twitter":
                shareLink = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
            case "telegram":
                shareLink = `https://t.me/share/url?url=${url}&text=${text}`;
                break;
        }

        if (shareLink) {
            window.open(shareLink, "_blank", "width=600,height=500,left=200,top=200");
        }
    };

    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: movieName,
                text: `Xem phim ${movieName} siêu hay tại đây:`,
                url: shareUrl,
            });
        } catch (err) {
            console.error("Error native sharing:", err);
        }
    };

    if (!mounted || !shouldRender) return null;

    return createPortal(
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 ${isClosing ? 'pointer-events-none' : ''}`}>
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/80 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div 
                className={`relative w-full max-w-lg bg-[#14233e] border border-white/10 rounded-3xl overflow-hidden ${isClosing ? 'animate-pop-out' : 'animate-pop-in'}`}
            >
                <div className="p-5 md:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 md:mb-5">
                        <div className="flex items-center gap-2.5 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                <Share2 className="text-blue-500 w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg lg:text-xl font-bold text-white uppercase tracking-wider">Chia sẻ phim</h3>
                                <p className="text-[11px] md:text-xs text-white/40">Lan toả bộ phim này tới bạn bè</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer shrink-0"
                        >
                            <X className="w-4 h-4 md:w-4 md:h-4" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <p className="text-white/70 text-sm mb-2 md:mb-4">
                            Bạn đang chia sẻ phim: <span className="text-amber-400 font-semibold">{movieName}</span>
                        </p>

                        <label className="block text-white text-[13px] md:text-sm font-medium mb-2.5 md:mb-3">Mạng xã hội:</label>
                        {/* Social Buttons */}
                        <div className={`grid ${canNativeShare ? 'grid-cols-4' : 'grid-cols-3'} gap-2 md:gap-3`}>
                            <button 
                                onClick={() => handleShare("facebook")}
                                className="flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-[#1877F2]/10 border border-white/5 hover:border-[#1877F2]/30 group transition-all"
                            >
                                <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
                                    <FaFacebookF className="text-white w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-white/70 group-hover:text-white transition-colors">Facebook</span>
                            </button>
                            
                            <button 
                                onClick={() => handleShare("telegram")}
                                className="flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-[#229ED9]/10 border border-white/5 hover:border-[#229ED9]/30 group transition-all"
                            >
                                <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#229ED9] flex items-center justify-center shrink-0">
                                    <FaTelegramPlane className="text-white -ml-0.5 w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-white/70 group-hover:text-white transition-colors">Telegram</span>
                            </button>

                            <button 
                                onClick={() => handleShare("twitter")}
                                className="flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 group transition-all"
                            >
                                <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-black flex items-center justify-center border border-white/20 shrink-0">
                                    <FaTwitter className="text-white w-[15px] h-[15px] md:w-[18px] md:h-[18px]" />
                                </div>
                                <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-white/70 group-hover:text-white transition-colors">X (Twitter)</span>
                            </button>

                            {canNativeShare && (
                                <button 
                                    onClick={handleNativeShare}
                                    className="flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 group transition-all"
                                >
                                    <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                                        <Share2 className="text-white w-[15px] h-[15px] md:w-[18px] md:h-[18px]" />
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-white/70 group-hover:text-white transition-colors">Khác</span>
                                </button>
                            )}
                        </div>

                        <div className="w-full h-px bg-white/5 my-6" />

                        {/* Copy Link Section */}
                        <div className="space-y-2.5 md:space-y-3">
                            <label className="text-[13px] md:text-sm font-medium text-white">Sao chép liên kết</label>
                            <div className="flex items-center gap-2 bg-[#0a1628] border border-white/10 rounded-xl p-1 md:p-1.5 pl-3 md:pl-4 transition-colors">
                                <input 
                                    type="text" 
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 bg-transparent text-[13px] md:text-sm text-white/90 outline-none w-full"
                                />
                                <button 
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-[13px] md:text-sm font-bold transition-all bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                                >
                                    <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <span>Sao chép</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
