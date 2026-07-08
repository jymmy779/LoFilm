"use client";

import React, { useState, useEffect } from "react";

import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // Trạng thái kiểm tra quyền truy cập
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if we have a recovery session
    const checkSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          toast.error("Phiên làm việc trái phép hoặc đã hết hạn!");
          router.push("/dang-nhap");
          return;
        }

        // Nếu ok thì mới cho hiện form
        setIsChecking(false);
      } catch (err) {
        router.push("/dang-nhap");
      }
    };

    checkSession();
  }, [supabase, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Cập nhật mật khẩu thành công!");
      setTimeout(() => {
        router.push("/trang-ca-nhan");
      }, 2000);
    } catch (error: any) {
      if (error.message && error.message.includes("different from the old password")) {
        toast.error("Mật khẩu mới không được giống mật khẩu cũ");
      } else {
        toast.error(error.message || "Đã có lỗi xảy ra");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Giao diện Loading lúc đang kiểm tra quyền truy cập
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115] px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-white/40 text-sm animate-pulse italic">Đang xác thực quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[25vw] h-[25vw] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div
        className="w-full max-w-md bg-[#0F1115]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl animate-fade-in"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Đặt lại mật khẩu</h1>
          <p className="text-white/40 text-sm">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
        </div>

        {isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto scale-110">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-white font-medium">Mật khẩu đã được thay đổi!</p>
            <p className="text-white/40 text-xs">Đang chuyển hướng về trang cá nhân...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu mới"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-400 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-amber-500/20 active:translate-y-0 transition-all cursor-pointer mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Cập nhật mật khẩu
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
