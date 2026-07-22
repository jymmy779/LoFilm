import React from 'react';
import type { Metadata } from 'next';
import { getAbsoluteUrl } from '@/app/config/site';

export const metadata: Metadata = {
  title: 'Câu Hỏi Thường Gặp (FAQ) | LoFilm',
  description: 'Giải đáp những thắc mắc thường gặp khi xem phim tại LoFilm. Tìm hiểu quy trình xem phim miễn phí, đăng ký tài khoản nhanh chóng.',
  alternates: {
    canonical: getAbsoluteUrl('/faq'),
  },
};

export default function FAQ() {
  const faqs = [
    {
      q: "Làm thế nào để đăng ký tài khoản trên LoFilm?",
      a: "Bạn chỉ cần nhấn vào nút Đăng nhập ở góc trên bên phải, chọn mục Đăng ký, nhập Email và Họ tên là có thể tạo tài khoản ngay lập tức."
    },
    {
      q: "Tại sao tôi không thể xem được phim?",
      a: "Vui lòng kiểm tra lại kết nối mạng của bạn. Nếu phim không tải được, hãy thử F5 (làm mới trang) hoặc chọn một tập phim/server khác nếu có."
    },
    {
      q: "Xem phim trên LoFilm có mất phí không?",
      a: "LoFilm hoàn toàn miễn phí, chúng tôi cung cấp nội dung phim từ các API công khai để chia sẻ đam mê điện ảnh với cộng đồng."
    },
    {
      q: "Tôi có thể yêu cầu phim mới không?",
      a: "Được, bạn có thể liên hệ với chúng tôi thông qua email hoặc trang giới thiệu để đề xuất những bộ phim bạn mong muốn."
    },
    {
      q: "Làm thế nào để báo lỗi phim hỏng?",
      a: "Mỗi trang xem phim đều có nút Báo lỗi (Report). Bạn hãy nhấn vào đó và chọn loại lỗi thích hợp để chúng tôi xử lý nhanh nhất."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1115] to-[#0F1115] text-white/80 pt-32 pb-20 md:pt-40 md:pb-32 px-4 shadow-inner">
      <div className="max-w-4xl mx-auto bg-[#12151C] border border-white/5 rounded-2xl md:rounded-[32px] p-6 md:p-12 shadow-2xl">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8 border-b border-white/5 pb-4 md:pb-6 uppercase tracking-wider italic">Câu hỏi thường gặp (FAQ)</h1>

        <div className="space-y-4 md:space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 md:p-6 bg-white/5 border border-white/5 rounded-xl md:rounded-2xl hover:bg-white/[0.08] transition-all group">
              <h3 className="text-sm md:text-base font-bold text-amber-400 mb-2 md:mb-3 flex items-start gap-3 md:gap-4 group-hover:text-amber-300 transition-colors">
                <span className="text-white/20 font-bold text-[10px] md:text-xs bg-white/5 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg flex-shrink-0">{index + 1}</span>
                {faq.q}
              </h3>
              <p className="pl-9 md:pl-12 leading-relaxed text-xs md:text-sm opacity-60 group-hover:opacity-100 transition-opacity">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
