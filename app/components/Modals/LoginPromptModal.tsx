"use client";

import { LogIn } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);

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

    const handleLogin = () => {
        onClose();
        router.push("/dang-nhap");
    };

    if (!mounted || !shouldRender) return null;

    return createPortal(
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center px-4 ${isClosing ? 'pointer-events-none' : ''}`}>
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/60 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
                style={{ animationDuration: '0.3s' }}
            />
            <div
                className={`relative w-[90%] max-w-[320px] md:max-w-xs bg-[#0F1115] border border-white/10 rounded-2xl p-5 md:p-6 overflow-hidden ${isClosing ? 'animate-pop-out' : 'animate-pop-in'
                    }`}
            >
                <div className="flex flex-col items-center text-center">
                    {/* Avatar Icon */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 border-2 border-dashed border-amber-400/30 flex items-center justify-center mb-3 md:mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/60">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-white mb-1.5 md:mb-2 tracking-tight">
                        Bạn chưa đăng nhập
                    </h3>
                    <p className="text-[11px] md:text-xs text-white/50 mb-5 md:mb-6 px-2 md:px-4 leading-relaxed">
                        Vui lòng đăng nhập để sử dụng tính năng này
                    </p>

                    <div className="flex w-full gap-2 mt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-white/40 transition-all tracking-wider hover:text-white hover:bg-white/10 cursor-pointer"
                        >
                            Để sau
                        </button>
                        <button
                            onClick={handleLogin}
                            className="flex-1 text-nowrap px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[10px] md:text-xs font-bold text-[#0F1115] transition-all tracking-wider flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer hover:from-amber-300 hover:to-amber-400"
                        >
                            <LogIn size={14} />
                            Đăng nhập ngay
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}