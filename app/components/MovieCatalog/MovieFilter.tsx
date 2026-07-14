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
    status: string;
    lang: string;
    sortType: string;
    letter: string;
}

interface MovieFilterProps {
    categories: MenuItem[];
    countries: MenuItem[];
    initialFilters?: FilterState;
    initialIsOpen?: boolean;
    onFilterChange: (filters: FilterState) => void;
    onToggle: (isOpen: boolean) => void;
}

const DropdownSelect = React.memo(({ label, value, options, onChange, placeholder = "Tất cả" }: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    return (
        <div ref={dropdownRef} className="relative select-none flex-grow sm:flex-grow-0 min-w-[140px]">
            <div 
                onClick={() => setIsOpen(!isOpen)} 
                className={`flex items-center justify-between gap-2 bg-[#0F1115]/80 hover:bg-white/5 border text-xs md:text-sm rounded-xl px-4 py-2.5 cursor-pointer transition-all duration-200 ${
                    isOpen ? 'border-[#f5a623] shadow-[0_0_10px_rgba(245,166,35,0.1)]' : 'border-white/10'
                }`}
            >
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-white/40 shrink-0">{label}</span>
                    <span className="text-white font-medium truncate">{displayLabel}</span>
                </div>
                <svg 
                    className={`w-3 h-3 text-white/40 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#f5a623]' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Options list */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-full min-w-[180px] bg-[#0F1115] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin z-50 p-1 animate-fade-in-quick">
                    {options.map(opt => {
                        const isActive = opt.value === value;
                        return (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`px-3 py-2 text-xs md:text-sm rounded-lg transition-colors cursor-pointer ${
                                    isActive 
                                    ? "bg-[#f5a623] text-[#0F1115] font-bold" 
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                {opt.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

DropdownSelect.displayName = "DropdownSelect";

export default function MovieFilter({
    categories,
    countries,
    initialFilters,
    initialIsOpen = false,
    onFilterChange,
    onToggle
}: MovieFilterProps) {
    const [isOpen, setIsOpen] = useState(initialIsOpen);

    const defaultFilters: FilterState = useMemo(() => ({
        country: "",
        type: "",
        category: "",
        year: "",
        sort: "update",
        rating: "",
        status: "",
        lang: "",
        sortType: "desc",
        letter: "all"
    }), []);

    const [filters, setFilters] = useState<FilterState>(() => ({
        ...defaultFilters,
        ...initialFilters
    }));

    const lastToggleTime = useRef(0);

    // Sync initial filters
    useEffect(() => {
        if (initialFilters) {
            setFilters(prev => ({
                ...prev,
                ...initialFilters
            }));
        }
    }, [initialFilters]);

    // Sync open state
    useEffect(() => {
        if (initialIsOpen !== isOpen) {
            setIsOpen(initialIsOpen);
        }
    }, [initialIsOpen, isOpen]);

    const years = useMemo(() => Array.from({ length: 17 }, (_, i) => (2026 - i).toString()), []);

    const handleSelect = (key: keyof FilterState, value: string) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            if (key === "type" && value === "single") {
                next.status = ""; // Clear status if we select single movies
            }
            return next;
        });
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
        setFilters(defaultFilters);
        onFilterChange(defaultFilters);
    };

    // Dropdown mappings
    const typeOptions = [
        { label: "Tất cả", value: "" },
        { label: "Phim lẻ", value: "single" },
        { label: "Phim bộ", value: "series" }
    ];

    const sortOptions = [
        { label: "Ngày đăng mới nhất", value: "update" },
        { label: "Điểm đánh giá", value: "imdb" },
        { label: "Lượt xem", value: "view" }
    ];

    const sortTypeOptions = [
        { label: "Giảm dần", value: "desc" },
        { label: "Tăng dần", value: "asc" }
    ];

    const statusOptions = [
        { label: "Tất cả", value: "" },
        { label: "Hoàn thành", value: "completed" },
        { label: "Đang chiếu", value: "ongoing" }
    ];

    const langOptions = [
        { label: "Tất cả", value: "" },
        { label: "Vietsub", value: "vietsub" },
        { label: "Thuyết minh", value: "thuyetminh" },
        { label: "Lồng tiếng", value: "longtieng" }
    ];

    const categoryOptions = useMemo(() => [
        { label: "Tất cả", value: "" },
        ...categories.map(c => ({ label: c.name, value: c.slug || c.name }))
    ], [categories]);

    const countryOptions = useMemo(() => [
        { label: "Tất cả", value: "" },
        ...countries.map(c => ({ label: c.name, value: c.slug || c.name }))
    ], [countries]);

    const yearOptions = useMemo(() => [
        { label: "Tất cả", value: "" },
        ...years.map(y => ({ label: y, value: y }))
    ], [years]);

    // A-Z array
    const letters = useMemo(() => ["all", "#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i).toLowerCase())], []);

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
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"></path>
                </svg>
                <span>Bộ lọc</span>
            </button>

            {/* Filter Content */}
            <div
                className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen
                    ? "grid-rows-[1fr] opacity-100 mt-4 scale-100"
                    : "grid-rows-[0fr] opacity-0 mt-0 scale-[0.98] pointer-events-none"
                    }`}
            >
                <div className="overflow-hidden bg-[#0F1115] border border-white/10 rounded-3xl">
                    <div className="p-5 md:p-8 space-y-6">
                        
                        {/* TIÊU CHÍ LỌC */}
                        <div>
                            <h3 className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3">Tiêu chí lọc</h3>
                            <div className="flex flex-wrap gap-3">
                                <DropdownSelect 
                                    label="Chủ đề" 
                                    value={filters.category} 
                                    options={categoryOptions} 
                                    onChange={(val) => handleSelect("category", val)} 
                                />
                                <DropdownSelect 
                                    label="Quốc gia" 
                                    value={filters.country} 
                                    options={countryOptions} 
                                    onChange={(val) => handleSelect("country", val)} 
                                />
                                {filters.type !== "single" && (
                                    <DropdownSelect 
                                        label="Trạng thái" 
                                        value={filters.status} 
                                        options={statusOptions} 
                                        onChange={(val) => handleSelect("status", val)} 
                                    />
                                )}
                                <DropdownSelect 
                                    label="Năm" 
                                    value={filters.year} 
                                    options={yearOptions} 
                                    onChange={(val) => handleSelect("year", val)} 
                                />
                                <DropdownSelect 
                                    label="Ngôn ngữ" 
                                    value={filters.lang} 
                                    options={langOptions} 
                                    onChange={(val) => handleSelect("lang", val)} 
                                />
                                <DropdownSelect 
                                    label="Sắp xếp" 
                                    value={filters.sort} 
                                    options={sortOptions} 
                                    onChange={(val) => handleSelect("sort", val)} 
                                />
                                <DropdownSelect 
                                    label="Thứ tự" 
                                    value={filters.sortType} 
                                    options={sortTypeOptions} 
                                    onChange={(val) => handleSelect("sortType", val)} 
                                />
                                <DropdownSelect 
                                    label="Loại phim" 
                                    value={filters.type} 
                                    options={typeOptions} 
                                    onChange={(val) => handleSelect("type", val)} 
                                />
                            </div>
                        </div>

                        {/* DANH SÁCH A-Z */}
                        <div>
                            <h3 className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3">Danh sách A-Z</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {letters.map((letter) => {
                                    const isActive = filters.letter === letter;
                                    const isSpecial = letter === "all" || letter === "#";
                                    return (
                                        <button
                                            key={letter}
                                            onClick={() => handleSelect("letter", letter)}
                                            className={`h-8 rounded-lg flex items-center justify-center text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                                                isSpecial ? "px-3" : "w-8"
                                            } ${
                                                isActive
                                                ? "bg-[#f5a623] border-[#f5a623] text-[#0F1115]"
                                                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-[#f5a623]/30"
                                            }`}
                                        >
                                            {letter}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* THỂ LOẠI */}
                        <div>
                            <h3 className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3">Thể loại</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleSelect("category", "")}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                                        filters.category === ""
                                        ? "bg-[#f5a623] border-[#f5a623] text-[#0F1115] font-bold"
                                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-[#f5a623]/30"
                                    }`}
                                >
                                    Tất cả
                                </button>
                                {categories.map((c) => {
                                    const val = c.slug || c.name;
                                    const isActive = filters.category === val;
                                    return (
                                        <button
                                            key={val}
                                            onClick={() => handleSelect("category", val)}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                                                isActive
                                                ? "bg-[#f5a623] border-[#f5a623] text-[#0F1115] font-bold"
                                                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-[#f5a623]/30"
                                            }`}
                                        >
                                            {c.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                            <button
                                onClick={handleApply}
                                className="md:px-7 px-5 py-2.5 md:py-3 rounded-full bg-gradient-to-r from-[#f5a623] to-[#ffcc33] text-[#0F1115] font-bold text-xs md:text-sm flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-amber-500/10"
                            >
                                <span>Tìm Kiếm</span>
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"></path>
                                </svg>
                            </button>
                            <button
                                onClick={handleReset}
                                className="md:px-6 px-4 py-2.5 md:py-3 text-xs md:text-sm rounded-full border border-white/10 text-white/50 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                            >
                                Xóa
                            </button>
                            <button
                                onClick={handleToggle}
                                className="md:px-6 px-4 py-2.5 md:py-3 text-xs md:text-sm rounded-full border border-white/10 text-white/50 hover:bg-white/5 hover:text-white transition-colors cursor-pointer ml-auto"
                            >
                                Đóng
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
