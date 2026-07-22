import React from 'react';
import type { Metadata } from 'next';
import { getAbsoluteUrl } from '@/app/config/site';

export const metadata: Metadata = {
  title: 'Điều Khoản Sử Dụng | LoFilm',
  description: 'Xem các điều khoản và quy định chung khi sử dụng dịch vụ xem phim miễn phí do LoFilm cung cấp.',
  alternates: {
    canonical: getAbsoluteUrl('/dieu-khoan-su-dung'),
  },
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1115] to-[#0F1115] text-white/80 pt-32 pb-20 md:pt-40 md:pb-32 px-4 shadow-inner">
      <div className="max-w-4xl mx-auto bg-[#12151C] border border-white/5 rounded-2xl md:rounded-[32px] p-6 md:p-12 shadow-2xl">
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
              Tất cả nội dung video, hình ảnh và thông tin trên LoFilm được tổng hợp từ các nguồn API và dịch vụ lưu trữ của bên thứ ba. LoFilm không sở hữu, không trực tiếp lưu trữ bất kỳ tệp tin đa phương tiện nào trên máy chủ của mình. Mọi vấn đề liên quan đến bản quyền, vui lòng liên hệ trực tiếp với các đơn vị cung cấp hoặc nguồn phát gốc.
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
              Dịch vụ và Quảng cáo
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Để duy trì nguồn lực vận hành hệ thống và cung cấp dịch vụ xem phim hoàn toàn miễn phí cho cộng đồng, website có thể hiển thị các nội dung quảng cáo từ các đối tác bên thứ ba. Việc người dùng truy cập và sử dụng dịch vụ trên website đồng nghĩa với việc chấp thuận sự xuất hiện của các quảng cáo này. Chúng tôi luôn nỗ lực để các quảng cáo không gây ảnh hưởng tiêu cực đến trải nghiệm xem phim của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-amber-400 mb-2 md:mb-3 flex items-center gap-2 underline underline-offset-8 decoration-white/5">
              Miễn trừ trách nhiệm
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              LoFilm cung cấp dịch vụ "Nguyên trạng" và không chịu trách nhiệm về tính chính xác, tính pháp lý hoặc tính lành mạnh của nội dung do API bên thứ ba cung cấp. Chúng tôi cũng không chịu trách nhiệm đối với bất kỳ thiệt hại trực tiếp hoặc gián tiếp nào phát sinh từ việc sử dụng nội dung trên website, bao gồm nhưng không giới hạn ở các liên kết hoặc nội dung từ các đối tác quảng cáo.
            </p>
          </section>

          <section className="bg-white/5 p-5 md:p-6 rounded-xl md:rounded-2xl border border-white/5 italic">
            <p className="text-[10px] md:text-xs opacity-40">LoFilm có quyền thay đổi các điều khoản này bất kỳ lúc nào mà không cần thông báo trước. Cập nhật cuối cùng vào ngày {new Date().toLocaleDateString('vi-VN')}.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
