"use client";

import React, { useState } from "react";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Turnstile } from '@marsidev/react-turnstile';
import { useRef } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<any>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập Email!");
      return;
    }
    if (!captchaToken) {
      toast.error("Đang tải Captcha, vui lòng đợi một chút...");
      return;
    }
    setIsLoading(true);

    try {
      // Gửi email chứa mã OTP (Supabase sẽ tự động không gửi nếu email không tồn tại để bảo mật)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        captchaToken,
      });

      if (error) {
        throw error;
      }

      toast.success("Mã xác thực đã được gửi tới Email của bạn!");
      router.push(`/quen-mat-khau/xac-thuc?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      if (error.message && error.message.includes("rate limit")) {
        toast.error("Bạn đã yêu cầu gửi mã quá nhiều lần. Vui lòng đợi 1 phút trước khi thử lại!");
      } else if (error.message && error.message.includes("security purposes")) {
        toast.error("Vui lòng đợi khoảng 1 phút rồi mới yêu cầu gửi mã tiếp nhé!");
      } else {
        toast.error(error.message || "Đã có lỗi xảy ra, vui lòng thử lại sau!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#B366FF]/10 to-transparent rounded-full opacity-60 pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[25vw] h-[25vw] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D497FF]/10 to-transparent rounded-full opacity-60 pointer-events-none" />
      </div>

      <div className="w-full max-w-md bg-[#0F1115]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Quên mật khẩu</h1>
          <p className="text-white/40 text-sm">Nhập email của bạn để nhận mã xác thực.</p>
        </div>

        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email đăng ký"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#D497FF]/50 focus:bg-white/10 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#D497FF] to-[#B366FF] text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-[#D497FF]/20 active:translate-y-0 transition-all cursor-pointer mt-6"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                Gửi mã xác thực
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Turnstile Captcha (Invisible) */}
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
            onSuccess={(token) => setCaptchaToken(token)}
            options={{ size: 'invisible' }}
          />
        </form>

        <div className="mt-6 text-center">
          <Link href="/dang-nhap" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
