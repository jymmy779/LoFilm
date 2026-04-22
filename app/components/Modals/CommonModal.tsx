"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface CommonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon: LucideIcon;
  variant?: "danger" | "warning" | "info" | "success";
}

export default function CommonModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  icon: Icon,
  variant = "danger",
}: CommonModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-500/10",
          iconColor: "text-red-500",
          confirmBg: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/10",
          iconColor: "text-amber-500",
          confirmBg: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
        };
      case "info":
        return {
          iconBg: "bg-blue-500/10",
          iconColor: "text-blue-500",
          confirmBg: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20",
        };
      case "success":
        return {
          iconBg: "bg-green-500/10",
          iconColor: "text-green-500",
          confirmBg: "bg-green-500 hover:bg-green-600 shadow-green-500/20",
        };
      default:
        return {
          iconBg: "bg-red-500/10",
          iconColor: "text-red-500",
          confirmBg: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
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
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${styles.iconBg} flex items-center justify-center mb-3 md:mb-4`}>
                <Icon size={20} className={`${styles.iconColor} md:w-6 md:h-6`} />
              </div>
              <h3 className="text-base md:text-lg font-bold text-white mb-1.5 md:mb-2 uppercase tracking-tight italic">
                {title}
              </h3>
              <p className="text-[11px] md:text-xs text-white/50 mb-5 md:mb-6 px-2 md:px-4 leading-relaxed">
                {message}
              </p>
              <div className="flex w-full gap-2 mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-3 md:px-4 cursor-pointer py-2.5 md:py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all tracking-wider"
                >
                  {cancelText}
                </button>
                {onConfirm && (
                  <button
                    onClick={onConfirm}
                    className={`flex-1 cursor-pointer px-3 md:px-4 py-2.5 md:py-3 rounded-xl ${styles.confirmBg} text-[10px] md:text-xs font-black text-white transition-all active:scale-95 shadow-lg tracking-wider`}
                  >
                    {confirmText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
