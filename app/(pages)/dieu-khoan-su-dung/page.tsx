import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111b33] to-[#0d162b] text-white/80 pt-32 pb-20 md:pt-40 md:pb-32 px-4 shadow-inner">
      <div className="max-w-4xl mx-auto bg-[#16213e] border border-white/5 rounded-2xl md:rounded-[32px] p-6 md:p-12 shadow-2xl">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8 border-b border-white/5 pb-4 md:pb-6 uppercase tracking-wider italic">Điều Khoản Sử Dụng</h1>
        
        <div className="space-y-6 md:space-y-10">
          <section>
            <h2 className="text-sm md:text-base font-semibold text-amber-400 mb-2 md:mb-3 flex items-center gap-2 underline underline-offset-8 decoration-white/5">
              Chấp nhận điều khoản
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Việc bạn tiếp tục sử dụng website LoFilm đồng nghĩa với việc bạn đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-amber-400 mb-2 md:mb-3 flex items-center gap-2 underline underline-offset-8 decoration-white/5">
              Quyền sở hữu nội dung
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Tất cả các bộ phim trên LoFilm được cung cấp từ các nguồn API bên thứ ba. Bản quyền phim thuộc về các nhà sản xuất và đơn vị phát hành chính thức. LoFilm chỉ đóng vai trò là trình phát đa phương tiện.
            </p>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-amber-400 mb-2 md:mb-3 flex items-center gap-2 underline underline-offset-8 decoration-white/5">
              Hành vi bị cấm
            </h2>
            <ul className="list-disc list-inside space-y-1.5 md:space-y-2 ml-1 md:ml-2 text-xs md:text-sm opacity-60">
              <li>Cố gắng tấn công từ chối dịch vụ (DDoS) vào website.</li>
              <li>Sử dụng các công cụ tự động để thu thập dữ liệu bất hợp pháp.</li>
              <li>Phát tán mã độc hoặc nội dung vi phạm pháp luật qua nền tảng.</li>
              <li>Sử dụng tài khoản của người khác mà không có sự cho phép.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-amber-400 mb-2 md:mb-3 flex items-center gap-2 underline underline-offset-8 decoration-white/5">
              Miễn trừ trách nhiệm
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Chúng tôi không chịu trách nhiệm về nội dung của các bộ phim được cung cấp từ API bên thứ ba. Nội dung trên website mang tính chất tham khảo và giải trí cá nhân.
            </p>
          </section>

          <section className="bg-white/5 p-5 md:p-6 rounded-xl md:rounded-2xl border border-white/5 italic">
            <p className="text-[10px] md:text-xs opacity-40">LoFilm có quyền thay đổi các điều khoản này bất kỳ lúc nào mà không cần thông báo trước. Cập nhật cuối cùng vào ngày 05/04/2026.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
