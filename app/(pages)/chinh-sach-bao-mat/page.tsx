import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white/80 py-32 px-4">
      <div className="max-w-3xl mx-auto bg-[#14233e]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-8">Chính Sách Bảo Mật</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-amber-400 mb-4">1. Thu thập thông tin</h2>
          <p className="mb-4">
            Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản trên hệ thống LoFilm. Thông tin bao gồm tên, địa chỉ email và ảnh đại diện (nếu đăng nhập qua Google/Facebook).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-amber-400 mb-4">2. Sử dụng thông tin</h2>
          <p className="mb-4">
            Thông tin của bạn được sử dụng để:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Cá nhân hóa trải nghiệm người dùng.</li>
            <li>Cung cấp nội dung phim phù hợp.</li>
            <li>Cải thiện chất lượng dịch vụ website.</li>
            <li>Gửi email thông báo về tài khoản hoặc cập nhật mới.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-amber-400 mb-4">3. Bảo mật dữ liệu</h2>
          <p className="mb-4">
            Chúng tôi cam kết bảo mật thông tin cá nhân của bạn. Dữ liệu được lưu trữ an toàn thông qua dịch vụ của Supabase và Google Cloud. Chúng tôi không bán, trao đổi hoặc chuyển giao thông tin cá nhân của bạn cho bên thứ ba.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-amber-400 mb-4">4. Quyền của người dùng</h2>
          <p className="mb-4">
            Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân của mình bất kỳ lúc nào thông qua phần cài đặt tài khoản hoặc liên hệ trực tiếp với chúng tôi.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-amber-400 mb-4">5. Liên hệ</h2>
          <p>
            Nếu có bất kỳ câu hỏi nào về chính sách này, vui lòng liên hệ qua email: <span className="text-white">thaivietluong2005@gmail.com</span>
          </p>
        </section>
      </div>
    </div>
  );
}
