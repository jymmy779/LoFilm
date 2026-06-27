"use client";

import React, { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import Link from "next/link";
import { FaTelegramPlane } from "react-icons/fa";
import { FaThreads } from "react-icons/fa6";
import { createPortal } from "react-dom";

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MessageModal({ isOpen, onClose }: MessageModalProps) {
    const [mounted, setMounted] = useState(false);
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

    return createPortal(
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 ${isClosing ? 'pointer-events-none' : ''}`}>
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/80 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div 
                className={`relative w-full max-w-sm bg-[#14233e] border border-white/10 rounded-3xl overflow-hidden ${isClosing ? 'animate-pop-out' : 'animate-pop-in'}`}
            >
                <div className="p-5 md:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 md:mb-5">
                        <div className="flex items-center gap-2.5 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                                <MessageCircle className="text-pink-400 w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-bold text-white">Kết nối với tụi mình 🚀</h3>
                                <p className="text-[11px] md:text-sm text-white/50">Cần phim gì hay lỗi web cứ í ới nhé!</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer shrink-0"
                        >
                            <X className="w-4 h-4 md:w-4 md:h-4" />
                        </button>
                    </div>

                    <div className="space-y-2.5 md:space-y-3 mt-4 md:mt-6">
                        <a 
                            href="https://t.me/ponpornsec"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-[#229ED9]/10 border border-white/5 hover:border-[#229ED9]/30 group transition-all"
                        >
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#229ED9] flex items-center justify-center shrink-0">
                                <FaTelegramPlane className="text-white -ml-0.5 md:-ml-1 w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm md:text-base font-semibold text-white/90 group-hover:text-white transition-colors">Telegram</span>
                                <span className="text-[11px] md:text-xs text-white/40">Nhắn lẹ cho admin qua Tele</span>
                            </div>
                        </a>
                        
                        <a 
                            href="https://www.threads.com/@lofilm_adm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 group transition-all"
                        >
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black border border-white/20 flex items-center justify-center shrink-0">
                                <FaThreads className="text-white w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm md:text-base font-semibold text-white/90 group-hover:text-white transition-colors">Threads</span>
                                <span className="text-[11px] md:text-xs text-white/40">Thả nhẹ 1 chiếc bình luận</span>
                            </div>
                        </a>

                        <Link
                            href="/lien-he"
                            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 group transition-all"
                        >
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                                <MessageCircle className="text-white w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm md:text-base font-semibold text-white/90 group-hover:text-white transition-colors">Biểu mẫu Website</span>
                                <span className="text-[11px] md:text-xs text-white/40">Gửi tâm thư trực tiếp cho admin</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
