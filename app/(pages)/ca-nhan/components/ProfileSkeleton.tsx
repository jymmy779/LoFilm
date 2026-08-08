"use client";

import React from "react";

export default function ProfileSkeleton() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center w-full xl:w-[calc(100%+100px)] xl:-ml-[100px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-medium text-sm">Đang tải...</p>
            </div>
        </div>
    );
}
