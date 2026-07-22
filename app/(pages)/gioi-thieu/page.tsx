import React from 'react';
import type { Metadata } from 'next';
import { Mail, Send } from 'lucide-react';
import { getAbsoluteUrl } from '@/app/config/site';

export const metadata: Metadata = {
  title: 'Giới Thiệu | LoFilm - Xem Phim Online Chất Lượng Cao',
  description: 'Tìm hiểu về LoFilm - Nền tảng xem phim trực tuyến miễn phí, chất lượng cao cực nét. Khám phá sứ mệnh và tầm nhìn của chúng tôi.',
  alternates: {
    canonical: getAbsoluteUrl('/gioi-thieu'),
  },
};

export default function AboutContact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1115] to-[#0F1115] text-white/80 pt-32 pb-20 md:pt-40 md:pb-32 px-4">
      <div className="max-w-4xl mx-auto bg-[#12151C] border border-white/5 rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl">
        <div className="bg-amber-400 p-6 md:p-12 text-black">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2 md:mb-3 italic tracking-tighter">LoFilm.</h1>
          <p className="text-[10px] md:text-sm font-medium opacity-60 leading-relaxed uppercase tracking-[0.12em] md:tracking-[0.15em]">Khám phá thế giới điện ảnh không giới hạn</p>
        </div>

        <div className="p-6 md:p-12 space-y-6 md:space-y-10">
          <section>
            <h2 className="text-sm md:text-base font-bold text-white mb-3 md:mb-4 underline decoration-amber-400/20 underline-offset-8 uppercase tracking-widest">Giới thiệu về chúng tôi</h2>
            <div className="space-y-4 leading-relaxed text-xs md:text-sm opacity-60">
              <p>LoFilm ra đời với sứ mệnh mang lại trải nghiệm xem phim trực tuyến hiện đại, mượt mà và hoàn toàn miễn phí cho cộng đồng yêu phim Việt Nam.</p>
              <p>Với kho nội dung phim đồ sộ, đa dạng thể loại và được cập nhật liên tục mỗi ngày, chúng tôi luôn nỗ lực để trở thành điểm dừng chân yêu thích của mọi tín đồ điện ảnh.</p>
              <p>Nền tảng của chúng tôi được tối ưu hóa với hệ thống máy chủ tốc độ cao và giao diện tương thích đa nền tảng, giúp bạn tận hưởng những thước phim chất lượng mượt mà nhất trên mọi thiết bị.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/5 hover:border-amber-400/20 transition-all group">
              <h3 className="text-sm md:text-base font-bold text-amber-400 mb-3 md:mb-4 flex items-center gap-3">
                <Mail size={16} className="md:w-[18px] md:h-[18px] group-hover:rotate-12 transition-transform" />
                Liên hệ trực tiếp
              </h3>
              <p className="mb-3 md:mb-4 text-[10px] md:text-xs opacity-50">Có thắc mắc, báo lỗi hoặc gợi ý phim mới, hãy gửi cho chúng tôi qua:</p>
              <div className="space-y-3">
                <a href="mailto:contactlofilm@gmail.com" className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-white/80 hover:text-amber-400 transition-colors break-all">
                  <span className="p-1 px-2 bg-white/5 rounded-lg flex-shrink-0 text-[10px] font-mono opacity-50"><Send size={12} /></span>
                  contactlofilm@gmail.com
                </a>
              </div>
            </div>

            <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/5 hover:border-[#0088cc]/30 transition-all group">
              <h3 className="text-sm md:text-base font-bold text-[#0088cc] mb-3 md:mb-4 flex items-center gap-3">
                <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.94.5-1.35.49-.45-.01-1.3-.25-1.93-.46-.77-.25-1.38-.38-1.33-.8.02-.22.33-.44.92-.68 3.58-1.56 5.97-2.59 7.17-3.09 3.42-1.42 4.14-1.67 4.61-1.68.1 0 .32.02.46.12.12.09.15.22.16.32.01.07.01.16 0 .2z" />
                </svg>
                Mạng xã hội
              </h3>
              <p className="mb-3 md:mb-4 text-[10px] md:text-xs opacity-50">Theo dõi thông tin cập nhật phim mới nhất tại các kênh:</p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="https://t.me/chanuary" target="_blank" rel="noopener noreferrer" title="Telegram" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#0088cc] hover:bg-white/10 hover:border-white/20 transition-all">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.94.5-1.35.49-.45-.01-1.3-.25-1.93-.46-.77-.25-1.38-.38-1.33-.8.02-.22.33-.44.92-.68 3.58-1.56 5.97-2.59 7.17-3.09 3.42-1.42 4.14-1.67 4.61-1.68.1 0 .32.02.46.12.12.09.15.22.16.32.01.07.01.16 0 .2z" /></svg>
                </a>
                <a href="https://www.threads.com/@lofilm_adm" target="_blank" rel="noopener noreferrer" title="Threads" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14.12 10.38c-.37-.73-1.06-1.3-1.92-1.54v-.03c1.07-.38 1.83-1.39 1.83-2.58 0-1.47-1.19-2.73-2.83-2.73H7.07v10.9h4.13c1.64 0 2.92-1.26 2.92-2.73 0-1-.53-1.87-1.38-2.34-.14-.07-.3-.12-.46-.15-.05.41-.12.82-.24 1.22.25.07.48.21.66.41.34.38.5.89.44 1.41-.06.52-.33 1-.74 1.34-.41.34-.95.53-1.5.53H8.78V4.83h2.42c.87 0 1.58.71 1.58 1.58s-.71 1.58-1.58 1.58h-.94v1.24h.94c.64 0 1.25.26 1.7.71.45.45.71 1.06.71 1.7s-.26 1.25-.71 1.7c-.45.45-1.06.71-1.7.71h-.94v1.24h.94c1.23 0 2.29-.93 2.45-2.14.03-.19.04-.38.04-.58 0-.48-.09-.94-.27-1.37zM12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 22.5A10.5 10.5 0 011.5 12 10.5 10.5 0 0112 1.5 10.5 10.5 0 0122.5 12 10.5 10.5 0 0112 22.5z" /></svg>
                </a>
              </div>
            </div>
          </section>

          <div className="text-center pt-6 border-t border-white/5 italic text-[10px] md:text-xs opacity-20 uppercase tracking-widest">
            <p>© 2026 LoFilm Team. Mọi quyền được bảo vệ.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
