"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/85"
                        style={{ willChange: "opacity" }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-[90%] max-w-[320px] md:max-w-xs bg-[#111e31] border border-white/10 rounded-2xl p-5 md:p-6 overflow-hidden shadow-2xl"
                        style={{ willChange: "transform, opacity" }}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3 md:mb-4">
                                <LogOut size={20} className="text-red-500 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-white mb-1.5 md:mb-2 uppercase tracking-tight">Xác nhận đăng xuất?</h3>
                            <p className="text-[11px] md:text-xs text-white/50 mb-5 md:mb-6 px-2 md:px-4 leading-relaxed">
                                Bạn có chắc chắn muốn kết thúc phiên làm việc này không? Mọi thay đổi chưa lưu sẽ bị mất.
                            </p>
                            <div className="flex w-full gap-2 mt-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-3 md:px-4 cursor-pointer py-2 md:py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] md:text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 transition-all transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 cursor-pointer px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-red-500 text-[11px] md:text-xs font-bold text-white hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
