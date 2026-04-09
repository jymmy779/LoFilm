"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Kiểm tra vị trí cuộn để hiển thị/ẩn nút
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[90] group flex flex-col items-center gap-1.5 cursor-pointer"
          aria-label="Cuộn lên đầu trang"
        >
          {/* Label text */}
          <span className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] group-hover:text-amber-400 transition-colors duration-300">
            Đầu trang
          </span>

          {/* Round Button */}
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-white via-white to-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/20 flex items-center justify-center text-black transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)]">
            <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform duration-300" />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
