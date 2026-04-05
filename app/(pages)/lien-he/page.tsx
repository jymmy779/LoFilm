import React from 'react';
import { Mail, Send, MessageSquare, Phone, Globe } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111b33] to-[#0d162b] text-white/80 pt-32 pb-20 md:pt-40 md:pb-32 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-3 tracking-tighter uppercase italic">Liên hệ với chúng tôi</h1>
          <p className="text-white/30 text-[10px] md:text-sm max-w-xl mx-auto uppercase tracking-widest">
            Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp, báo lỗi hoặc yêu cầu hợp tác từ bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="bg-[#16213e] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-amber-400/20 transition-all group shadow-xl">
              <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Mail size={18} />
              </div>
              <h3 className="text-sm md:text-base font-bold text-white mb-2 uppercase tracking-widest">Email hỗ trợ</h3>
              <p className="text-white/20 text-[10px] md:text-xs mb-3">Gửi thư cho chúng tôi nếu bạn có bất kỳ thắc mắc nào.</p>
              <a href="mailto:janencl1125@gmail.com" className="text-amber-400 font-bold text-xs md:text-sm hover:underline break-all">janencl1125@gmail.com</a>
            </div>

            <div className="bg-[#16213e] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-blue-400/20 transition-all group shadow-xl">
              <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Send size={18} />
              </div>
              <h3 className="text-sm md:text-base font-bold text-white mb-2 uppercase tracking-widest">Telegram</h3>
              <p className="text-white/20 text-[10px] md:text-xs mb-3">Kết nối nhanh nhất qua kênh cộng đồng.</p>
              <a href="#" className="text-blue-400 font-bold text-xs md:text-sm hover:underline">@LoFilmSupport</a>
            </div>

            <div className="bg-[#16213e] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-purple-400/20 transition-all group shadow-xl">
              <div className="w-10 h-10 bg-purple-400/10 rounded-xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                < Globe size={18} />
              </div>
              <h3 className="text-sm md:text-base font-bold text-white mb-2 uppercase tracking-widest">Mạng xã hội</h3>
              <div className="flex gap-2 mt-3">
                <a href="#" className="p-2 bg-white/5 rounded-lg text-white/30 hover:text-white transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="p-2 bg-white/5 rounded-lg text-white/30 hover:text-white transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form Box */}
          <div className="lg:col-span-2 bg-[#16213e] border border-white/5 p-6 md:p-12 rounded-3xl md:rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="mb-6 md:mb-10">
              <h2 className="text-lg md:text-xl font-bold text-white mb-2 uppercase tracking-widest">Gửi lời nhắn</h2>
              <p className="text-white/20 text-[10px] md:text-xs italic">Điền đầy đủ thông tin bên dưới để chúng tôi có thể liên hệ lại sớm nhất.</p>
            </div>

            <form className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-xs md:text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-amber-400/30 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-xs md:text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-amber-400/30 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Chủ đề</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs md:text-sm text-white/50 focus:outline-none focus:border-amber-400/30 transition-all appearance-none cursor-pointer">
                  <option className="bg-[#111b33]">Báo lỗi phim</option>
                  <option className="bg-[#111b33]">Yêu cầu phim mới</option>
                  <option className="bg-[#111b33]">Ý kiến đóng góp</option>
                  <option className="bg-[#111b33]">Hợp tác/Quảng cáo</option>
                </select>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nội dung tin nhắn</label>
                <textarea
                  rows={4}
                  placeholder="Hãy cho chúng tôi biết bạn đang nghĩ gì..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-xs md:text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-amber-400/30 transition-all resize-none font-medium"
                ></textarea>
              </div>

              <button
                type="button"
                className="w-full bg-amber-400 cursor-pointer hover:bg-amber-500 text-black font-bold py-3 md:py-4 rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-[0.98] shadow-lg shadow-amber-400/5 uppercase tracking-widest"
              >
                Gửi tin nhắn ngay
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
