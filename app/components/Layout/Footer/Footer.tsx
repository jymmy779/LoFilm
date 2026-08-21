import Image from 'next/image';
import TransitionLink from '@/app/components/UI/Transition/TransitionLink';
import { getSiteSettings } from '@/app/actions/adminSettings';
import Logo from '@/app/components/UI/Brand/Logo';

export default async function Footer() {
    const settings = await getSiteSettings();

    return (
        <footer className="relative w-full border-t border-white/10 bg-[#0F1115] mt-10 overflow-hidden pb-6 transition-all duration-300">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-[0.08] bg-gradient-to-bl from-[#D497FF]/40 via-[#D497FF]/20 to-transparent rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none opacity-[0.05] bg-gradient-to-tr from-[#D497FF]/30 to-transparent rounded-full -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 w-full max-w-[1900px] mx-auto pt-10 px-4 md:px-8 xl:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
                            <TransitionLink href="/" className="shrink-0 transition-transform hover:scale-105">
                                <Logo size="md" />
                            </TransitionLink>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-2">
                            {[
                                { label: 'Khám phá', href: '/danh-sach/phim-moi' },
                                { label: 'Phim bộ', href: '/danh-sach/phim-bo' },
                                { label: 'Phim lẻ', href: '/danh-sach/phim-le' },
                                { label: 'Chiếu rạp', href: '/danh-sach/phim-chieu-rap' },
                                { label: 'Hoạt hình', href: '/danh-sach/hoat-hinh' },
                            ].map(item => (
                                <TransitionLink
                                    key={item.label}
                                    href={item.href}
                                    className="text-[14px] font-medium text-white/60 hover:text-[#D497FF] underline-offset-4 transition-all"
                                >
                                    {item.label}
                                </TransitionLink>
                            ))}
                        </div>

                        <div className="text-[12px] text-white/40 leading-relaxed max-w-4xl space-y-3">
                            <p>
                                <strong className="text-white/70 font-semibold">CineStream Showcase</strong> là dự án web application phục vụ nghiên cứu và trình diễn năng lực kỹ thuật Full-Stack, xây dựng trên nền tảng <strong className="text-white/60">Next.js 16 (App Router)</strong>, <strong className="text-white/60">React 19</strong>, cơ chế Multi-Layer Caching (RAM L1 & Redis) và Streaming SSR.
                            </p>
                            <p>
                                Dữ liệu thông tin và hình ảnh được tham chiếu từ các API nguồn mở công khai phục vụ mục đích học thuật và thử nghiệm giao diện. Ứng dụng không lưu trữ hay sở hữu bất kỳ tệp tin phương tiện có bản quyền nào.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-white/10">
                            <div className="text-[13px] text-white/40 font-medium">
                                © {new Date().getFullYear()} <span className="text-white/60 font-semibold">CineStream</span> • Technical Portfolio Showcase. All rights reserved.
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </footer>
    );
}

