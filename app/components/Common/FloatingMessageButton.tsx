"use client";

import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import MessageModal from "@/app/components/Modals/MessageModal";

interface Props {
    contact_telegram?: string;
    contact_threads?: string;
}

export default function FloatingMessageButton({ contact_telegram, contact_threads }: Props) {
    const [showMessageModal, setShowMessageModal] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowMessageModal(true)}
                className="fixed bottom-40 right-4 md:bottom-28 md:right-8 z-[85] group flex items-center justify-center cursor-pointer transition-all duration-300"
                aria-label="Alo admin nghe"
            >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shadow-[0_8px_30px_rgba(225,29,72,0.4)] border border-white/20 flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:shadow-[0_12px_40px_rgba(225,29,72,0.6)]">
                    <MessageCircle size={24} />
                </div>
                
                {/* Tooltip */}
                <div className="absolute right-full mr-4 px-3 py-1.5 bg-black/80 text-white text-[13px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-white/10">
                    Alo admin nghe 🤙
                </div>
            </button>

            <MessageModal 
                isOpen={showMessageModal} 
                onClose={() => setShowMessageModal(false)}
                contact_telegram={contact_telegram}
                contact_threads={contact_threads}
            />
        </>
    );
}
