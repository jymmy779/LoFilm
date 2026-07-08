"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

import { MenuItem } from "@/app/components/Header/types";

export interface FilterState {
    country: string;
    type: string;
    category: string;
    year: string;
    sort: string;
    rating: string;
}

interface MovieFilterProps {
    categories: MenuItem[];
    countries: MenuItem[];
    initialFilters?: FilterState;
    initialIsOpen?: boolean;
    onFilterChange: (filters: FilterState) => void;
    onToggle: (isOpen: boolean) => void;
}

const FilterRow = React.memo(({ label, items, activeValue, onSelect, useValueField = false }: any) => {
    return (
        <div className="flex flex-col md:flex-row gap-3">
            <div className="w-28 text-white/40 text-sm font-medium pt-1 shrink-0">{label}:</div>
            <div className="flex flex-wrap gap-x-2 gap-y-2">
                {items.map((item: any) => {
                    const val = useValueField ? item.value : (item.slug ?? item.name);
                    const isActive = activeValue === val;
                    return (
                        <div
                            key={val || item.label || item.name}
                            onClick={() => onSelect(val)}
                            className={`item px-3 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer select-none border ${isActive
                                ? "bg-[#f5a623] border-[#f5a623] text-[#0F1115] font-bold"
                                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-[#f5a623]/50"
                                }`}
                        >
                            {item.name || item.label}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

FilterRow.displayName = "FilterRow";

export default function MovieFilter({
    categories,
    countries,
    initialFilters,
    initialIsOpen = false,
    onFilterChange,
    onToggle
}: MovieFilterProps) {
    const [isOpen, setIsOpen] = useState(initialIsOpen);
    const [filters, setFilters] = useState<FilterState>(initialFilters || {
        country: "",
        type: "",
        category: "",
        year: "",
        sort: "update",
        rating: ""
    });

    const lastToggleTime = useRef(0);
    useEffect(() => {
        if (initialFilters) setFilters(initialFilters);
    }, [initialFilters]);

    useEffect(() => {
        if (initialIsOpen !== isOpen) {
            setIsOpen(initialIsOpen);
        }
    }, [initialIsOpen, isOpen]);

    const years = useMemo(() => Array.from({ length: 17 }, (_, i) => (2026 - i).toString()), []);


    const handleSelect = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        onFilterChange(filters);
    };

    const handleToggle = () => {
        const now = Date.now();
        if (now - lastToggleTime.current < 300) return; // Throttle to prevent animation glitches
        lastToggleTime.current = now;

        const nextState = !isOpen;
        setIsOpen(nextState);
        onToggle(nextState);
    };

    const handleReset = () => {
        const resetFilters = {
            country: "",
            type: "",
            category: "",
            year: "",
            sort: "update",
            rating: ""
        };
        setFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    return (
        <div className="v-filter mb-8">
            {/* Toggle Button */}
            <button
                onClick={handleToggle}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all duration-300 cursor-pointer text-sm font-medium ${isOpen
                    ? "bg-[#f5a623] border-[#f5a623] text-[#0F1115]"
                    : "bg-white/5 border-white/10 text-white hover:border-[#f5a623]/50 hover:bg-white/10"
                    }`}
            >
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"></path>
                </svg>
                <span>Bộ lọc</span>
            </button>

            {/* Filter Content */}
            <div
                className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen
                    ? "grid-rows-[1fr] opacity-100 mt-4 scale-100"
                    : "grid-rows-[0fr] opacity-0 mt-0 scale-[0.98]"
                    }`}
            >
                <div className="overflow-hidden bg-[#0F1115] border border-white/10 rounded-2xl">
                    <div className="p-4 md:p-6 space-y-6">
                        {/* Row: Quốc gia */}
                        <FilterRow
                            label="Quốc gia"
                            items={[{ name: "Tất cả", slug: "" }, ...countries]}
                            activeValue={filters.country}
                            onSelect={(val: string) => handleSelect("country", val)}
                        />

                        {/* Row: Loại phim */}
                        <FilterRow
                            label="Loại phim"
                            items={[
                                { name: "Tất cả", slug: "" },
                                { name: "Phim lẻ", slug: "single" },
                                { name: "Phim bộ", slug: "series" }
                            ]}
                            activeValue={filters.type}
                            onSelect={(val: string) => handleSelect("type", val)}
                        />

                        {/* Row: Thể loại */}
                        <FilterRow
                            label="Thể loại"
                            items={[{ name: "Tất cả", slug: "" }, ...categories]}
                            activeValue={filters.category}
                            onSelect={(val: string) => handleSelect("category", val)}
                        />

                        {/* Row: Năm sản xuất */}
                        <FilterRow
                            label="Năm sản xuất"
                            items={[{ name: "Tất cả", slug: "" }, ...years.map(y => ({ name: y, slug: y }))]}
                            activeValue={filters.year}
                            onSelect={(val: string) => handleSelect("year", val)}
                        />

                        {/* Row: Sắp xếp */}
                        <FilterRow
                            label="Sắp xếp"
                            items={[
                                { name: "Mới nhất", slug: "update" },
                                { name: "Điểm đánh giá", slug: "imdb" },
                                { name: "Lượt xem", slug: "view" }
                            ]}
                            activeValue={filters.sort}
                            onSelect={(val: string) => handleSelect("sort", val)}
                        />

                        {/* Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                            <button
                                onClick={handleApply}
                                className="md:px-6 px-4 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-[#f5a623] to-[#ffcc33] text-[#0F1115] font-bold text-xs md:text-sm flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                Lọc kết quả
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"></path>
                                </svg>
                            </button>
                            <button
                                onClick={handleToggle}
                                className="md:px-6 px-4 py-2 md:py-2.5 text-xs md:text-sm rounded-full border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleReset}
                                className="md:px-6 px-4 py-2 md:py-2.5 text-white/40 text-xs md:text-sm hover:text-[#f5a623] transition-colors cursor-pointer ml-auto"
                            >
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
