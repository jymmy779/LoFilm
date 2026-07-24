"use client";

import React, { useState, useEffect, Suspense } from "react";
import { KeyRound, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

function OtpVerificationContent() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const supabase = createClient();

  useEffect(() => {
    if (!email) {
      toast.error("Thiếu thông tin email!");
      router.push("/quen-mat-khau");
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (otp.length !== 6) {
      toast.error("Mã xác thực phải gồm đúng 6 số!");
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });

      if (error) {
        throw error;
      }

      toast.success("Xác thực thành công!");
      router.push("/dat-lai-mat-khau");
    } catch (error: any) {
      if (error.message.includes("Token has expired or is invalid")) {
        toast.error("Mã xác thực không hợp lệ hoặc đã hết hạn!");
      } else {
        toast.error(error.message || "Đã có lỗi xảy ra!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || countdown > 0) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw error;
      }

      toast.success("Đã gửi lại mã xác thực!");
      setCountdown(60); // 60 seconds countdown
    } catch (error: any) {
      if (error.message && (error.message.includes("rate limit") || error.message.includes("security purposes"))) {
        toast.error("Vui lòng đợi khoảng 1 phút rồi mới yêu cầu gửi lại mã nhé!");
      } else {
        toast.error("Không thể gửi lại mã, vui lòng thử lại sau!");
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="w-full max-w-md bg-[#0F1115]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl animate-fade-in relative z-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Nhập mã xác thực</h1>
      </div>

      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <KeyRound size={18} />
          </div>
          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Chỉ cho phép nhập số
            placeholder="Mã xác thực 6 số"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm text-center text-lg font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.length !== 6}
          className="w-full bg-amber-400 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-amber-500/20 active:translate-y-0 transition-all cursor-pointer mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              Xác nhận mã
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={handleResendCode}
          disabled={isResending || countdown > 0}
          className="inline-flex items-center gap-2 text-amber-400/80 hover:text-amber-400 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : "Gửi lại mã xác thực"}
        </button>

        <Link href="/quen-mat-khau" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} />
          Đổi Email khác
        </Link>
      </div>
    </div>
  );
}

export default function OtpVerificationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[25vw] h-[25vw] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <Suspense fallback={
        <div className="w-full max-w-md bg-[#0F1115]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
        </div>
      }>
        <OtpVerificationContent />
      </Suspense>
    </div>
  );
}
