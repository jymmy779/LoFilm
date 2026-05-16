"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0f1115]">
      <div className="relative flex items-center justify-center">
        {/* Outer Glowing Ring - Pulsing */}
        <div className="absolute h-16 w-16 animate-pulse rounded-full border-2 border-[#f5a623]/20 shadow-[0_0_20px_rgba(245,166,35,0.15)]"></div>
        
        {/* Main Spinner Ring */}
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-transparent border-t-[#f5a623] border-r-[#f5a623]/30 shadow-[0_0_15px_rgba(245,166,35,0.4)]"></div>
        
        {/* Center Point */}
        <div className="absolute h-1.5 w-1.5 rounded-full bg-[#f5a623] shadow-[0_0_10px_#f5a623]"></div>
      </div>
    </div>
  );
}
