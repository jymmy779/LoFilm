import React from 'react';

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
    <div className="min-h-screen bg-[#0f1115] text-white/80 py-20 md:py-32 px-4 shadow-inner">
      <div className="max-w-4xl mx-auto bg-[#14233e]/60 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[32px] p-6 md:p-12 shadow-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6">Câu hỏi thường gặp (FAQ)</h1>

        <div className="space-y-4 md:space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 md:p-6 bg-white/5 border border-white/5 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all">
              <h3 className="text-base md:text-lg font-bold text-amber-400 mb-2 md:mb-3 flex items-start gap-3 md:gap-4">
                <span className="text-white/20 font-bold text-xs md:text-sm bg-white/5 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg flex-shrink-0">{index + 1}</span>
                {faq.q}
              </h3>
              <p className="pl-9 md:pl-12 leading-relaxed text-sm md:text-base opacity-80">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
