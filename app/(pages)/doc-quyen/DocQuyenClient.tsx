"use client";

import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";

export default function DocQuyenClient({ initialMovies }: { initialMovies: any[] }) {
    return (
        <CatalogLayout
            title="Danh sách Phim Độc Quyền"
            isLoading={false}
            movies={initialMovies}
            currentPage={1}
            totalPages={1}
            isFilterOpen={false}
            activeFilters={{
                country: "",
                type: "",
                category: "",
                year: "",
                sort: "",
                rating: ""
            }}
            categories={[]}
            countries={[]}
            onFilterChange={() => {}}
            onToggleFilter={() => {}}
            onPageChange={() => {}}
            hideSidebar={true}
            hideFilter={true}
            emptyMessage="Chưa có phim độc quyền nào. Hãy quay lại sau nhé!"
        />
    );
}
