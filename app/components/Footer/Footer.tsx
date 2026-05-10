import Image from 'next/image';
import TransitionLink from '@/app/components/Transition/TransitionLink';

export default function Footer() {
    return (
        <footer className="relative w-full border-t border-white/10 bg-[#0F111A] mt-10 overflow-hidden pb-6 transition-all duration-300">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-[0.08] bg-gradient-to-bl from-orange-500/40 via-yellow-500/20 to-transparent rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none opacity-[0.05] bg-gradient-to-tr from-blue-500/30 to-transparent rounded-full -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 w-full max-w-[1900px] mx-auto px-5 lg:px-12 pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">

                        <div className="group flex items-center gap-2.5 text-[13px] text-white font-bold bg-gradient-to-r from-red-500 to-red-600 w-fit px-4 py-1.5 rounded-full border border-red-400/40 shadow-[0_0_20px_rgba(220,38,38,0.6)] cursor-default transition-all duration-300 hover:shadow-[0_0_25px_rgba(220,38,38,0.8)] hover:scale-105">
                            <div className="w-5 h-3.5 rounded-sm overflow-hidden flex-shrink-0 relative border border-white/20">
                                <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
                                    <rect width="30" height="20" fill="#DA251D"></rect>
                                    <polygon points="15,4 16.76,9.42 22.52,9.42 17.88,12.58 19.64,18 15,14.84 10.36,18 12.12,12.58 7.48,9.42 13.24,9.42" fill="#FFFF00"></polygon>
                                </svg>
                            </div>
                            <span className="tracking-wide drop-shadow-md">Việt Nam muôn năm !</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
                            <TransitionLink href="/" className="shrink-0 transition-transform hover:scale-105">
                                <Image
                                    src="/lofilm_logo.webp"
                                    alt="LoFilm Logo"
                                    width={140}
                                    height={70}
                                    unoptimized
                                    className=" object-contain drop-shadow-lg"
                                />
                            </TransitionLink>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Telegram */}
                                <a href="#" target="_blank" rel="noopener noreferrer" title="Telegram" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#0088cc] hover:bg-white/10 hover:border-white/20 transition-all">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.94.5-1.35.49-.45-.01-1.3-.25-1.93-.46-.77-.25-1.38-.38-1.33-.8.02-.22.33-.44.92-.68 3.58-1.56 5.97-2.59 7.17-3.09 3.42-1.42 4.14-1.67 4.61-1.68.1 0 .32.02.46.12.12.09.15.22.16.32.01.07.01.16 0 .2z" /></svg>
                                </a>
                                {/* Discord */}
                                <a href="#" target="_blank" rel="noopener noreferrer" title="Discord" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#5865F2] hover:bg-white/10 hover:border-white/20 transition-all">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                                </a>
                                {/* X (Twitter) */}
                                <a href="#" target="_blank" rel="noopener noreferrer" title="X" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                </a>
                                {/* Facebook */}
                                <a href="#" target="_blank" rel="noopener noreferrer" title="Facebook" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#1877F2] hover:bg-white/10 hover:border-white/20 transition-all">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7.5v4H10V22h4v-8.5z" /></svg>
                                </a>
                                {/* YouTube */}
                                <a href="#" target="_blank" rel="noopener noreferrer" title="YouTube" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#FF0000] hover:bg-white/10 hover:border-white/20 transition-all">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21.582 6.186a2.67 2.67 0 0 0-1.884-1.884C18.037 3.8 12 3.8 12 3.8s-6.037 0-7.698.502a2.67 2.67 0 0 0-1.884 1.884C1.916 7.848 1.916 12 1.916 12s0 4.152.502 5.814a2.67 2.67 0 0 0 1.884 1.884C6.037 20.2 12 20.2 12 20.2s6.037 0 7.698-.502a2.67 2.67 0 0 0 1.884-1.884C22.084 16.152 22.084 12 22.084 12s0-4.152-.502-5.814zM9.99 15.5v-7l6.49 3.5-6.49 3.5z" /></svg>
                                </a>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-2">
                            {[
                                { label: 'Hỏi-Đáp', href: '/faq' },
                                { label: 'Chính sách bảo mật', href: '/chinh-sach-bao-mat' },
                                { label: 'Điều khoản sử dụng', href: '/dieu-khoan-su-dung' },
                                { label: 'Giới thiệu', href: '/gioi-thieu' },
                                { label: 'Liên hệ', href: '/lien-he' }
                            ].map(item => (
                                <TransitionLink
                                    key={item.label}
                                    href={item.href}
                                    className="text-[14px] font-medium text-white/60 hover:text-[#f5a623]  underline-offset-4 transition-all"
                                >
                                    {item.label}
                                </TransitionLink>
                            ))}
                        </div>

                        <div className="text-[12px] text-white/40 leading-relaxed max-w-4xl space-y-4">
                            <p>
                                <strong className="text-white/60 font-semibold">LoFilm</strong> ra đời với sứ mệnh mang không gian điện ảnh chân thực nhất đến ngay màn hình của bạn. Khi tìm kiếm <strong className="text-white/50">xem phim LoFilm</strong>, bạn sẽ được trải nghiệm một trạm dừng chân giải trí cao cấp, nơi hội tụ những siêu phẩm chiếu rạp, phim bộ độc quyền và các TV Show thịnh hành nhất. Với giao diện tối giản chuẩn cinematic, hệ thống điều hướng thông minh cùng tốc độ truyền tải mượt mà, LoFilm định hình lại cách bạn tận hưởng nghệ thuật thứ bảy.
                            </p>
                            <p>
                                Kho tàng nội dung tại LoFilm được đầu tư và cập nhật liên tục, bao quát đa dạng nền văn hoá: từ làn sóng Hallyu Hàn Quốc, vũ trụ C-Drama, thế giới Anime đa sắc đến các bom tấn kĩ xảo Hollywood. Dù bạn ưu thích sự kịch tính của phim hành động hay chìm đắm trong những thước phim tình cảm sâu lắng, LoFilm luôn sẵn sàng phục vụ bằng định dạng Full HD cực nét, vietsub chuẩn xác và trải nghiệm hoàn toàn phi lợi nhuận.
                            </p>
                            <p className="flex items-center gap-2 pt-2">
                                <span className="text-white/50">Liên hệ:</span>
                                <a href="https://t.me/janencl" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center bg-white/5 px-2 py-1 rounded-[15px] border border-white/10 hover:border-white/20 transition-all duration-300">
                                    <span className="blur-xs group-hover:blur-[0px] transition-all duration-300 text-white/60 text-[12px] font-medium whitespace-nowrap">
                                        @janencl
                                    </span>
                                </a>
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-white/10">
                            <div className="text-[13px] text-white/30 font-medium">
                                © {new Date().getFullYear()} <span className="text-white/50">LoFilm</span>. All rights reserved.
                            </div>

                            <div className="flex items-center gap-4">
                                <a href="https://www.dmca.com/Protection/Status.aspx" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 outline-none transition-opacity">
                                    <Image
                                        src="https://images.dmca.com/Badges/dmca-badge-w250-5x1-11.png"
                                        alt="DMCA.com Protection Status"
                                        width={121}
                                        height={24}
                                        className="h-6 w-auto object-contain"
                                    />
                                </a>
                            </div>
                        </div>

                    </div>

                    <div className="col-span-1 lg:col-span-4 hidden lg:flex items-center justify-end select-none pointer-events-none relative">
                        <div className="w-[350px] aspect-square opacity-[0.009] hover:opacity-[0.05] transition-opacity duration-1000 relative">
                            <Image
                                src="/lofilm_logo.webp"
                                fill
                                alt=''
                                loading='eager'
                                unoptimized
                                sizes="350px"
                                className="object-contain filter grayscale"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
