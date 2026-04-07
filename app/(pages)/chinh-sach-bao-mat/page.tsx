import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111b33] to-[#0d162b] text-white/80 pt-32 pb-20 md:pt-40 md:pb-32 px-4 shadow-inner">
      <div className="max-w-4xl mx-auto bg-[#16213e] border border-white/5 rounded-2xl md:rounded-[32px] p-6 md:p-12 shadow-2xl">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8 border-b border-white/5 pb-4 md:pb-6 uppercase tracking-wider italic">Chính Sách Bảo Mật</h1>

        <div className="space-y-6 md:space-y-10">
          <section>
            <h2 className="text-sm md:text-base font-semibold text-amber-400 mb-2 md:mb-3 flex items-center gap-2">
              <span className="w-1 h-4 md:h-5 bg-amber-400 rounded-full inline-block"></span>
              1. Thu thập thông tin cá nhân
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Khi bạn đăng ký tài khoản tại LoFilm, chúng tôi thu thập các thông tin cơ bản bao gồm: Email và Họ tên. Những thông tin này được sử dụng để định danh người dùng và cung cấp các tính năng cá nhân hóa như danh sách yêu thích, lịch sử xem phim.
            </p>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-amber-400 mb-2 md:mb-3 flex items-center gap-2">
              <span className="w-1 h-4 md:h-5 bg-amber-400 rounded-full inline-block"></span>
              2. Sử dụng Cookie
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Website sử dụng Cookie để ghi nhớ phiên đăng nhập và các tùy chỉnh giao diện của bạn. Cookie giúp nâng cao trải nghiệm người dùng bằng cách giảm thời gian tải trang và ghi nhớ các lựa chọn trước đó.
            </p>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-amber-400 mb-2 md:mb-3 flex items-center gap-2">
              <span className="w-1 h-4 md:h-5 bg-amber-400 rounded-full inline-block"></span>
              3. Bảo mật thông tin
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Dữ liệu của bạn được lưu trữ trên nền tảng đám mây Supabase với tiêu chuẩn bảo mật hàng đầu. Chúng tôi cam kết không chia sẻ dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.
            </p>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-amber-400 mb-2 md:mb-3 flex items-center gap-2">
              <span className="w-1 h-4 md:h-5 bg-amber-400 rounded-full inline-block"></span>
              4. Quyền xóa dữ liệu
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Bạn có quyền yêu cầu xóa bỏ hoàn toàn tài khoản và thông tin cá nhân khỏi hệ thống của LoFilm bất kỳ lúc nào. Hãy liên hệ với chúng tôi qua email hỗ trợ để thực hiện quyền này.
            </p>
          </section>

          <section className="bg-white/5 p-5 md:p-6 rounded-xl md:rounded-2xl border border-white/5">
            <h2 className="text-xs md:text-sm font-semibold text-white mb-2 uppercase tracking-widest">Thông tin liên hệ</h2>
            <p className="text-[10px] md:text-xs opacity-50">Mọi thắc mắc về chính sách bảo mật xin vui lòng gửi về hòm thư:</p>
            <p className="text-amber-400 font-bold mt-1 tracking-wider text-xs md:text-sm">contactlofilm@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
