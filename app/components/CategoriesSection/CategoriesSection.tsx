"use client";

import { useRef, useState, useEffect } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import Container from "@/app/components/Container";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { mockTopics, getIconComponent } from "@/app/(pages)/chu-de/TopicsClient";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import { ChevronRight } from "lucide-react";

export default function CategoriesSection({ initialTopics }: { initialTopics?: any[] }) {
    const swiperRef = useRef<SwiperType>(null);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [topics, setTopics] = useState<any[]>(initialTopics || mockTopics);

    useEffect(() => {
        setMounted(true);
        if (initialTopics) {
            setTopics(initialTopics);
            return;
        }

        const fetchTopics = async () => {
            try {
                const { createClient } = await import("@/app/utils/supabase/client");
                const supabase = createClient();
                const { data } = await supabase.from('site_settings').select('*').eq('key', 'home_topics').maybeSingle();
                if (data && data.value) {
                    setTopics(data.value);
                }
            } catch (error) {
                console.error("Failed to load categories:", error);
            }
        };
        fetchTopics();
    }, [initialTopics]);

    if (!mounted) {
        return (
            <Container as="section" className="relative z-30 -mt-[90px] md:-mt-[120px] pointer-events-none mb-10">
                <div className="h-8 w-[250px] bg-white/10 rounded-lg animate-pulse mb-6"></div>
                <div className="flex gap-2 sm:gap-3 lg:gap-[14px] overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-[200px] lg:w-[320px] h-[100px] lg:h-[160px] bg-white/5 rounded-xl animate-pulse shrink-0"></div>
                    ))}
                </div>
            </Container>
        );
    }

    return (
        <Container as="section" className="relative z-30 -mt-[90px] md:-mt-[120px] pointer-events-none">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4 pointer-events-auto">
                <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Bạn Đang Quan Tâm Gì?</h2>
            </div>

            {/* Swiper Slider */}
            <div className="relative pointer-events-auto -mx-4 px-4 sm:mx-0 sm:px-0 group/slider">
                <Swiper
                    modules={[Navigation, FreeMode]}
                    onBeforeInit={(swiper) => {
                        swiperRef.current = swiper;
                    }}
                    onSlideChange={(swiper) => {
                        setIsBeginning(swiper.isBeginning);
                        setIsEnd(swiper.isEnd);
                    }}
                    navigation={{
                        nextEl: '.btn-next-categories',
                        prevEl: '.btn-prev-categories',
                    }}
                    freeMode={true}
                    spaceBetween={8}
                    slidesPerView="auto"
                    breakpoints={{
                        0: { spaceBetween: 8 },
                        640: { spaceBetween: 12 },
                        1024: { spaceBetween: 14 },
                    }}
                    className="!pb-6 !pt-2"
                >
                    {topics.map((topic) => {
                        const Icon = getIconComponent(topic.icon);
                        return (
                            <SwiperSlide key={topic.id} className="!w-[200px] md:!w-[240px] lg:!w-[280px]">
                                <TransitionLink
                                    href={topic.href}
                                    className={`relative overflow-hidden rounded-[16px] md:rounded-[20px] h-[110px] md:h-[130px] lg:h-[150px] bg-gradient-to-br ${topic.bgColor} group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block border border-white/5`}
                                >
                                    {/* Nửa bên trái: Thông tin */}
                                    <div className="absolute inset-0 z-10 p-3 md:p-4 flex flex-col justify-between h-full w-[65%]">
                                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm shadow-sm`}>
                                            <Icon size={16} strokeWidth={2.5} className="text-white/90" />
                                        </div>
                                        <div className="mt-auto">
                                            <h2 className="text-white font-bold text-sm md:text-base lg:text-lg leading-tight line-clamp-1 mb-1 drop-shadow-md">
                                                {topic.title}
                                            </h2>
                                            <div className="flex items-center text-[9px] md:text-[10px] font-bold text-white/70 tracking-wider group-hover:text-white transition-colors">
                                                XEM NGAY <ChevronRight size={12} className="ml-0.5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nửa bên phải: Hình ảnh có hiệu ứng Fade */}
                                    <div className="absolute right-0 top-0 h-full w-[75%]">
                                        <div
                                            className="relative w-full h-full opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            style={{
                                                WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
                                                maskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)"
                                            }}
                                        >
                                            <Image
                                                src={`https://wsrv.nl/?url=${encodeURIComponent(topic.imageUrl)}&w=400&q=80&output=webp`}
                                                alt={topic.title}
                                                fill
                                                sizes="(max-width: 768px) 50vw, 300px"
                                                className="object-cover"
                                                priority
                                            />
                                        </div>
                                    </div>
                                </TransitionLink>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                <SwiperNavButtons
                    prevClassName="btn-prev-categories"
                    nextClassName="btn-next-categories"
                    className="!top-1/2 !-translate-y-[calc(50%+8px)]"
                />
            </div>
        </Container>
    );
}
