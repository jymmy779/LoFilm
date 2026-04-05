import { Metadata } from "next";
import { Suspense } from "react";
import CategoryClient from "./CategoryClient";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    let title = slug.split("-").join(" ");
    title = title.charAt(0).toUpperCase() + title.slice(1);

    try {
        const res = await fetch("https://phimapi.com/the-loai");
        const categories = await res.json();
        const category = categories.find((cat: any) => cat.slug === slug);
        if (category) title = category.name;
    } catch (err) {
        console.error("Lỗi fetch metadata thể loại:", err);
    }

    return {
        title: `Phim ${title} | LoFilm - Xem phim online chất lượng cao`,
        description: `Danh sách phim thuộc thể loại ${title} mới nhất, cập nhật liên tục mỗi ngày trên LoFilm.`,
    };
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    return (
        <Suspense>
            <CategoryClient slug={slug} />
        </Suspense>
    );
}
