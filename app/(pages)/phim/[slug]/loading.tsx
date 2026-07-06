"use client";

import { useBaitStore } from "@/app/store/useBaitStore";
import Container from "@/app/components/Container";
import SmartImage from "@/app/components/Common/SmartImage";
import { getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import { decodeHtml } from "@/app/utils/textUtils";
import Skeleton from "@/app/components/Skeleton/Skeleton";

export default function MovieDetailLoading() {
    const baitMovie = useBaitStore(state => state.baitMovie);

    // Nếu không có mồi (vào trực tiếp URL), render Skeleton trắng
    if (!baitMovie) {
        return (
            <main className="min-h-screen pb-20 animate-fade-in">
                <div className="relative w-full h-[40vh] md:h-[50vh] xl:h-[80vh] bg-[#0d192b]" />
                <Container className="lg:-mt-32 -mt-45 p-[20px] lg:-mt-48 relative z-30">
                    <div className="flex flex-col xl:flex-row gap-6 md:gap-8">
                        <div className="w-full xl:w-[440px] shrink-0">
                            <Skeleton className="w-full aspect-[2/3] rounded-3xl" />
                        </div>
                        <div className="w-full flex-1 shrink-0">
                            <Skeleton className="w-full h-[400px] rounded-3xl" />
                        </div>
                    </div>
                </Container>
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-20 animate-fade-in">
            {/* Background Cover - Fake */}
            <div className="relative w-full h-[40vh] md:h-[50vh] xl:h-[80vh] overflow-hidden transform-gpu xl:-ml-[100px] xl:w-[calc(100%+100px)]">
                <div className="absolute inset-0 scale-105 will-change-transform">
                    {/* Instant blurred placeholder */}
                    {baitMovie.poster_url && (
                        <SmartImage
                            className="absolute blur-2xl inset-0 w-full h-full object-cover object-top"
                            src={getImageUrl(baitMovie.poster_url, { width: 300, quality: 80 })}
                            rawSrc={getRawImageUrl(baitMovie.poster_url)}
                            alt={baitMovie.name || ""}
                            fill
                            sizes="(max-width: 768px) 120px, 160px"
                        />
                    )}

                    {/* Main Background Thumb */}
                    {baitMovie.thumb_url && (
                        <SmartImage
                            src={getImageUrl(baitMovie.thumb_url, { width: 1200, quality: 75 })}
                            rawSrc={getRawImageUrl(baitMovie.thumb_url)}
                            alt=""
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover object-top transform-gpu"
                        />
                    )}
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.35)_0.8px,transparent_0.8px)] [background-size:3px_3px] opacity-30 z-10 pointer-events-none" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,#0a1628_100%)] z-10 opacity-85" />
                <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#0a1628] via-[#0a1628]/20 to-transparent z-10" />
                <div className="absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-[#0a1628]/40 to-transparent z-10" />
            </div>

            {/* Main Content Container - Fake */}
            <Container className="lg:-mt-32 -mt-45 p-[20px] lg:-mt-48 relative z-30">
                <div className="flex flex-col xl:flex-row gap-6 md:gap-8">
                    
                    {/* DC SIDE - Movie Info Column */}
                    <div className="dc-side w-full xl:w-[440px] shrink-0">
                        <div className="ds-info p-[20px] lg:p-[40px] bg-[#0d192b]/50 border border-white/5 rounded-3xl relative transform-gpu will-change-[filter]">
                            
                            <div className="v-thumb-l xl:block flex justify-center mb-6">
                                <div className="v-thumbnail relative w-[120px] h-[180px] lg:w-[160px] lg:h-[240px] rounded-2xl overflow-hidden transform-gpu">
                                    {baitMovie.poster_url && (
                                        <SmartImage
                                            className="absolute inset-0 w-full h-full object-cover object-top"
                                            src={getImageUrl(baitMovie.poster_url, { width: 300, quality: 80 })}
                                            rawSrc={getRawImageUrl(baitMovie.poster_url)}
                                            alt={baitMovie.name || ""}
                                            fill
                                            priority
                                            sizes="(max-width: 768px) 120px, 160px"
                                        />
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl line-clamp-1 md:text-2xl text-center xl:text-left font-bold text-white mb-1 leading-tight font-montserrat">
                                {decodeHtml(baitMovie.name || "")}
                            </h2>
                            <div className="text-sm text-white/40 line-clamp-1 text-center xl:text-left mb-5 font-medium">
                                {decodeHtml(baitMovie.origin_name || "")}
                            </div>

                            {/* Fake Skeletons for metadata */}
                            <div className="detail-more xl:block hidden space-y-5">
                                <div className="hl-tags flex flex-wrap gap-2">
                                    <Skeleton className="w-16 h-6" rounded="md" />
                                    <Skeleton className="w-12 h-6" rounded="md" />
                                    <Skeleton className="w-24 h-6" rounded="md" />
                                </div>
                                <div className="status-box p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                                    <Skeleton className="w-40 h-4" />
                                </div>
                                <div className="detail-line">
                                    <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Giới thiệu:</div>
                                    <div className="space-y-2">
                                        <Skeleton className="w-full h-3" />
                                        <Skeleton className="w-full h-3" />
                                        <Skeleton className="w-3/4 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Tabs Content Skeleton */}
                    <div className="dc-side w-full flex-1 shrink-0">
                        <div className="ds-info p-[20px] lg:p-[40px] bg-[#0d192b]/50 border border-white/5 rounded-3xl relative transform-gpu">
                            <div className="flex items-center gap-6 mb-10">
                                <Skeleton className="w-40 h-14" rounded="full" />
                                <div className="flex gap-3">
                                    <Skeleton className="w-[50px] h-[50px]" rounded="full" />
                                    <Skeleton className="w-[50px] h-[50px]" rounded="full" />
                                </div>
                            </div>
                            <div className="flex gap-4 border-b border-white/5 mb-8 pb-2">
                                <Skeleton className="w-20 h-6" />
                                <Skeleton className="w-24 h-6" />
                                <Skeleton className="w-20 h-6" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="w-full h-24" rounded="xl" />
                                <Skeleton className="w-full h-24" rounded="xl" />
                            </div>
                        </div>
                    </div>

                </div>
            </Container>
        </main>
    );
}
