"use client";

import MovieCatalogClient from "@/app/components/MovieCatalog/MovieCatalogClient";

interface CategoryClientProps {
    slug: string;
    title?: string;
}

export default function CategoryClient({ slug, title }: CategoryClientProps) {
    return (
        <MovieCatalogClient
            baseApiUrl={`https://phimapi.com/v1/api/the-loai/${slug}`}
            slug={slug}
            title={title}
            itemsPerPage={48}
            emptyMessage="Chưa có phim nào trong thể loại này."
        />
    );
}
