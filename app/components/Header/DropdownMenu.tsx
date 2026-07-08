"use client"

import TransitionLink from "@/app/components/Transition/TransitionLink";
import { MenuItem } from "./types";

interface DropdownMenuProps {
    id: string;
    label: string;
    items: MenuItem[];
    hrefPrefix: string;
    columns?: number;
    activeMenu: string | null;
    setActiveMenu: (id: string | null) => void;
    closeTimeout: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export default function DropdownMenu({
    id,
    label,
    items,
    hrefPrefix,
    columns = 4,
    activeMenu,
    setActiveMenu,
    closeTimeout,
}: DropdownMenuProps) {
    const open = activeMenu === id;

    const onEnter = () => {
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
        setActiveMenu(id);
    };
    const onLeave = () => {
        closeTimeout.current = setTimeout(() => setActiveMenu(null), 150);
    };

    const rows = Math.ceil(items.length / columns);
    const cols: MenuItem[][] = Array.from({ length: columns }, (_, i) =>
        items.slice(i * rows, i * rows + rows)
    );

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            <button className="flex items-center gap-1 text-[13px] 2xl:text-sm font-medium text-white/80 hover:text-[#f5a623] transition-colors duration-150 cursor-pointer whitespace-nowrap">
                <span>{label}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 320 512"
                    width="9"
                    height="9"
                    fill="currentColor"
                    className={`transition-transform duration-200 mt-[1px] ${open ? "rotate-180" : ""}`}
                >
                    <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z" />
                </svg>
            </button>

            {/* Dropdown panel */}
            <div
                className={`absolute top-full left-0 z-50 pt-[8px] transition-all duration-200 origin-top-left ${open
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-2 pointer-events-none"
                    }`}
            >
                {/* Invisible bridge — covers the mt gap so onMouseLeave doesn't fire */}
                <div className="absolute top-0 left-0 w-full h-[8px]" />

                <div className="min-w-[580px] rounded-[8px] bg-[#12151C] border-t-2 border-[#f5a623] border border-white/5">
                    <div className="grid grid-cols-4 gap-x-4 gap-y-3 p-5">
                        {cols.map((col, colIdx) => (
                            <div key={colIdx} className="flex flex-col gap-3">
                                {col.map((item) => (
                                    <TransitionLink
                                        key={item._id}
                                        href={`${hrefPrefix}/${item.slug}`}
                                        className="text-sm text-white/70 hover:text-[#f5a623] hover:translate-x-1 transition-all duration-150 whitespace-nowrap block"
                                    >
                                        {item.name}
                                    </TransitionLink>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
