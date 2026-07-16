"use client";

import { useEffect, useState } from "react";
import { Zap, Play } from "lucide-react";
import axios from "axios";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { globalCache } from "@/app/utils/globalCache";

interface TickerComment {
    id: string;
    user: string;
    avatar: string | null;
    content: string;
    movie: string;
    slug: string;
    isOwner?: boolean;
}

function TickerAvatar({ avatar, name }: { avatar: string | null; name: string }) {
    const [imgError, setImgError] = useState(false);
    const hasAvatar = avatar && !imgError;

    return (
        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 relative">
            {hasAvatar ? (
                <img
                    src={avatar!}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : null}
            <div
                className="w-full h-full flex items-center justify-center bg-white/5 absolute inset-0"
                style={{ display: hasAvatar ? 'none' : 'flex' }}
            >
                <span className="text-[10px] font-bold text-white/40">
                    {name.charAt(0).toUpperCase()}
                </span>
            </div>
        </div>
    );
}

export default function NewCommentsTicker() {
    const [comments, setComments] = useState<TickerComment[]>(() => globalCache.getRaw<TickerComment[]>("social-new-comments") || []);
    const [loading, setLoading] = useState(() => !globalCache.has("social-new-comments"));
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const loadNewestComments = async () => {
            try {
                const res = await axios.get("/api/social/new-comments", { signal: controller.signal });
                if (res.data && Array.isArray(res.data)) {
                    if (res.data.length > 0) {
                        setComments(res.data);
                        globalCache.set("social-new-comments", res.data);
                    } else if (!globalCache.has("social-new-comments")) {
                        setComments([]);
                    }
                }
            } catch (err) {
                if (!axios.isCancel(err)) {
                    console.error("Error loading newest comments:", err);
                }
            } finally {
                setLoading(false);
            }
        };

        loadNewestComments();

        return () => controller.abort();
    }, []);

    // Ticker animation loop
    useEffect(() => {
        if (comments.length === 0) return;

        const interval = setInterval(() => {
            setIsTransitioning(true);

            setTimeout(() => {
                setComments(prev => {
                    if (prev.length === 0) return prev;
                    const first = prev[0];
                    const rest = prev.slice(1);
                    return [...rest, first];
                });
                setIsTransitioning(false);
            }, 1000); // Match transition-duration
        }, 4000);

        return () => clearInterval(interval);
    }, [comments.length]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-4 md:mb-6">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                <h3 className="font-bold uppercase tracking-wider text-xs sm:text-sm">Bình luận mới</h3>
            </div>

            <div className="h-[336px] overflow-hidden relative">
                {loading ? (
                    // Beautiful Skeleton Loader to match exact ticker cards
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="p-3 bg-white/[0.03] rounded-xl border border-white/5 h-[75px] flex flex-col justify-center shrink-0 animate-pulse"
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-6 h-6 rounded-full bg-white/5 shrink-0" />
                                    <div className="h-3 bg-white/5 rounded w-16" />
                                    <div className="h-3 bg-white/5 rounded w-24" />
                                </div>
                                <div className="h-3 bg-white/5 rounded w-32 ml-8" />
                            </div>
                        ))}
                    </div>
                ) : comments.length > 0 ? (
                    <div
                        className={`flex flex-col gap-3 ${isTransitioning ? 'transition-transform duration-1000 ease-in-out' : 'transition-none'}`}
                        style={{
                            transform: isTransitioning ? 'translateY(calc(-75px - 12px))' : 'translateY(0)'
                        }}
                    >
                        {/* Render + 1 item at the end for smooth rolling ticker effect */}
                        {[...comments, comments[0]].map((comment, index) => (
                            <TransitionLink
                                key={`${comment.id}-${index}`}
                                href={`/phim/${comment.slug}`}
                                className="p-3 bg-white/[0.03] rounded-xl border border-white/5 hover:border-amber-500/40 hover:bg-white/[0.05] transition-all group/comment h-[75px] flex flex-col justify-center shrink-0 block cursor-pointer"
                            >
                                <div className="flex items-center gap-2 mb-1 min-w-0">
                                    <TickerAvatar avatar={comment.avatar} name={comment.user} />
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span className={`text-[11px] font-bold text-white/95 truncate max-w-[80px] group-hover/comment:text-white transition-colors ${comment.isOwner ? 'rgb-text' : ''}`}>
                                            {comment.user}
                                        </span>
                                        <span className="text-[11px] text-white/50 truncate flex-1 italic leading-tight group-hover/comment:text-white/80 transition-colors">
                                            "{comment.content}"
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-white/30 pl-8">
                                    <div className="w-3 h-3 flex items-center justify-center bg-blue-500/10 rounded">
                                        <Play className="w-1.5 h-1.5 text-blue-400/60 fill-blue-400/60" />
                                    </div>
                                    <span className="truncate font-medium text-[12px] group-hover/comment:text-white/60 hover:!text-amber-400 transition-colors tracking-tight">
                                        {comment.movie}
                                    </span>
                                </div>
                            </TransitionLink>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-white/30 py-8 text-center">Chưa có bình luận nào.</div>
                )}
            </div>
        </div>
    );
}