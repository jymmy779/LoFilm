import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { SubtitleTrack } from "@/app/types/movie";

interface DualSubtitleMenuProps {
    subtitles: SubtitleTrack[];
    subtitleSlot1: string | null;
    subtitleSlot2: string | null;
    onSubtitleSlot1Change: (lang: string | null) => void;
    onSubtitleSlot2Change: (lang: string | null) => void;
}

export default function DualSubtitleMenu({
    subtitles,
    subtitleSlot1,
    subtitleSlot2,
    onSubtitleSlot1Change,
    onSubtitleSlot2Change
}: DualSubtitleMenuProps) {
    const [showSubtitles, setShowSubtitles] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowSubtitles(false);
            }
        };

        if (showSubtitles) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSubtitles]);

    if (!subtitles || subtitles.length < 2) return null;

    return (
        <div className="relative flex items-center h-full mr-2" ref={menuRef}>
            <button
                type="button"
                onClick={() => setShowSubtitles(!showSubtitles)}
                className="plyr__control custom-subtitle-toggle hover:bg-white/10 transition-colors rounded px-2 flex items-center outline-none focus:outline-none focus:ring-0"
                style={{ color: showSubtitles ? '#f59e0b' : 'inherit' }}
                title="Phụ đề Song Ngữ"
            >
                <svg className="icon--pressed" role="presentation" focusable="false">
                    <use xlinkHref="#plyr-captions-on"></use>
                </svg>
                <svg className="icon--not-pressed" role="presentation" focusable="false">
                    <use xlinkHref="#plyr-captions-on"></use>
                </svg>
            </button>

            {/* Subtitle Dropdown */}
            {showSubtitles && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute bottom-full right-0 mb-1.5 sm:mb-2 lg:mb-3 w-[180px] sm:w-[220px] lg:w-[300px] max-h-[120px] sm:max-h-[200px] lg:max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full bg-[#0F111A] rounded-lg sm:rounded-xl p-2 sm:p-2.5 lg:p-4 z-[9999] flex flex-col gap-1.5 sm:gap-2 lg:gap-4 pointer-events-auto"
                >
                    {/* Slot 1 */}
                    <div>
                        <p className="text-white/40 !text-[10px] md:!text-[14px] font-bold mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-2">
                            <span className="w-4 border-t border-white/20"></span>
                            Phụ đề 1
                            <span className="flex-1 border-t border-white/20"></span>
                        </p>
                        <div className="flex flex-col gap-1">
                            {subtitles.map(track => {
                                const isActive = subtitleSlot1 === track.lang;
                                const isDisabled = subtitleSlot2 === track.lang;
                                return (
                                    <button
                                        key={track.lang}
                                        disabled={isDisabled}
                                        onClick={() => onSubtitleSlot1Change(isActive ? null : track.lang)}
                                        className={`relative w-full flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 rounded-md sm:rounded-lg !text-[10px] md:!text-[14px] text-left outline-none focus:outline-none focus:ring-0 border border-transparent
                                            ${isDisabled
                                                ? 'opacity-30 cursor-not-allowed text-white/40'
                                                : isActive
                                                    ? 'bg-amber-500/10 text-amber-400 cursor-pointer'
                                                    : 'text-white/80 hover:bg-white/10 hover:text-white cursor-pointer'
                                            }`}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full border flex-shrink-0"
                                            style={{
                                                background: isActive ? '#f59e0b' : 'transparent',
                                                borderColor: isActive ? '#f59e0b' : 'rgba(255,255,255,0.3)'
                                            }}
                                        />
                                        <span className="font-medium pr-12 sm:pr-16">{track.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Slot 2 */}
                    <div>
                        <p className="text-white/40 !text-[10px] md:!text-[14px] font-bold mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-2">
                            <span className="w-4 border-t border-white/20"></span>
                            Phụ đề 2 (Song Ngữ)
                            <span className="flex-1 border-t border-white/20"></span>
                        </p>
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => onSubtitleSlot2Change(null)}
                                className={`w-full flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 rounded-md sm:rounded-lg !text-[10px] md:!text-[14px] text-left cursor-pointer outline-none focus:outline-none focus:ring-0 border border-transparent
                                    ${subtitleSlot2 === null
                                        ? 'bg-white/10 text-white/90'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border flex-shrink-0"
                                    style={{ background: subtitleSlot2 === null ? 'rgba(255,255,255,0.8)' : 'transparent', borderColor: 'rgba(255,255,255,0.3)' }}
                                />
                                <span className="font-medium">Tắt phụ đề 2</span>
                            </button>
                            {subtitles.map(track => {
                                const isActive = subtitleSlot2 === track.lang;
                                const isDisabled = subtitleSlot1 === track.lang;
                                return (
                                    <button
                                        key={track.lang}
                                        disabled={isDisabled}
                                        onClick={() => onSubtitleSlot2Change(isActive ? null : track.lang)}
                                        className={`relative w-full flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 rounded-md sm:rounded-lg !text-[10px] md:!text-[14px] text-left outline-none focus:outline-none focus:ring-0 border border-transparent
                                            ${isDisabled
                                                ? 'opacity-30 cursor-not-allowed text-white/40'
                                                : isActive
                                                    ? 'bg-amber-500/10 text-amber-400 cursor-pointer'
                                                    : 'text-white/80 hover:bg-white/10 hover:text-white cursor-pointer'
                                            }`}
                                    >
                                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border flex-shrink-0"
                                            style={{
                                                background: isActive ? '#f59e0b' : 'transparent',
                                                borderColor: isActive ? '#f59e0b' : 'rgba(255,255,255,0.3)'
                                            }}
                                        />
                                        <span className="font-medium pr-12 sm:pr-16">{track.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
