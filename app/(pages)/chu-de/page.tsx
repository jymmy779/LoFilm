import { Metadata } from "next";
import TopicsClient from "./TopicsClient";

export const metadata: Metadata = {
    title: "Chủ Đề Phim | Khám phá bộ sưu tập phim đa dạng",
    description: "Khám phá các bộ sưu tập và chủ đề phim đang được quan tâm trên LoFilm. Từ phim Hot, Hàn Quốc, Âu Mỹ đến Kinh dị, Hoạt hình...",
    keywords: ["chủ đề phim", "bộ sưu tập phim", "phim hot", "phim hàn quốc", "lofilm"],
};

export default function TopicsPage() {
    return (
        <TopicsClient />
    );
}
