"use client";

import React, { useState } from "react";
import { X, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieName: string;
  episodeName?: string;
}

const ERROR_TYPES = [
  "Phim không phát được / Link lỗi",
  "Sai tập phim / Thiếu tập",
  "Chất lượng phim kém (mờ, giật)",
  "Lỗi phụ đề / Thuyết minh",
  "Nội dung không đúng mô tả",
  "Lỗi khác"
];

export default function ReportModal({ isOpen, onClose, movieName, episodeName }: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieName,
          episodeName,
          errorType: selectedType,
          description,
        }),
      });

      if (!res.ok) throw new Error("Send failed");

      setIsSuccess(true);
      setTimeout(() => {
        handleReset();
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Report error:", err);
      toast.error("Gửi báo lỗi thất bại, vui lòng thử lại sau!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedType("");
    setDescription("");
    setIsSuccess(false);
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg bg-[#14233e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <AlertCircle className="text-red-500" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">Báo lỗi phim</h3>
                    <p className="text-white/40 text-xs">Giúp chúng tôi cải thiện trải nghiệm của bạn</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <p className="text-white/70 text-sm mb-2 md:mb-4">
                      Bạn đang báo lỗi cho phim: <span className="text-amber-400 font-semibold">{movieName}</span>
                      {episodeName && <span> - <span className="text-amber-400 font-semibold">{episodeName}</span></span>}
                    </p>

                    <label className="block text-white text-sm font-medium mb-3">Chọn loại lỗi:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ERROR_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedType(type)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs transition-all cursor-pointer border ${selectedType === type
                            ? "bg-red-500/10 border-red-500/50 text-red-500 font-bold"
                            : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                            }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedType === type ? "border-red-500" : "border-white/20"
                            }`}>
                            {selectedType === type && <div className="w-2 h-2 rounded-full bg-red-500" />}
                          </div>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-1 md:mb-3">Mô tả thêm (Tùy chọn):</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Chi tiết lỗi bạn gặp phải..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all min-h-[100px] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedType || isSubmitting}
                    className={`w-full py-2 lg:py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-all cursor-pointer ${selectedType && !isSubmitting
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                      }`}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Gửi báo lỗi
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-12 flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/20"
                  >
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <h4 className="text-2xl font-bold text-white mb-2">Đã gửi báo lỗi!</h4>
                  <p className="text-white/60 text-sm max-w-[300px]">
                    Cảm ơn bạn đã đóng góp. Chúng tôi sẽ xử lý lỗi này trong thời gian sớm nhất.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
