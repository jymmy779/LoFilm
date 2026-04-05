import React from 'react';
import { Mail, Send } from 'lucide-react';

export default function AboutContact() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white/80 py-20 md:py-32 px-4">
      <div className="max-w-4xl mx-auto bg-[#14233e]/60 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 p-6 md:p-12 text-black">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 md:mb-4 italic tracking-tighter">LoFilm.</h1>
          <p className="text-sm md:text-lg font-medium opacity-80 leading-relaxed uppercase tracking-[0.15em] md:tracking-[0.2em]">Khám phá thế giới điện ảnh không giới hạn</p>
        </div>
        
        <div className="p-6 md:p-12 space-y-8 md:space-y-12">
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 underline decoration-amber-400/30 underline-offset-8">Giới thiệu về chúng tôi</h2>
            <div className="space-y-4 leading-relaxed text-sm md:text-base opacity-80">
              <p>LoFilm ra đời với sứ mệnh mang lại trải nghiệm xem phim trực tuyến hiện đại, mượt mà và hoàn toàn miễn phí cho cộng đồng yêu phim Việt Nam.</p>
              <p>Với kho dữ liệu phim đồ sộ, tích hợp trí tuệ nhân tạo để gợi ý phim thông minh, chúng tôi luôn nỗ lực để trở thành điểm dừng chân yêu thích của mọi "mọt phim".</p>
              <p>Web được xây dựng trên nền tảng các công nghệ hiện đại nhất hiện nay như Next.js, Supabase, Tailwind CSS và Framer Motion để đảm bảo tốc độ và trải nghiệm người dùng tuyệt vời nhất.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-white/5 p-6 md:p-8 rounded-2xl md:rounded-[24px] border border-white/5 hover:border-amber-400/30 transition-all group">
              <h3 className="text-lg md:text-xl font-bold text-amber-400 mb-4 md:mb-6 flex items-center gap-3">
                <Mail size={20} className="md:w-6 md:h-6 group-hover:rotate-12 transition-transform" /> 
                Liên hệ trực tiếp
              </h3>
              <p className="mb-4 md:mb-6 text-xs md:text-sm opacity-60">Có thắc mắc, báo lỗi hoặc gợi ý phim mới, hãy gửi cho chúng tôi qua:</p>
              <div className="space-y-4">
                <a href="mailto:janencl1125@gmail.com" className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-white hover:text-amber-400 transition-colors break-all">
                  <span className="p-1.5 md:p-2 bg-white/5 rounded-lg flex-shrink-0"><Send size={14} className="md:w-4 md:h-4" /></span>
                  janencl1125@gmail.com
                </a>
              </div>
            </div>

            <div className="bg-white/5 p-6 md:p-8 rounded-2xl md:rounded-[24px] border border-white/5 hover:border-blue-500/30 transition-all group">
              <h3 className="text-lg md:text-xl font-bold text-blue-400 mb-4 md:mb-6 flex items-center gap-3">
                <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Mạng xã hội
              </h3>
              <p className="mb-4 md:mb-6 text-xs md:text-sm opacity-60">Theo dõi thông tin cập nhật phim mới nhất tại các kênh:</p>
              <div className="flex gap-3 md:gap-4">
                <a href="#" className="p-2.5 md:p-3 bg-white/5 rounded-xl text-white hover:bg-blue-500 hover:text-white transition-all">
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="p-2.5 md:p-3 bg-white/5 rounded-xl text-white hover:bg-white hover:text-black transition-all">
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                </a>
              </div>
            </div>
          </section>

          <div className="text-center pt-8 border-t border-white/10 italic text-[10px] md:text-sm opacity-30">
            <p>© 2026 LoFilm Team. Mọi quyền được bảo vệ.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
