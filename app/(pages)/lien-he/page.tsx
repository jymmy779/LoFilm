import React from 'react';
import { Mail, Send, MessageSquare, Phone, Globe } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white/80 py-20 md:py-32 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-amber-500/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[0%] left-[-10%] w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[100px] -z-10 animate-pulse delay-1000"></div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:text-center md:mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4 tracking-tighter uppercase">Liên hệ với chúng tôi</h1>
          <p className="text-white/40 text-sm md:text-base max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp, báo lỗi hoặc yêu cầu hợp tác từ bạn. Hãy kết nối với LoFilm ngay hôm nay!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="bg-[#14233e]/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-amber-400/30 transition-all group shadow-xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-400/10 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-400 mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <Mail size={20} className="md:w-6 md:h-6" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-white mb-2">Email hỗ trợ</h3>
              <p className="text-white/40 text-xs md:text-sm mb-3 md:mb-4">Gửi thư cho chúng tôi nếu bạn có bất kỳ thắc mắc nào.</p>
              <a href="mailto:janencl1125@gmail.com" className="text-amber-400 font-bold text-sm md:text-base hover:underline break-all">janencl1125@gmail.com</a>
            </div>

            <div className="bg-[#14233e]/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-blue-400/30 transition-all group shadow-xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-400/10 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-400 mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <Send size={20} className="md:w-6 md:h-6" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-white mb-2">Telegram</h3>
              <p className="text-white/40 text-xs md:text-sm mb-3 md:mb-4">Kết nối nhanh nhất qua kênh trao đổi cộng đồng.</p>
              <a href="#" className="text-blue-400 font-bold text-sm md:text-base hover:underline">@LoFilmSupport</a>
            </div>

            <div className="bg-[#14233e]/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-purple-400/30 transition-all group shadow-xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-400/10 rounded-xl md:rounded-2xl flex items-center justify-center text-purple-400 mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                < Globe size={20} className="md:w-6 md:h-6" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-white mb-2">Mạng xã hội</h3>
              <div className="flex gap-3 mt-4">
                <a href="#" className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form Box */}
          <div className="lg:col-span-2 bg-[#14233e]/60 backdrop-blur-xl border border-white/10 p-6 md:p-12 rounded-3xl md:rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="mb-6 md:mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Gửi lời nhắn</h2>
              <p className="text-white/30 text-xs md:text-sm">Điền đầy đủ thông tin bên dưới để chúng tôi có thể liên hệ lại sớm nhất.</p>
            </div>

            <form className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 px-5 md:px-6 text-sm md:text-base text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 px-5 md:px-6 text-sm md:text-base text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Chủ đề</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-5 text-sm md:text-base text-white/70 focus:outline-none focus:border-amber-400/50 transition-all appearance-none cursor-pointer">
                  <option className="bg-[#0f1115]">Báo lỗi phim</option>
                  <option className="bg-[#0f1115]">Yêu cầu phim mới</option>
                  <option className="bg-[#0f1115]">Ý kiến đóng góp</option>
                  <option className="bg-[#0f1115]">Hợp tác/Quảng cáo</option>
                </select>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Nội dung tin nhắn</label>
                <textarea
                  rows={5}
                  placeholder="Hãy cho chúng tôi biết bạn đang nghĩ gì..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 px-5 md:px-6 text-sm md:text-base text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all resize-none"
                ></textarea>
              </div>

              <button
                type="button"
                className="w-full bg-amber-400 cursor-pointer hover:bg-amber-500 text-black font-bold py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-base flex items-center justify-center gap-2 md:gap-3 transition-all hover:scale-[1.01] md:hover:scale-[1.02] active:scale-100 shadow-xl shadow-amber-400/10"
              >
                Gửi tin nhắn ngay
                <Send size={18} className="md:w-5 md:h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
