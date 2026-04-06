"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Hammer, Clock, Sparkles } from "lucide-react";

export default function MaintenancePage() {
  const [dots, setDots] = useState("");

  // Prevent scrolling when maintenance mode is active
  useEffect(() => {
    // Save original styles
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Lock scroll
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    
    // Hide header/footer using CSS if they exist in the DOM
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';

    return () => {
      // Restore styles on unmount
      document.body.style.overflow = originalStyle;
      document.body.style.height = "auto";
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  // Animation for the "..." in the message
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0f1115] w-full h-[100dvh] flex items-center justify-center overflow-hidden touch-none">
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-red-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-xl px-6 text-center"
      >
        {/* Logo/Icon Area */}
        <div className="relative mb-8 md:mb-12 flex justify-center">
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          >
            {/* Glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
            <Hammer className="w-12 h-12 md:w-16 md:h-16 text-blue-500 mb-2 relative z-10" />
            <div className="text-white/40 font-bold text-[10px] md:text-xs uppercase tracking-[0.3em]">Under Maintenance</div>
          </motion.div>

          {/* Floating extra elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -top-2 -right-1 md:-top-4 md:-right-2 p-2 md:p-3 rounded-full bg-blue-600/20 backdrop-blur-md border border-blue-500/30"
          >
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-2 -left-1 md:-bottom-4 md:-left-2 p-2 md:p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10"
          >
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-white/60" />
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="space-y-4 md:space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-2 md:mb-4 px-4">
            Website Đang <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Bảo Trì</span>{dots}
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-white/60 leading-relaxed max-w-sm md:max-w-md mx-auto px-4">
            Hệ thống đang được nâng cấp để mang đến cho bạn trải nghiệm tuyệt vời hơn.
            Xin lỗi vì sự bất tiện này!
          </p>

          <div className="pt-6 md:pt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 md:gap-3 px-5 py-2.5 md:px-6 md:py-3 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs md:text-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Dự kiến sẽ quay lại sớm nhất có thể
            </div>

            <div className="text-white/30 text-[10px] md:text-xs mt-6 md:mt-8 border-t border-white/5 pt-6 md:pt-8 w-full max-w-[200px] md:max-w-xs block">
              © 2026 LoFilm. All rights reserved.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Decorative Binary/Text */}
      <div className="fixed top-0 right-0 p-4 md:p-8 text-[8px] md:text-xs font-mono text-white/5 uppercase tracking-[0.5em] select-none hidden sm:block">
        01001100 01001111 01000110 01001001 01001100 01001111
      </div>
    </div>
  );
}
