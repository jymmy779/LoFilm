"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { useToaster, toast, ToastBar } from "react-hot-toast";
import { X } from "lucide-react";

const TOAST_LIMIT = 3;

interface ToastWrapperProps {
  id: string;
  onHeightUpdate: (id: string, height: number) => void;
  children: React.ReactNode;
  style: React.CSSProperties;
}

const ToastWrapper = React.memo(function ToastWrapper({
  id,
  onHeightUpdate,
  children,
  style,
}: ToastWrapperProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const update = () => {
      const height = el.getBoundingClientRect().height;
      onHeightUpdate(id, height);
    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(el, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [id, onHeightUpdate]);

  return (
    <div ref={elementRef} style={style}>
      {children}
    </div>
  );
});

export default function ClientToaster() {
  const { toasts, handlers } = useToaster({
    duration: 3000,
    success: {
      duration: 2500,
      iconTheme: {
        primary: "#10B981",
        secondary: "#0F1115",
      },
    },
    error: {
      duration: 4000,
      iconTheme: {
        primary: "#EF4444",
        secondary: "#0F1115",
      },
    },
    style: {
      background: "rgba(15, 17, 21, 0.96)",
      color: "#fff",
      border: "1px solid rgba(255, 255, 254, 0.12)",
      borderRadius: "14px",
      boxShadow: "0 12px 30px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(12px)",
      padding: "8px 12px",
      fontSize: "13px",
      fontWeight: "500",
      maxWidth: "calc(100vw - 32px)",
      minHeight: "40px",
    },
  });

  const { startPause, endPause, calculateOffset, updateHeight } = handlers;

  // 1. Giới hạn tối đa TOAST_LIMIT (3 thông báo): Tự động dọn dẹp khi spam
  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  // 2. Chỉ kích hoạt Pause-on-hover trên Desktop có chuột thực thụ (tránh Sticky Hover trên Mobile)
  const handleMouseEnter = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      startPause();
    }
  }, [startPause]);

  const handleMouseLeave = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      endPause();
    }
  }, [endPause]);

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 99999,
        top: "max(16px, env(safe-area-inset-top, 16px))",
        left: 0,
        right: 0,
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center",
        padding: "0 16px",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {toasts.map((t) => {
        const offset = calculateOffset(t, {
          reverseOrder: false,
          gutter: 8,
          defaultPosition: "top-center",
        });

        const isVisible = t.visible;

        return (
          <ToastWrapper
            key={t.id}
            id={t.id}
            onHeightUpdate={updateHeight}
            style={{
              position: "absolute",
              top: 0,
              display: "flex",
              justifyContent: "center",
              width: "100%",
              transform: `translateY(${offset}px)`,
              transition: `all 230ms cubic-bezier(.21,1.02,.73,1)`,
              pointerEvents: isVisible ? "auto" : "none",
              zIndex: isVisible ? 9999 : undefined,
            }}
          >
            <ToastBar toast={t} position="top-center">
              {({ icon, message }) => (
                <div className="flex items-center gap-2.5 w-full max-w-full">
                  {/* Icon */}
                  <div className="shrink-0 flex items-center justify-center w-5 h-5">
                    {icon}
                  </div>

                  {/* Message: Responsive, sắc nét, tự co giãn mượt mà */}
                  <div className="flex-1 text-[12.5px] sm:text-[13.5px] font-medium leading-snug break-words sm:whitespace-nowrap overflow-hidden select-none text-white/95 text-left max-w-[calc(100vw-110px)] sm:max-w-[420px]">
                    {message}
                  </div>

                  {/* Close button: Touch target chuẩn 24x24px, icon 13px */}
                  {t.type !== "loading" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/15 text-white/40 hover:text-white transition-all shrink-0 cursor-pointer active:scale-90"
                      aria-label="Đóng"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              )}
            </ToastBar>
          </ToastWrapper>
        );
      })}
    </div>
  );
}

