"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Virtual } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import Container from "@/app/components/UI/Container";
import MovieRowCard from "@/app/components/Movies/MovieCard/MovieRowCard";
import { useMovies } from "@/app/hooks/useMovies";
import SwiperNavButtons from "@/app/components/UI/Common/SwiperNavButtons";
import MovieRowSkeleton from "./MovieRowSkeleton";
import { ChevronRight, Film, Sparkles } from "lucide-react";

interface MovieRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
    sortByYear?: boolean;
    revalidate?: number;
}

// Cultural Hub metadata helper
function getHubMeta(viewAllLink: string, title: string) {
    const link = (viewAllLink || "").toLowerCase();
    if (link.includes("han-quoc")) {
        return {
            flag: "🇰🇷",
            tag: "K-DRAMA HUB",
            sub: "Tuyển tập siêu phẩm Hàn Quốc",
            watermark: "KOREA",
            gradient: "from-indigo-950/80 via-purple-950/50 to-[#0F1115]",
            accentBorder: "border-indigo-500/30",
            accentBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
            accentButton: "hover:bg-[#C084FC] hover:text-black",
            titleGradient: "from-white via-[#E9D5FF] to-[#C084FC]",
        };
    }
    if (link.includes("trung-quoc")) {
        return {
            flag: "🇨🇳",
            tag: "C-BIZ HUB",
            sub: "Hoa Ngữ đặc sắc chuẩn gu",
            watermark: "C-BIZ",
            gradient: "from-rose-950/80 via-amber-950/40 to-[#0F1115]",
            accentBorder: "border-rose-500/30",
            accentBadge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
            accentButton: "hover:bg-[#FB7185] hover:text-black",
            titleGradient: "from-white via-rose-200 to-rose-400",
        };
    }
    if (link.includes("au-my")) {
        return {
            flag: "🇺🇸",
            tag: "HOLLYWOOD",
            sub: "Bom tấn Âu Mỹ cháy màn ảnh",
            watermark: "US•UK",
            gradient: "from-blue-950/80 via-sky-950/40 to-[#0F1115]",
            accentBorder: "border-sky-500/30",
            accentBadge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
            accentButton: "hover:bg-[#38BDF8] hover:text-black",
            titleGradient: "from-white via-sky-200 to-[#38BDF8]",
        };
    }
    return {
        flag: "🎬",
        tag: "CINEMA HUB",
        sub: "Phim chọn lọc thịnh hành",
        watermark: "LOFILM",
        gradient: "from-purple-950/80 via-indigo-950/40 to-[#0F1115]",
        accentBorder: "border-purple-500/30",
        accentBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        accentButton: "hover:bg-[#D497FF] hover:text-black",
        titleGradient: "from-white via-[#E9D5FF] to-[#D497FF]",
    };
}

function MovieRow({
    title,
    apiUrl,
    viewAllLink,
    initialMovies,
    sortByYear = false,
    revalidate
}: MovieRowProps) {
    const { movies, isLoading } = useMovies({ apiUrl, initialMovies, sortByYear, revalidate });

    const navId = title.replace(/\s+/g, '-').toLowerCase();
    const hub = getHubMeta(viewAllLink, title);

    if (isLoading) {
        return <MovieRowSkeleton />;
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="relative z-30">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-5 lg:gap-6 bg-[#12151C]/60 p-4 sm:p-5 md:p-6 rounded-3xl border border-white/10">

                {/* === LEFT SIDE: CINEMA PASSPORT / CULTURE HUB === */}
                <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br ${hub.gradient} border ${hub.accentBorder} w-full xl:w-[270px] xl:flex-shrink-0 flex flex-col justify-between select-none min-h-[170px] xl:min-h-[235px]`}>
                    {/* Background Watermark Art */}
                    <div className="absolute -right-4 -bottom-6 text-6xl xl:text-7xl font-black italic opacity-[0.07] pointer-events-none select-none text-white tracking-tighter">
                        {hub.watermark}
                    </div>

                    {/* Top Hub Info */}
                    <div className="space-y-2 relative z-10">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider border border-white/10 bg-black/60 shadow-sm">
                            <span>{hub.flag}</span>
                            <span className="text-white/90">{hub.tag}</span>
                        </div>

                        <h2 className={`text-xl sm:text-2xl xl:text-[26px] font-black text-transparent bg-clip-text bg-gradient-to-r ${hub.titleGradient} leading-tight font-montserrat tracking-tight pt-1 drop-shadow-sm`}>
                            {title}
                        </h2>

                        <p className="text-xs text-white/60 font-medium">
                            {hub.sub}
                        </p>
                    </div>

                    {/* Highlights & CTA */}
                    <div className="pt-4 relative z-10 flex items-center xl:flex-col xl:items-start justify-between gap-3">
                        <div className="hidden xl:flex flex-col gap-1 text-[11px] text-white/50 font-medium">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Cập nhật liên tục
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Vietsub & Thuyết minh & Lồng tiếng
                            </span>
                        </div>

                        <TransitionLink
                            href={viewAllLink}
                            className={`px-4 py-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black font-bold text-xs transition-all duration-300 flex items-center gap-1.5 border border-white/15 hover:border-transparent cursor-pointer shadow-sm active:scale-95 group ${hub.accentButton}`}
                        >
                            <span>Khám phá toàn bộ</span>
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </TransitionLink>
                    </div>
                </div>

                {/* === RIGHT SIDE: MOVIES SWIPER === */}
                <div className="w-full xl:w-[calc(100%-294px)] relative group/slider min-w-0">
                    <Swiper
                        modules={[Navigation, Virtual]}
                        virtual={{ enabled: true }}
                        slidesPerView={"auto"}
                        spaceBetween={8}
                        breakpoints={{
                            640: { spaceBetween: 10 },
                            1024: { spaceBetween: 12 },
                            1280: { spaceBetween: 12 },
                        }}
                        navigation={{
                            nextEl: `.btn-next-${navId}`,
                            prevEl: `.btn-prev-${navId}`,
                        }}
                        className="w-full !overflow-hidden"
                    >
                        {movies.map((movie, index) => {
                            const eager = index < 3;

                            return (
                                <SwiperSlide key={movie._id || index} virtualIndex={index} className="!w-[180px] sm:!w-[220px] md:!w-[255px] lg:!w-[285px]">
                                    <MovieRowCard
                                        movie={movie}
                                        priority={eager}
                                    />
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    <SwiperNavButtons
                        prevClassName={`btn-prev-${navId}`}
                        nextClassName={`btn-next-${navId}`}
                        variant="ghost"
                    />
                </div>

            </div>
        </Container>
    );
}

export default memo(MovieRow);
