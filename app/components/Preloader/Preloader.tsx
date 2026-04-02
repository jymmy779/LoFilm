"use client"

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/app/context/LoadingContext";

export default function Preloader() {
    const { isLoading } = useLoading();

    useEffect(() => {
        if (!isLoading) {
            document.body.style.overflow = "auto";
        } else {
            document.body.style.overflow = "hidden";
        }
    }, [isLoading]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ 
                        y: "-100%",
                        transition: { duration: 0.8, ease: [0.7, 0, 0.3, 1] }
                    }}
                    className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0a1628] pointer-events-auto"
                >
                    {/* Progress tracking line at top */}
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#f5a623] to-transparent shadow-[0_0_10px_#f5a623]"
                    />

                    <div className="relative flex flex-col items-center">
                        {/* Logo pulsing with a glow */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="mb-10 relative"
                        >
                            <motion.div
                                animate={{ 
                                    scale: [1, 1.1, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute inset-0 bg-[#f5a623]/20 blur-2xl rounded-full"
                            />
                            <img
                                src="/lofilm_logo.png"
                                alt="LoFilm"
                                className="h-16 md:h-24 lg:h-28 object-contain relative z-10"
                            />
                        </motion.div>

                        {/* Modern High-Performance CSS Spinner */}
                        <div className="relative">
                            <div className="w-12 h-12 border-[3px] border-white/5 border-t-[#f5a623] rounded-full animate-spin-smooth will-change-transform transform-gpu" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-[#f5a623] rounded-full shadow-[0_0_10px_#f5a623] animate-pulse" />
                            </div>
                        </div>

                        <style jsx>{`
                            @keyframes spin-smooth {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                            .animate-spin-smooth {
                                animation: spin-smooth 0.8s linear infinite;
                            }
                        `}</style>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-8 flex flex-col items-center gap-2"
                        >
                            <span className="text-white/60 text-[10px] font-bold tracking-[0.3em] uppercase">
                                Trải nghiệm điện ảnh
                            </span>
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        className="w-1 h-1 bg-[#f5a623] rounded-full"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
