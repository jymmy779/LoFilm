import { Metadata } from "next";
import CategoryClient from "./CategoryClient";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    // Có thể fetch title từ API nếu muốn chi tiết hơn, hoặc capitalize slug
    const displaySlug = slug.split("-").join(" ");
    const title = displaySlug.charAt(0).toUpperCase() + displaySlug.slice(1);

    return {
        title: `Phim ${title} | LoFilm - Xem phim online chất lượng cao`,
        description: `Danh sách phim thuộc thể loại ${title} mới nhất, cập nhật liên tục mỗi ngày trên LoFilm.`,
    };
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    return (
        <>
            <CategoryClient slug={slug} />
        </>
    );
}
