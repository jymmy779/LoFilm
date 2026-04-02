"use client"

export default function MemberButton() {
    return (
        <button className="flex items-center cursor-pointer gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-[#FED877] to-[#F5A623] text-[#0A1628] font-bold text-xs md:text-sm shadow-[0_4px_15px_rgba(245,166,35,0.3)] hover:shadow-[0_8px_25px_rgba(245,166,35,0.5)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden relative group/btn">
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="14" height="14" fill="currentColor" className="relative z-10">
                <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7c0-98.5-79.8-178.3-178.3-178.3H178.3z" />
            </svg>
            <span className="relative z-10">Thành viên</span>
        </button>
    );
}
