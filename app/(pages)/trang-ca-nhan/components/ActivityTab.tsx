/* app/(pages)/trang-ca-nhan/components/ActivityTab.tsx */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";
import {
    MessageSquare,
    Reply,
    ThumbsUp,
    ThumbsDown,
    Heart,
    BookmarkPlus,
    Image,
    Edit3,
    Loader2,
    ExternalLink,
    Share2,
} from "lucide-react";
import Link from "next/link";

interface Activity {
    id: string;
    type: string;
    metadata: Record<string, any>;
    created_at: string;
}

interface ActivityTabProps {
    user: any;
}

interface ActivityConfig {
    icon: React.ReactNode;
    label: (meta: Record<string, any>) => string;
    getLink?: (meta: Record<string, any>) => string | null;
}

const ACTIVITY_CONFIG: Record<string, ActivityConfig> = {
    comment: {
        icon: <MessageSquare size={16} />,
        label: (meta) => `Đã bình luận về phim "${meta.movie_name || meta.movie_slug || ""}"`,
        getLink: (meta) => meta.movie_slug ? `/phim/${meta.movie_slug}` : null,
    },
    reply: {
        icon: <Reply size={16} />,
        label: (meta) => `Đã trả lời bình luận trong phim "${meta.movie_name || meta.movie_slug || ""}"`,
        getLink: (meta) => meta.movie_slug ? `/phim/${meta.movie_slug}` : null,
    },
    like: {
        icon: <ThumbsUp size={16} />,
        label: (meta) => `Đã thích bình luận${meta.movie_slug ? ` trong phim "${meta.movie_name || meta.movie_slug}"` : ""}`,
        getLink: (meta) => meta.movie_slug ? `/phim/${meta.movie_slug}` : null,
    },
    dislike: {
        icon: <ThumbsDown size={16} />,
        label: (meta) => `Đã không thích bình luận${meta.movie_slug ? ` trong phim "${meta.movie_name || meta.movie_slug}"` : ""}`,
        getLink: (meta) => meta.movie_slug ? `/phim/${meta.movie_slug}` : null,
    },
    favorite_add: {
        icon: <Heart size={16} className="text-red-400" />,
        label: (meta) => `Đã thêm "${meta.movie_name || meta.movie_slug}" vào yêu thích`,
        getLink: (meta) => meta.movie_slug ? `/phim/${meta.movie_slug}` : null,
    },
    watchlist_add: {
        icon: <BookmarkPlus size={16} />,
        label: (meta) => `Đã thêm "${meta.movie_name || meta.movie_slug}" vào danh sách xem sau`,
        getLink: (meta) => meta.movie_slug ? `/phim/${meta.movie_slug}` : null,
    },
    like_movie: {
        icon: <ThumbsUp size={16} className="text-amber-400" />,
        label: (meta) => `Đã thích phim "${meta.movie_name || meta.movie_slug}"`,
        getLink: (meta) => meta.movie_slug ? `/phim/${meta.movie_slug}` : null,
    },
    dislike_movie: {
        icon: <ThumbsDown size={16} className="text-red-400" />,
        label: (meta) => `Đã không thích phim "${meta.movie_name || meta.movie_slug}"`,
        getLink: (meta) => meta.movie_slug ? `/phim/${meta.movie_slug}` : null,
    },
    share_movie: {
        icon: <Share2 size={16} className="text-blue-400" />,
        label: (meta) => `Đã chia sẻ phim "${meta.movie_name || meta.movie_slug}"`,
        getLink: (meta) => meta.movie_slug ? `/phim/${meta.movie_slug}` : null,
    },
    update_avatar: {
        icon: <Image size={16} />,
        label: () => "Đã thay đổi ảnh đại diện",
    },
    update_name: {
        icon: <Edit3 size={16} />,
        label: (meta) => `Đã cập nhật tên thành "${meta.new_name || ""}"`,
    },
};

function getTimeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString("vi-VN");
}

export default function ActivityTab({ user }: ActivityTabProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user?.id) return;

        const fetchActivities = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("user_activities")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);

            if (!error && data) {
                setActivities(data);
            } else {
                console.error("Error fetching activities:", error);
            }
            setLoading(false);
        };

        fetchActivities();
    }, [user?.id, supabase]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-amber-400" />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-white/10">
                    <MessageSquare size={20} />
                </div>
                <p className="text-white/30 text-sm">Chưa có hoạt động nào.</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-base md:text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-amber-400 rounded-full inline-block" />
                Hoạt động gần đây
            </h3>
            <div className="space-y-3">
                {activities.map((activity) => {
                    const config = ACTIVITY_CONFIG[activity.type];
                    if (!config) return null;

                    const href = config.getLink?.(activity.metadata) ?? null;

                    const cardContent = (
                        <div
                            key={activity.id}
                            className={`flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors ${href
                                ? "hover:bg-white/[0.06] cursor-pointer"
                                : "hover:bg-white/[0.04]"
                                }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                                {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white/80 text-sm leading-relaxed">
                                    {config.label(activity.metadata)}
                                </p>
                                <p className="text-white/30 text-xs mt-1 flex items-center gap-1">
                                    {getTimeAgo(activity.created_at)}
                                    {href && (
                                        <ExternalLink size={10} className="text-amber-400/40 inline" />
                                    )}
                                </p>
                            </div>
                        </div>
                    );

                    if (href) {
                        return (
                            <Link href={href} key={activity.id} className="block">
                                {cardContent}
                            </Link>
                        );
                    }

                    return cardContent;
                })}
            </div>
        </div>
    );
}