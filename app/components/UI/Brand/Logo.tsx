import React from 'react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
    const sizeMap = {
        sm: {
            icon: 'w-6 h-6',
            text: 'text-lg',
            badge: 'text-[9px] px-1.5 py-0.5',
        },
        md: {
            icon: 'w-7 h-7 md:w-8 md:h-8',
            text: 'text-xl md:text-2xl',
            badge: 'text-[10px] px-2 py-0.5',
        },
        lg: {
            icon: 'w-9 h-9 md:w-10 md:h-10',
            text: 'text-2xl md:text-3xl',
            badge: 'text-[11px] px-2.5 py-0.5',
        },
    };

    const currentSize = sizeMap[size];

    return (
        <div className={`flex items-center gap-2.5 select-none ${className}`}>
            {/* Logo Icon */}
            <div className={`relative ${currentSize.icon} flex items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 p-[1.5px] shadow-lg shadow-purple-500/25`}>
                <div className="w-full h-full bg-[#0F1115] rounded-[10px] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-pink-400" fill="currentColor">
                        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm2 2h2v2H6V8zm0 4h2v2H6v-2zm0 4h2v2H6v-2zm10-8h2v2h-2V8zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zM9 9l7 3-7 3V9z" />
                    </svg>
                </div>
            </div>

            {/* Logo Text */}
            <div className="flex items-center gap-1.5">
                <span className={`font-black tracking-tight text-white font-montserrat ${currentSize.text}`}>
                    Cine<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300">Stream</span>
                </span>
                <span className={`hidden sm:inline-block font-semibold tracking-wider uppercase rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 ${currentSize.badge}`}>
                    Showcase
                </span>
            </div>
        </div>
    );
}
