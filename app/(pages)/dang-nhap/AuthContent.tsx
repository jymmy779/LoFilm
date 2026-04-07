"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, ThumbsUp, Star, History as HistoryIcon } from "lucide-react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { usePageTransition } from "@/app/components/Transition/PageTransitionContext";

export default function AuthContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { navigateWithTransition } = usePageTransition();
  const supabase = createClient();

  React.useEffect(() => {
    // 1. Kiểm tra session ngay lập tức khi vào trang
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };
    checkSession();

    // 2. Tải thông tin "Ghi nhớ" từ localStorage
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedRememberMe = localStorage.getItem("rememberMe");

    if (savedEmail) setEmail(savedEmail);
    if (savedRememberMe !== null) setRememberMe(savedRememberMe === "true");

    // 3. Lắng nghe thay đổi trạng thái đăng nhập (để đồng bộ giữa các Tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const translateError = (error: string) => {
    if (error.includes("Invalid login credentials")) return "Email hoặc mật khẩu không chính xác!";
    if (error.includes("Email not confirmed")) return "Email của bạn chưa được xác thực. Vui lòng kiểm tra hộp thư!";
    if (error.includes("User already registered")) return "Email này đã được đăng ký bởi người dùng khác!";
    if (error.includes("Password should be at least 6 characters")) return "Mật khẩu phải có ít nhất 6 ký tự!";
    if (error.includes("rate limit exceeded")) return "Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau!";
    return "Đã có lỗi xảy ra, vui lòng thử lại!";
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

        // Lưu thông tin "Ghi nhớ"
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.setItem("rememberMe", "false");
        }

        toast.success("Chào mừng bạn trở lại!");

        // Lấy trang trước đó từ referrer để giữ transition
        const referrer = typeof document !== "undefined" ? document.referrer : "";
        const isInternal = referrer && referrer.includes(window.location.origin) && !referrer.includes("/dang-nhap");

        if (isInternal) {
          navigateWithTransition(referrer);
        } else {
          navigateWithTransition("/");
        }
        setTimeout(() => router.refresh(), 500);
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
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        
        if (error) {
          // Xử lý trường hợp User đã đăng ký nhưng chưa xác thực (đăng ký lại)
          if (error.message.includes("User already registered") || error.message.includes("is not confirmed")) {
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: email,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              }
            });
            
            if (resendError) throw resendError;
            
            toast.success("Tài khoản này đã tồn tại nhưng chưa xác thực. Một email xác nhận mới đã được gửi đi!", { duration: 5000 });
            setIsLogin(true);
            setIsLoading(false);
            return;
          }
          throw error;
        }

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

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Vui lòng nhập Email trước khi khôi phục mật khẩu!");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dat-lai-mat-khau`,
    });

    if (error) {
      toast.error(translateError(error.message));
    } else {
      toast.success("Link khôi phục mật khẩu đã được gửi tới Email của bạn!");
    }
    setIsLoading(false);
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

        <motion.form
          layout
          onSubmit={handleAuth}
          className="space-y-4"
        >
          {/* Full Name Input - Only for Sign up */}
          <motion.div
            layout
            initial={false}
            animate={{
              height: isLogin ? 0 : "auto",
              opacity: isLogin ? 0 : 1,
              marginBottom: isLogin ? 0 : 16,
              scale: isLogin ? 0.95 : 1,
              pointerEvents: isLogin ? "none" : "auto",
            }}
            transition={{
              height: { duration: 0.35, ease: "circOut" },
              opacity: { duration: 0.2, delay: isLogin ? 0 : 0.1 },
              layout: { duration: 0.35, ease: "circOut" }
            }}
            className="relative overflow-hidden origin-top"
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <User size={18} />
            </div>
            <input
              type="text"
              name="name"
              autoComplete="name"
              required={!isLogin}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Họ và tên của bạn"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm"
            />
          </motion.div>

          <motion.div layout className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Mail size={18} />
            </div>
            <input
              type="email"
              name="email"
              autoComplete="username email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm"
            />
          </motion.div>

          <motion.div layout className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Lock size={18} />
            </div>
            <input
              type="password"
              name="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Mật khẩu" : "Tạo mật khẩu"}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm"
            />
          </motion.div>

          {/* Confirm Password - Only for Sign up */}
          <motion.div
            layout
            initial={false}
            animate={{
              height: isLogin ? 0 : "auto",
              opacity: isLogin ? 0 : 1,
              marginTop: isLogin ? 0 : 16,
              scale: isLogin ? 0.95 : 1,
              pointerEvents: isLogin ? "none" : "auto",
            }}
            transition={{
              height: { duration: 0.35, ease: "circOut" },
              opacity: { duration: 0.2, delay: isLogin ? 0 : 0.1 },
              layout: { duration: 0.35, ease: "circOut" }
            }}
            className="relative overflow-hidden origin-top"
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Lock size={18} />
            </div>
            <input
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              required={!isLogin}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-sm"
            />
          </motion.div>

          {isLogin && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between px-2"
            >
              <label className="flex items-center gap-3 group cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center ${rememberMe ? 'bg-amber-400 border-amber-400 rotate-0' : 'bg-transparent border-white/20 -rotate-12'}`}>
                    <CheckCircle2 size={14} className={`text-black transition-opacity duration-300 ${rememberMe ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  {/* Subtle Glow Effect when checked */}
                  {rememberMe && (
                    <div className="absolute inset-0 bg-amber-400 blur-md opacity-20 -z-10 animate-pulse" />
                  )}
                </div>
                <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">Ghi nhớ đăng nhập</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-amber-400/60 hover:text-amber-400 text-xs transition-colors cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </motion.div>
          )}

          <motion.button
            layout
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-amber-500/20 active:translate-y-0 transition-all cursor-pointer mt-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </motion.form>


        {/* Membership Privileges Grid */}
        <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center group hover:bg-white/5 transition-all">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mx-auto mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={20} />
            </div>
            <div className="text-[12px] font-bold text-white mb-1">Bình luận phim</div>
            <div className="text-[10px] text-white/30 leading-tight">Chia sẻ nhận xét với cộng đồng</div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center group hover:bg-white/5 transition-all">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ThumbsUp size={20} />
            </div>
            <div className="text-[12px] font-bold text-white mb-1">Like / Dislike</div>
            <div className="text-[10px] text-white/30 leading-tight">Bày tỏ cảm xúc với từng tập phim</div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center group hover:bg-white/5 transition-all">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform">
              <HistoryIcon size={20} />
            </div>
            <div className="text-[12px] font-bold text-white mb-1">Lịch sử xem</div>
            <div className="text-[10px] text-white/30 leading-tight">Đồng bộ mọi khoảnh khắc xem phim</div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center group hover:bg-white/5 transition-all">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Star size={20} />
            </div>
            <div className="text-[12px] font-bold text-white mb-1">Đánh giá phim</div>
            <div className="text-[10px] text-white/30 leading-tight">Chấm điểm bộ phim yêu thích</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
