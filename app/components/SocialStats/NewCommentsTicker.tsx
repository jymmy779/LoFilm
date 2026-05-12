"use client";

import { useEffect, useState } from "react";
import { NEW_COMMENTS } from "@/app/data/social-stats";
import { Zap, Play } from "lucide-react";

export default function NewCommentsTicker() {
    const [comments, setComments] = useState(NEW_COMMENTS);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);

            setTimeout(() => {
                setComments(prev => {
                    const first = prev[0];
                    const rest = prev.slice(1);
                    return [...rest, first];
                });
                setIsTransitioning(false);
            }, 1000); // Thời gian trùng với transition duration
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Bình luận mới</h3>
            </div>

            <div className="h-[336px] overflow-hidden relative">
                <div
                    className={`flex flex-col gap-3 ${isTransitioning ? 'transition-transform duration-1000 ease-in-out' : 'transition-none'}`}
                    style={{
                        transform: isTransitioning ? 'translateY(calc(-75px - 12px))' : 'translateY(0)'
                    }}
                >
                    {/* Render thêm 1 item ở cuối để tạo cảm giác cuộn mượt */}
                    {[...comments, comments[0]].map((comment, index) => (
                        <div
                            key={`${comment.id}-${index}`}
                            className={`p-3 bg-white/[0.03] rounded-xl border border-white/5 hover:border-white/10 transition-all group h-[75px] flex flex-col justify-center shrink-0`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                    {comment.avatar ? (
                                        <img src={comment.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <span className="text-[10px] font-bold text-white/40">{comment.user.charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 min-w-0">
                                    <span className="text-[11px] font-bold text-white/90 line-clamp-1 group-hover:text-white transition-colors">{comment.user}</span>
                                    <span className="text-[11px] text-white/50 line-clamp-1 italic leading-tight group-hover:text-white/80 transition-colors">"{comment.content}"</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-white/30 pl-8">
                                <div className="w-3 h-3 flex items-center justify-center bg-blue-500/10 rounded">
                                    <Play className="w-1.5 h-1.5 text-blue-400/60 fill-blue-400/60" />
                                </div>
                                <span className="truncate font-medium text-[12px] group-hover:text-white/60 transition-colors tracking-tight">{comment.movie}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
