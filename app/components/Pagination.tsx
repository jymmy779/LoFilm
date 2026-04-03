"use client";

import React from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    // Hàm tạo danh sách các trang hiển thị (theo logic hupnos.store)
    const getPaginationPages = () => {
        const pages: (number | string)[] = [];
        
        if (totalPages <= 12) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage < 8) {
                // Đang ở những trang đầu: Hiển thị 10 trang đầu ... 2 trang cuối
                for (let i = 1; i <= 10; i++) pages.push(i);
                pages.push("...");
                pages.push(totalPages - 1);
                pages.push(totalPages);
            } else if (currentPage > totalPages - 8) {
                // Đang ở những trang cuối: Hiển thị 2 trang đầu ... 10 trang cuối
                pages.push(1);
                pages.push(2);
                pages.push("...");
                for (let i = totalPages - 9; i <= totalPages; i++) pages.push(i);
            } else {
                // Đang ở giữa: Hiển thị 1, 2 ... quanh trang hiện tại ... cuối
                pages.push(1);
                pages.push(2);
                pages.push("...");
                for (let i = currentPage - 3; i <= currentPage + 3; i++) pages.push(i);
                pages.push("...");
                pages.push(totalPages - 1);
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="mt-16 flex items-center justify-center gap-1.5 flex-wrap">
            {/* Previous Button */}
            <button
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="min-w-[36px] h-9 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all focus:outline-none"
                aria-label="Previous Page"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>

            {getPaginationPages().map((page, idx) => (
                page === "..." ? (
                    <span key={`dots-${idx}`} className="px-1.5 h-9 flex items-center justify-center text-white/30 text-sm select-none">...</span>
                ) : (
                    <button
                        key={`page-${page}`}
                        onClick={() => onPageChange(Number(page))}
                        className={`min-w-[36px] h-9 px-2 rounded border transition-all duration-300 text-xs md:text-sm font-bold cursor-pointer focus:outline-none ${currentPage === page
                            ? "bg-gradient-to-tr from-[#f5a623] to-[#ffcc33] border-transparent text-[#0a1628] shadow-lg shadow-[#f5a623]/20"
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            }`}
                    >
                        {page}
                    </button>
                )
            ))}

            {/* Next Button */}
            <button
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="min-w-[36px] h-9 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all focus:outline-none"
                aria-label="Next Page"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        </div>
    );
}
