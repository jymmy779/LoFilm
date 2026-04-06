"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Hammer, HardHat, Clock, Sparkles } from "lucide-react";

export default function MaintenancePage() {
  const [dots, setDots] = useState("");

  // Animation for the "..." in the message
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f1115] flex items-center justify-center overflow-hidden">
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2563eb]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ef4444]/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-xl px-6 text-center"
      >
        {/* Logo/Icon Area */}
        <div className="relative mb-12 flex justify-center">
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
            className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          >
            {/* Glow overlay inside the icon box */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
            <Hammer className="w-16 h-16 text-blue-500 mb-2 relative z-10" />
            <div className="text-white/40 font-bold text-xs uppercase tracking-[0.3em]">Under Maintenance</div>
          </motion.div>

          {/* Floating extra elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -top-4 -right-2 p-3 rounded-full bg-blue-600/20 backdrop-blur-md border border-blue-500/30"
          >
            <Sparkles className="w-5 h-5 text-blue-400" />
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-4 -left-2 p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10"
          >
            <Clock className="w-5 h-5 text-white/60" />
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Website Đang <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Bảo Trì</span>{dots}
          </h1>

          <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-md mx-auto">
            Hệ thống đang được nâng cấp để mang đến cho bạn trải nghiệm tuyệt vời hơn.
            Xin lỗi vì sự bất tiện này!
          </p>

          <div className="pt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Dự kiến sẽ quay lại sớm nhất có thể
            </div>

            <div className="text-white/30 text-sm mt-8 border-t border-white/5 pt-8 w-full max-w-xs">
              © 2026 LoFilm. All rights reserved.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Decorative Blur Orbs */}
      <div className="fixed top-0 right-0 p-8 text-xs font-mono text-white/5 uppercase tracking-[0.5em] select-none">
        01001100 01001111 01000110 01001001 01001100 01001101
      </div>
    </div>
  );
}
