"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, X, Sparkles } from "lucide-react";

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export default function ComingSoonModal({
    isOpen,
    onClose,
    title = "Tính năng sắp ra mắt!",
    message = "Chúng mình đang nỗ lực hoàn thiện tính năng này để mang lại trải nghiệm tốt nhất cho bạn. Hãy quay lại sau nhé!"
}: ComingSoonModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-[320px] overflow-hidden bg-[#1a1c1e] border border-white/5 rounded-[2.5rem] p-6 text-center shadow-2xl"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        {/* Icon/Art */}
                        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-pulse" />
                            <div className="relative z-10 w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,166,35,0.3)]">
                                <Hammer className="text-black" size={24} />
                            </div>
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute top-0 -right-1 text-amber-300"
                            >
                                <Sparkles size={20} />
                            </motion.div>
                        </div>

                        {/* Text */}
                        <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-white/60 text-[12px] leading-relaxed mb-6">
                            {message}
                        </p>

                        {/* Button */}
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-[11px] font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Đã hiểu thưa Sếp!
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
