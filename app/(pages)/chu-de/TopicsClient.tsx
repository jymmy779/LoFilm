"use client";

import Image from "next/image";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import * as Icons from "lucide-react";
import { Flame, Film, Camera, Crown, Ghost, Globe, Sparkles, Gamepad2, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import CatalogSkeleton from "@/app/components/MovieCatalog/CatalogSkeleton";

export interface TopicItem {
    id: string;
    title: string;
    href: string;
    bgColor: string; // Tailwind gradient classes
    icon: any; // Can be string or Lucide React component
    imageUrl: string;
}

export function getIconComponent(iconName: any): React.ElementType {
    if (!iconName) return Icons.Film;
    if (typeof iconName !== "string") return iconName;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Film;
}

// Dữ liệu mô phỏng, sau này có thể được thay thế bằng fetch API từ Admin
export const mockTopics: TopicItem[] = [
    {
        id: "phim-4k",
        title: "Phim 4K",
        href: "/danh-sach/phim-moi",
        bgColor: "from-[#d94a38] to-[#ab3024]",
        icon: Flame,
        imageUrl: "https://image.tmdb.org/t/p/w500/bRBeSHfGHwkEpImlhxPmOcUsaeg.jpg",
    },
    {
        id: "chieu-rap",
        title: "Chiếu Rạp",
        href: "/danh-sach/phim-chieu-rap",
        bgColor: "from-[#0a8ea0] to-[#065b66]",
        icon: Film,
        imageUrl: "https://image.tmdb.org/t/p/w500/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg",
    },
    {
        id: "han-quoc",
        title: "Hàn Quốc",
        href: "/quoc-gia/han-quoc",
        bgColor: "from-[#f4689b] to-[#6042e6]",
        icon: Camera,
        imageUrl: "https://image.tmdb.org/t/p/w500/zgUh4cgalSzBjbsT5P0qmU7Rjzk.jpg",
    },
    {
        id: "co-trang",
        title: "Cổ Trang",
        href: "/the-loai/co-trang",
        bgColor: "from-[#f5a623] to-[#d68400]",
        icon: Crown,
        imageUrl: "https://image.tmdb.org/t/p/w500/l1gTssKenpyuwgjX7Lutn2DvRzV.jpg",
    },
    {
        id: "hoat-hinh",
        title: "Hoạt Hình",
        href: "/danh-sach/hoat-hinh",
        bgColor: "from-[#41d8cd] to-[#3f88f2]",
        icon: Gamepad2,
        imageUrl: "https://phimimg.com/upload/vod/20241018-1/422e01866d2bfcb0adfd4ae2a31ef32f.jpg",
    },
    {
        id: "kinh-di",
        title: "Kinh Dị",
        href: "/the-loai/kinh-di",
        bgColor: "from-[#7123d4] to-[#2b085c]",
        icon: Ghost,
        imageUrl: "https://image.tmdb.org/t/p/w500/xVjDFOKoZuPOv1m4Z7NJpQ1gbfF.jpg",
    },
    {
        id: "au-my",
        title: "Âu Mỹ",
        href: "/quoc-gia/au-my",
        bgColor: "from-[#b53018] to-[#59160a]",
        icon: Globe,
        imageUrl: "https://image.tmdb.org/t/p/w500/hxvTdKAwv27PUfpXOQp6AwWr6V.jpg",
    },
    {
        id: "trung-quoc",
        title: "Trung Quốc",
        href: "/quoc-gia/trung-quoc",
        bgColor: "from-[#40a373] to-[#1f5f5b]",
        icon: Sparkles,
        imageUrl: "https://image.tmdb.org/t/p/w500/9bB4tJbjViEsQCMJ0qth7wuzpNA.jpg",
    }
];

export default function TopicsClient({ initialTopics }: { initialTopics?: TopicItem[] }) {
    const [topics, setTopics] = useState<TopicItem[]>(initialTopics || mockTopics);
    const [isLoading, setIsLoading] = useState(!initialTopics);

    useEffect(() => {
        if (initialTopics) {
            setTopics(initialTopics);
            setIsLoading(false);
            return;
        }

        const fetchTopics = async () => {
            try {
                const { createClient } = await import("@/app/utils/supabase/client");
                const supabase = createClient();
                const { data } = await supabase.from('site_settings').select('*').eq('key', 'home_topics').maybeSingle();
                if (data && data.value) {
                    setTopics(data.value);
                } else {
                    setTopics(mockTopics);
                }
            } catch (error) {
                console.error("Failed to load topics:", error);
                setTopics(mockTopics);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopics();
    }, [initialTopics]);

    if (isLoading) {
        return <CatalogSkeleton hideSidebar={true} />;
    }

    return (
        <div className="w-full min-h-screen bg-[#0F1115] pt-[120px] pb-20">
            <div className="max-w-[1200px] mx-auto px-4 xl:px-0">
                <div className="flex flex-col items-center mb-10 mt-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center">Chủ Đề Phim</h1>
                    <p className="text-white/60 text-sm md:text-base text-center max-w-2xl">
                        Khám phá các bộ sưu tập và chủ đề phim đang được quan tâm trên LoFilm.
                    </p>
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {topics.map((topic) => {
                        const Icon = getIconComponent(topic.icon);
                        return (
                            <TransitionLink
                                key={topic.id}
                                href={topic.href}
                                className={`relative overflow-hidden rounded-[20px] h-[150px] md:h-[180px] bg-gradient-to-br ${topic.bgColor} group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block border border-white/5`}
                            >
                                {/* Nửa bên trái: Thông tin */}
                                <div className="absolute inset-0 z-10 p-5 md:p-6 flex flex-col justify-between h-full w-[65%]">
                                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm shadow-sm`}>
                                        <Icon size={18} strokeWidth={2.5} className="text-white/90" />
                                    </div>
                                    <div className="mt-auto">
                                        <h2 className="text-white font-bold text-lg md:text-xl leading-tight line-clamp-1 mb-1 drop-shadow-md">
                                            {topic.title}
                                        </h2>
                                        <div className="flex items-center text-[10px] md:text-[11px] font-bold text-white/70 tracking-wider group-hover:text-white transition-colors">
                                            XEM NGAY <ChevronRight size={14} className="ml-0.5" />
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
                                            className="object-cover object-center"
                                            priority
                                        />
                                    </div>
                                </div>
                            </TransitionLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
