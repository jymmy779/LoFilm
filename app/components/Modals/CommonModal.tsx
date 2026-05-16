"use client";

import { LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-500/10",
          iconColor: "text-red-500",
          confirmBg: "bg-red-500 hover:bg-red-600",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/10",
          iconColor: "text-amber-500",
          confirmBg: "bg-amber-500 hover:bg-amber-600",
        };
      case "info":
        return {
          iconBg: "bg-blue-500/10",
          iconColor: "text-blue-500",
          confirmBg: "bg-blue-500 hover:bg-blue-600",
        };
      case "success":
        return {
          iconBg: "bg-green-500/10",
          iconColor: "text-green-500",
          confirmBg: "bg-green-500 hover:bg-green-600",
        };
      default:
        return {
          iconBg: "bg-red-500/10",
          iconColor: "text-red-500",
          confirmBg: "bg-red-500 hover:bg-red-600",
        };
    }
  };

  const styles = getVariantStyles();

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      html.classList.add("no-scroll");
      body.classList.add("no-scroll");
    } else if (shouldRender) {
      setIsClosing(true);
      html.classList.remove("no-scroll");
      body.classList.remove("no-scroll");
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 250);
      return () => {
        clearTimeout(timer);
        html.classList.remove("no-scroll");
        body.classList.remove("no-scroll");
      };
    }
    return () => {
      html.classList.remove("no-scroll");
      body.classList.remove("no-scroll");
    };
  }, [isOpen, shouldRender]);

  if (!mounted || !shouldRender) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center px-4 ${isClosing ? 'pointer-events-none' : ''}`}>
      <div 
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ animationDuration: '0.3s' }}
      />
      <div 
        className={`relative w-[90%] max-w-[320px] md:max-w-xs bg-[#111e31] border border-white/10 rounded-2xl p-5 md:p-6 overflow-hidden ${
          isClosing ? 'animate-pop-out' : 'animate-pop-in'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${styles.iconBg} flex items-center justify-center mb-3 md:mb-4`}>
            <Icon size={20} className={`${styles.iconColor} md:w-6 md:h-6`} />
          </div>
          <h3 className="text-base md:text-lg font-bold text-white mb-1.5 md:mb-2 tracking-tight italic">
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
                className={`flex-1 text-nowrap cursor-pointer px-3 md:px-4 py-2.5 md:py-3 rounded-xl ${styles.confirmBg} text-[10px] md:text-xs font-bold text-white transition-all active:scale-95 tracking-wider`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
