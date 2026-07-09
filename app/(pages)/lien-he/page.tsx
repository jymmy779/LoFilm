import React from 'react';
import { Mail, Send, MessageSquare, Phone, Globe } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liên Hệ | LoFilm - Hỗ Trợ 24/7',
  description: 'Liên hệ với tập thể phát triển LoFilm. Giải đáp thắc mắc, gửi ý kiến đóng góp và yêu cầu phim mới nhất.',
  alternates: {
    canonical: 'https://www.munos.store/lien-he',
  },
};

import ContactForm from './ContactForm';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1115] to-[#0F1115] text-white/80 pt-32 pb-20 md:pt-40 md:pb-32 px-4 relative overflow-hidden">
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
            <div className="bg-[#12151C] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-amber-400/20 transition-all group shadow-xl">
              <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Mail size={18} />
              </div>
              <h3 className="text-sm md:text-base font-bold text-white mb-2 uppercase tracking-widest">Email hỗ trợ</h3>
              <p className="text-white/20 text-[10px] md:text-xs mb-3">Gửi thư cho chúng tôi nếu bạn có bất kỳ thắc mắc nào.</p>
              <a href="mailto:contactlofilm@gmail.com" className="text-amber-400 font-bold text-xs md:text-sm hover:underline break-all">contactlofilm@gmail.com</a>
            </div>

            <div className="bg-[#12151C] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-blue-400/20 transition-all group shadow-xl">
              <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Send size={18} />
              </div>
              <h3 className="text-sm md:text-base font-bold text-white mb-2 uppercase tracking-widest">Telegram</h3>
              <p className="text-white/20 text-[10px] md:text-xs mb-3">Kết nối nhanh nhất qua kênh cộng đồng.</p>
              <a href="https://t.me/+5S1xkPn1SCAxZWZl" target='blank' className="text-blue-400 font-bold text-xs md:text-sm hover:underline">@LoFilmSupport</a>
            </div>

            <div className="bg-[#12151C] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-[#0088cc]/30 transition-all group shadow-xl">
              <div className="w-10 h-10 bg-[#0088cc]/10 rounded-xl flex items-center justify-center text-[#0088cc] mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.94.5-1.35.49-.45-.01-1.3-.25-1.93-.46-.77-.25-1.38-.38-1.33-.8.02-.22.33-.44.92-.68 3.58-1.56 5.97-2.59 7.17-3.09 3.42-1.42 4.14-1.67 4.61-1.68.1 0 .32.02.46.12.12.09.15.22.16.32.01.07.01.16 0 .2z" />
                </svg>
              </div>
              <h3 className="text-sm md:text-base font-bold text-white mb-2 uppercase tracking-widest">Mạng xã hội</h3>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <a href="https://t.me/chanuary" target="_blank" rel="noopener noreferrer" title="Telegram" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#0088cc] hover:bg-white/10 hover:border-white/20 transition-all">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.94.5-1.35.49-.45-.01-1.3-.25-1.93-.46-.77-.25-1.38-.38-1.33-.8.02-.22.33-.44.92-.68 3.58-1.56 5.97-2.59 7.17-3.09 3.42-1.42 4.14-1.67 4.61-1.68.1 0 .32.02.46.12.12.09.15.22.16.32.01.07.01.16 0 .2z" /></svg>
                </a>
                <a href="https://www.threads.com/@lofilm_adm" target="_blank" rel="noopener noreferrer" title="Threads" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14.12 10.38c-.37-.73-1.06-1.3-1.92-1.54v-.03c1.07-.38 1.83-1.39 1.83-2.58 0-1.47-1.19-2.73-2.83-2.73H7.07v10.9h4.13c1.64 0 2.92-1.26 2.92-2.73 0-1-.53-1.87-1.38-2.34-.14-.07-.3-.12-.46-.15-.05.41-.12.82-.24 1.22.25.07.48.21.66.41.34.38.5.89.44 1.41-.06.52-.33 1-.74 1.34-.41.34-.95.53-1.5.53H8.78V4.83h2.42c.87 0 1.58.71 1.58 1.58s-.71 1.58-1.58 1.58h-.94v1.24h.94c.64 0 1.25.26 1.7.71.45.45.71 1.06.71 1.7s-.26 1.25-.71 1.7c-.45.45-1.06.71-1.7.71h-.94v1.24h.94c1.23 0 2.29-.93 2.45-2.14.03-.19.04-.38.04-.58 0-.48-.09-.94-.27-1.37zM12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 22.5A10.5 10.5 0 011.5 12 10.5 10.5 0 0112 1.5 10.5 10.5 0 0122.5 12 10.5 10.5 0 0112 22.5z" /></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form Box */}
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
