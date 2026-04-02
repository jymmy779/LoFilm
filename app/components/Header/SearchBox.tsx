"use client"

import { useState } from "react";

interface SearchBoxProps {
    autoFocus?: boolean;
}

export default function SearchBox({ autoFocus }: SearchBoxProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = () => {
        if (searchQuery.trim()) {
            window.location.href = `/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 w-full md:w-[270px] focus-within:md:w-[320px] focus-within:border-[#f5a623]/50 focus-within:bg-white/10 transition-all duration-500 ease-out">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill="currentColor" className="shrink-0 text-white/30">
                <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
            </svg>
            <input
                type="text"
                placeholder="Tìm kiếm phim..."
                autoFocus={autoFocus}
                className="bg-transparent outline-none text-base text-white w-full placeholder:text-white/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleSearch();
                    }
                }}
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery("")}
                    className="shrink-0 text-white/40 hover:text-white transition-colors"
                    aria-label="Xóa tìm kiếm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="11" height="11" fill="currentColor">
                        <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                    </svg>
                </button>
            )}
        </div>
    );
}
