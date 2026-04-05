import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white/80 py-20 md:py-32 px-4 shadow-inner">
      <div className="max-w-4xl mx-auto bg-[#14233e]/60 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[32px] p-6 md:p-12 shadow-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6">Điều Khoản Sử Dụng</h1>
        
        <div className="space-y-8 md:space-y-12">
          <section>
            <h2 className="text-lg md:text-xl font-semibold text-amber-400 mb-3 md:mb-4 flex items-center gap-2 underline underline-offset-8 decoration-white/10">
              Chấp nhận điều khoản
            </h2>
            <p className="leading-relaxed text-sm md:text-base opacity-80">
              Việc bạn tiếp tục sử dụng website LoFilm đồng nghĩa với việc bạn đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-semibold text-amber-400 mb-3 md:mb-4 flex items-center gap-2 underline underline-offset-8 decoration-white/10">
              Quyền sở hữu nội dung
            </h2>
            <p className="leading-relaxed text-sm md:text-base opacity-80">
              Tất cả các bộ phim trên LoFilm được cung cấp từ các nguồn API bên thứ ba. Bản quyền phim thuộc về các nhà sản xuất và đơn vị phát hành chính thức. LoFilm chỉ đóng vai trò là trình phát đa phương tiện.
            </p>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-semibold text-amber-400 mb-3 md:mb-4 flex items-center gap-2 underline underline-offset-8 decoration-white/10">
              Hành vi bị cấm
            </h2>
            <ul className="list-disc list-inside space-y-2 md:space-y-3 ml-2 md:ml-4 text-sm md:text-base opacity-80">
              <li>Cố gắng tấn công từ chối dịch vụ (DDoS) vào website.</li>
              <li>Sử dụng các công cụ tự động để thu thập dữ liệu bất hợp pháp.</li>
              <li>Phát tán mã độc hoặc nội dung vi phạm pháp luật qua nền tảng.</li>
              <li>Sử dụng tài khoản của người khác mà không có sự cho phép.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-semibold text-amber-400 mb-3 md:mb-4 flex items-center gap-2 underline underline-offset-8 decoration-white/10">
              Miễn trừ trách nhiệm
            </h2>
            <p className="leading-relaxed text-sm md:text-base opacity-80">
              Chúng tôi không chịu trách nhiệm về nội dung của các bộ phim được cung cấp từ API bên thứ ba. Nội dung trên website mang tính chất tham khảo và giải trí cá nhân.
            </p>
          </section>

          <section className="bg-white/5 p-5 md:p-6 rounded-xl md:rounded-2xl border border-white/5 italic">
            <p className="text-xs md:text-sm opacity-60">LoFilm có quyền thay đổi các điều khoản này bất kỳ lúc nào mà không cần thông báo trước. Cập nhật cuối cùng vào ngày 05/04/2026.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
