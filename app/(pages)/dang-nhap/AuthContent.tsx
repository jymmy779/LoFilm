"use client";

import React, { useState } from "react";

import { Mail, Lock, User, ArrowRight, ThumbsUp, Star, History as HistoryIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthInput from "@/app/components/Auth/AuthInput";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { usePageTransition } from "@/app/components/Transition/PageTransitionContext";
import CatalogHeader from "../../components/CatalogHeader";
import Container from "../../components/Container";

// Import Sidebar từ đúng thư mục
import SidebarComp from "@/app/components/Sidebar/Sidebar";

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
      // Chúng ta sẽ để logic kiểm tra session ở mount và handleAuth xử lý chuyển hướng
      // Tránh việc gọi push ở đây gây xung đột với transition
      if (event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Xử lý dọn dẹp form khi chuyển tab
  React.useEffect(() => {
    if (!isLogin) {
      // Khi sang tab Đăng ký: xóa sạch mọi thông tin
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
    } else {
      // Khi sang tab Đăng nhập: khôi phục email nếu có "Ghi nhớ", dọn password
      const savedEmail = localStorage.getItem("rememberedEmail");
      const savedRememberMe = localStorage.getItem("rememberMe") === "true";

      if (savedRememberMe && savedEmail) {
        setEmail(savedEmail);
      } else {
        setEmail("");
      }
      setPassword("");
    }
  }, [isLogin]);

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // KIỂM TRA XÁC THỰC EMAIL (BẢO MẬT)
        // Nếu user tồn tại nhưng chưa confirmed email, chặn không cho vào
        if (data.user && !data.user.email_confirmed_at) {
          // Gửi lại email xác nhận tự động để hỗ trợ người dùng
          await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
          });

          // Đăng xuất ngay lập tức để xóa session tạm thời
          await supabase.auth.signOut();
          
          toast.error("Email của bạn chưa được xác thực. Chúng tôi đã gửi lại một email xác nhận mới, vui lòng kiểm tra hộp thư (cả hòm thư Rác)!", {
            duration: 6000,
            icon: '✉️'
          });
          setIsLoading(false);
          return;
        }

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
          navigateWithTransition(referrer, true);
        } else {
          navigateWithTransition("/", true);
        }
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
    <Container className="min-h-[90vh] pt-30 md:pt-40 pb-30 px-4 relative">
      <div className="mb-10 md:mb-12 w-full">
        <CatalogHeader
          title={"Thành viên"}
          showTitle={false}
        />
      </div>

      <div>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
          {/* Main Auth Form Area */}
          <div className="flex-grow w-full flex justify-center">
            <div className="w-full max-w-md bg-[#14233e]/60 border border-white/10 rounded-[32px] p-6 md:p-10 relative overflow-hidden">
              {/* Header Tabs */}
              <div className="flex justify-center mb-8 relative">
                <div className="flex bg-white/5 p-1 rounded-2xl w-full border border-white/10">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all cursor-pointer ${isLogin ? "bg-amber-400 text-black" : "text-white/60 hover:text-white"
                      }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all cursor-pointer ${!isLogin ? "bg-amber-400 text-black" : "text-white/60 hover:text-white"
                      }`}
                  >
                    Đăng ký
                  </button>
                </div>
              </div>

              <div className="relative">
                <div key={isLogin ? 'login' : 'register'} className="animate-fade-in">
                  <div className="text-center mb-8">
                    <h2 className="text-xl md:text-3xl font-bold text-white mb-2">
                      {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
                    </h2>
                    <p className="text-white/40 text-xs md:text-sm">
                      {isLogin ? "Cùng LoFilm tiếp tục cuộc hành trình điện ảnh của bạn." : "Trở thành thành viên và khám phá kho phim khổng lồ."}
                    </p>
                  </div>

                  <form
                    onSubmit={handleAuth}
                    className="space-y-4"
                  >
                    {/* Full Name Input - Only for Sign up */}
                    {!isLogin && (
                      <AuthInput
                        type="text"
                        name="name"
                        autoComplete="name"
                        required={!isLogin}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Họ và tên của bạn"
                        icon={User}
                      />
                    )}

                    <AuthInput
                      type="email"
                      name="email"
                      autoComplete="username email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email của bạn"
                      icon={Mail}
                    />

                    <AuthInput
                      type="password"
                      name="password"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isLogin ? "Mật khẩu" : "Tạo mật khẩu"}
                      icon={Lock}
                    />

                    {/* Confirm Password - Only for Sign up */}
                    {!isLogin && (
                      <AuthInput
                        type="password"
                        name="confirm-password"
                        autoComplete="new-password"
                        required={!isLogin}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Xác nhận mật khẩu"
                        icon={Lock}
                      />
                    )}

                    {isLogin && (
                      <div className="flex items-center justify-between px-2">
                        <label className="flex items-center gap-3 group cursor-pointer select-none">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className={`w-4 h-4 md:w-5 md:h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center ${rememberMe ? 'bg-amber-400 border-amber-400 rotate-0' : 'bg-transparent border-white/20 -rotate-12'}`}>
                              <CheckCircle2 size={12} className={`text-black transition-opacity duration-300 md:hidden ${rememberMe ? 'opacity-100' : 'opacity-0'}`} />
                              <CheckCircle2 size={14} className={`text-black transition-opacity duration-300 hidden md:block ${rememberMe ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                            {/* Subtle Glow Effect when checked */}
                            {rememberMe && (
                              <div className="absolute inset-0 bg-amber-400 opacity-20 -z-10 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[10px] md:text-xs text-white/50 group-hover:text-white/80 transition-colors">Ghi nhớ đăng nhập</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-amber-400/60 hover:text-amber-400 text-[10px] md:text-xs transition-colors cursor-pointer"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-black py-3 md:py-4 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-amber-500/20 active:translate-y-0 transition-all cursor-pointer mt-4"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                          <ArrowRight className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Membership Privileges Grid */}
              <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 md:p-4 text-center group hover:bg-white/5 transition-all">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="text-[12px] font-bold text-white mb-1">Bình luận phim</div>
                  <div className="text-[10px] text-white/30 leading-tight">Chia sẻ nhận xét với cộng đồng</div>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 md:p-4 text-center group hover:bg-white/5 transition-all">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <ThumbsUp size={20} />
                  </div>
                  <div className="text-[12px] font-bold text-white mb-1">Like / Dislike</div>
                  <div className="text-[10px] text-white/30 leading-tight">Bày tỏ cảm xúc với từng tập phim</div>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 md:p-4 text-center group hover:bg-white/5 transition-all">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <HistoryIcon size={20} />
                  </div>
                  <div className="text-[12px] font-bold text-white mb-1">Lịch sử xem</div>
                  <div className="text-[10px] text-white/30 leading-tight">Đồng bộ mọi khoảnh khắc xem phim</div>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 md:p-4 text-center group hover:bg-white/5 transition-all">
                  <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Star size={20} />
                  </div>
                  <div className="text-[12px] font-bold text-white mb-1">Đánh giá phim</div>
                  <div className="text-[10px] text-white/30 leading-tight">Chấm điểm bộ phim yêu thích</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0 mt-10 lg:mt-0">
            <SidebarComp />
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[25vw] h-[25vw] bg-blue-500/10 rounded-full blur-[80px]" />
      </div>
    </Container>
  );
}
