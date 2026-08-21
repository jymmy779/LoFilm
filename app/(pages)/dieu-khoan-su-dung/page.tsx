import React from 'react';
import type { Metadata } from 'next';
import { getAbsoluteUrl } from '@/app/config/site';

export const metadata: Metadata = {
  title: 'Điều Khoản Sử Dụng | CineStream',
  description: 'Xem các điều khoản và quy định chung của CineStream.',
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
            <h2 className="text-sm md:text-base font-semibold text-purple-400 mb-2 md:mb-3 flex items-center gap-2 underline underline-offset-8 decoration-white/5">
              Chấp nhận điều khoản
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Việc bạn tiếp tục sử dụng website CineStream đồng nghĩa với việc bạn đồng ý với các điều khoản dưới đây.
            </p>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-purple-400 mb-2 md:mb-3 flex items-center gap-2 underline underline-offset-8 decoration-white/5">
              Quyền sở hữu nội dung
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              Tất cả nội dung video, hình ảnh và thông tin trên CineStream được tổng hợp từ các nguồn API nguồn mở phục vụ mục đích nghiên cứu và trình diễn giao diện kỹ thuật.
            </p>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-purple-400 mb-2 md:mb-3 flex items-center gap-2 underline underline-offset-8 decoration-white/5">
              Hành vi bị cấm
            </h2>
            <ul className="list-disc list-inside space-y-1.5 md:space-y-2 ml-1 md:ml-2 text-xs md:text-sm opacity-60">
              <li>Cố gắng tấn công từ chối dịch vụ (DDoS) vào website.</li>
              <li>Sử dụng các công cụ tự động để thu thập dữ liệu bất hợp pháp.</li>
              <li>Phát tán mã độc hoặc nội dung vi phạm pháp luật qua nền tảng.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm md:text-base font-semibold text-purple-400 mb-2 md:mb-3 flex items-center gap-2 underline underline-offset-8 decoration-white/5">
              Miễn trừ trách nhiệm
            </h2>
            <p className="leading-relaxed text-xs md:text-sm opacity-60">
              CineStream cung cấp dịch vụ "Nguyên trạng" cho mục đích phi thương mại / Portfolio Showcase.
            </p>
          </section>

          <section className="bg-white/5 p-5 md:p-6 rounded-xl md:rounded-2xl border border-white/5 italic">
            <p className="text-[10px] md:text-xs opacity-40">CineStream Showcase. Cập nhật vào ngày {new Date().toLocaleDateString('vi-VN')}.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
