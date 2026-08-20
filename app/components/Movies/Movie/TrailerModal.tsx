"use client";

import React, { useState, useEffect } from "react";
import { X, Play } from "lucide-react";
import { createPortal } from "react-dom";
import { decodeHtml } from "@/app/utils/textUtils";
import { getYoutubeEmbedUrl } from "@/app/utils/movieUtils";

interface TrailerModalProps {
    isOpen: boolean;
    onClose: () => void;
    movieName: string;
    trailerUrl: string;
}

export default function TrailerModal({ isOpen, onClose, movieName, trailerUrl }: TrailerModalProps) {
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

    if (!mounted || !shouldRender || !trailerUrl) return null;

    const embedUrl = getYoutubeEmbedUrl(trailerUrl);

    return createPortal(
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 ${isClosing ? 'pointer-events-none' : ''}`}>
            {/* Backdrop Overlay */}
            <div 
                className={`absolute inset-0 bg-black/80 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
                style={{ animationDuration: '0.25s' }}
                onClick={onClose}
            />

            {/* Modal Box */}
            <div 
                className={`relative w-full max-w-4xl bg-[#0F1115] border border-white/15 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ${
                    isClosing ? 'animate-pop-out' : 'animate-pop-in'
                }`}
                style={{ animationDuration: '0.25s' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 bg-[#12151C]/90">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#D497FF]/10 flex items-center justify-center border border-[#D497FF]/20 shrink-0">
                            <Play className="text-[#D497FF] fill-[#D497FF] w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white truncate tracking-wide">
                            Trailer: {decodeHtml(movieName)}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer shrink-0"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Video Iframe Container */}
                <div className="relative aspect-video w-full bg-black">
                    {embedUrl ? (
                        <iframe
                            src={embedUrl}
                            className="absolute inset-0 w-full h-full border-0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title={`Trailer ${movieName}`}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                            Không thể tải trailer của phim này
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
