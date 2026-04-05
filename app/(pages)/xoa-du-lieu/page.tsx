import React from 'react';

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white/80 py-32 px-4">
      <div className="max-w-3xl mx-auto bg-[#14233e]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">Yêu cầu xóa dữ liệu người dùng</h1>
        
        <p className="mb-6">
          LoFilm là một nền tảng xem phim trực tuyến. Chúng tôi sử dụng các dịch vụ đăng nhập thông qua Facebook và Google để mang lại trải nghiệm tiện lợi cho bạn.
        </p>

        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-amber-400 mb-4">Cách xóa dữ liệu của bạn:</h2>
          <p className="mb-4">
            Theo chính sách bảo mật của Facebook, chúng tôi cung cấp hướng dẫn cách xóa các hoạt động hoặc dữ liệu của bạn trên ứng dụng của chúng tôi:
          </p>
          <ol className="list-decimal list-inside space-y-4 ml-4">
            <li>
              Đi tới ứng dụng & trang web trên Facebook của bạn: <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Facebook Settings</a>.
            </li>
            <li>Tìm và gỡ bỏ ứng dụng <strong>LoFilm</strong>.</li>
            <li>
              Sau khi gỡ bỏ, bạn có thể kiểm tra trạng thái yêu cầu xóa dữ liệu của mình tại chính mục này trên Facebook.
            </li>
            <li>
              Hoặc, nếu bạn muốn chúng tôi xóa hoàn toàn tài khoản và dữ liệu khỏi cơ sở dữ liệu của LoFilm, vui lòng liên hệ trực tiếp với chúng tôi.
            </li>
          </ol>
        </section>

        <section className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-3">Liên hệ yêu cầu xóa dữ liệu</h2>
          <p className="mb-2">Gửi email cho bộ phận hỗ trợ kỹ thuật của chúng tôi:</p>
          <p className="font-bold text-lg text-amber-400 underline">thaivietluong2005@gmail.com</p>
          <p className="mt-4 text-sm italic">
            * Chúng tôi sẽ phản hồi và thực hiện yêu cầu xóa toàn bộ dữ liệu của bạn trong vòng 24-48 giờ làm việc sau khi nhận được yêu cầu. Dữ liệu bị xóa bao gồm: Tên, Email, Ảnh đại diện và các lịch sử hoạt động liên quan đến tài khoản LoFilm.
          </p>
        </section>

        <section>
          <p className="text-sm text-white/40">
            Cập nhật lần cuối: 05/04/2026. Chúng tôi tuân thủ đầy đủ chính sách dữ liệu người dùng của Facebook và Google.
          </p>
        </section>
      </div>
    </div>
  );
}
