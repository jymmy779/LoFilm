import { Suspense } from "react";
import { Metadata } from "next";
import TopicsClient from "./TopicsClient";
import TopicsSkeleton from "./TopicsSkeleton";
import { getSiteSettings } from "@/app/actions/adminSettings";

export const metadata: Metadata = {
    title: "Chủ Đề Phim | Khám phá bộ sưu tập phim đa dạng",
    description: "Khám phá các bộ sưu tập và chủ đề phim đang được quan tâm trên LoFilm. Từ phim Hot, Hàn Quốc, Âu Mỹ đến Kinh dị, Hoạt hình...",
    keywords: ["chủ đề phim", "bộ sưu tập phim", "phim hot", "phim hàn quốc", "lofilm"],
};

export const revalidate = 86400; // Cache 24 giờ cho trang chủ đề tĩnh

export default function TopicsPage() {
    return (
        <Suspense fallback={<TopicsSkeleton />}>
            <TopicsData />
        </Suspense>
    );
}

async function TopicsData() {
    const settings = await getSiteSettings();
    return <TopicsClient initialTopics={settings.home_topics} />;
}

