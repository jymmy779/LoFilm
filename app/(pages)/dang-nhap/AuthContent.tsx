"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AuthContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const translateError = (error: string) => {
    if (error.includes("Invalid login credentials")) return "Email hoặc mật khẩu không chính xác!";
    if (error.includes("Email not confirmed")) return "Email của bạn chưa được xác thực. Vui lòng kiểm tra hộp thư!";
    if (error.includes("User already registered")) return "Email này đã được đăng ký bởi người dùng khác!";
    if (error.includes("Password should be at least 6 characters")) return "Mật khẩu phải có ít nhất 6 ký tự!";
    if (error.includes("rate limit exceeded")) return "Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau!";
    return "Đã có lỗi xảy ra, vui lòng thử lại!";
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(translateError(error.message));
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(translateError(error.message));
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Handle Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Chào mừng bạn trở lại!");
        router.push("/");
        router.refresh();
      } else {
        // Validation
        if (password.length < 6) {
          toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Mật khẩu xác nhận không khớp!");
          setIsLoading(false);
          return;
        }

        // Handle Sign Up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error("Auth error:", error.message);
      toast.error(translateError(error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-start justify-center pt-32 md:pt-40 pb-20 px-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[25vw] h-[25vw] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#14233e]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Header Tabs */}
        <div className="flex justify-center mb-8 relative">
          <div className="flex bg-white/5 p-1 rounded-2xl w-full border border-white/5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${isLogin ? "bg-amber-400 text-black" : "text-white/60 hover:text-white"
                }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${!isLogin ? "bg-amber-400 text-black" : "text-white/60 hover:text-white"
                }`}
            >
              Đăng ký
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
          </h2>
          <p className="text-white/40 text-sm">
            {isLogin ? "Cùng LoFilm tiếp tục cuộc hành trình điện ảnh của bạn." : "Trở thành thành viên và khám phá kho phim khổng lồ."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
                key="fullname-input"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Họ và tên của bạn"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Mật khẩu" : "Tạo mật khẩu"}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm"
            />
          </div>

          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden"
                key="confirm-password-input"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-amber-500/20 active:translate-y-0 transition-all cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Hoặc tiếp tục với</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 py-3.5 border border-white/10 rounded-2xl text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all text-sm font-medium cursor-pointer group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.82z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button 
            type="button"
            onClick={handleFacebookLogin}
            className="flex items-center justify-center gap-3 py-3.5 border border-white/10 rounded-2xl text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all text-sm font-medium cursor-pointer group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
            </svg>
            Facebook
          </button>
        </div>

        {isLogin && (
          <div className="mt-8 text-center">
            <button className="text-white/30 hover:text-white text-xs transition-colors cursor-pointer">
              Quên mật khẩu?
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
