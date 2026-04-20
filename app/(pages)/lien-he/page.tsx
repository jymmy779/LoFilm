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
              <a href="mailto:contactlofilm@gmail.com" className="text-amber-400 font-bold text-xs md:text-sm hover:underline break-all">contactlofilm@gmail.com</a>
            </div>

            <div className="bg-[#16213e] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] hover:border-blue-400/20 transition-all group shadow-xl">
              <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Send size={18} />
              </div>
              <h3 className="text-sm md:text-base font-bold text-white mb-2 uppercase tracking-widest">Telegram</h3>
              <p className="text-white/20 text-[10px] md:text-xs mb-3">Kết nối nhanh nhất qua kênh cộng đồng.</p>
              <a href="https://t.me/+5S1xkPn1SCAxZWZl" target='blank' className="text-blue-400 font-bold text-xs md:text-sm hover:underline">@LoFilmSupport</a>
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
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
