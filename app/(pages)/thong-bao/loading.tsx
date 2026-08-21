import React from "react";
import { Bell } from "lucide-react";

export default function NotificationLoading() {
    return (
        <div className="min-h-screen pt-20 md:pt-28 pb-20 bg-zinc-950 w-full xl:w-[calc(100%+100px)] xl:-ml-[100px]">
            <div className="max-w-4xl mx-auto px-4 md:px-6">
                {/* Header Tĩnh */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            <Bell className="text-amber-400 w-6 h-6 md:w-8 md:h-8" />
                            Thông báo của bạn
                        </h1>
                        <p className="text-sm text-white/50 mt-2">Quản lý và xem lại tất cả các thông báo.</p>
                    </div>
                </div>

                {/* Danh sách thông báo Skeleton */}
                <div className="bg-[#0F1115] border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl p-4 md:p-6 space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.01] border border-white/5 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                            <div className="flex-1 space-y-2.5">
                                <div className="h-4 w-40 bg-white/10 rounded" />
                                <div className="h-4 w-full bg-white/5 rounded" />
                                <div className="h-3 w-24 bg-white/5 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
