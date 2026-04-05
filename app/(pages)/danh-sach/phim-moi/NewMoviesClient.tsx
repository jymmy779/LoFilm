"use client";

import { useMovieCatalog } from "@/app/hooks/useMovieCatalog";
import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";

export default function NewMoviesClient() {
    // Logic đặc biệt cho Phim mới: mặc định v3, nếu có filter thì dùng v1
    // Để tích hợp với hook, ta xác định baseApiUrl dựa trên logic tương tự trước đây
    
    // Tuy nhiên, để đơn giản và đồng bộ, ta có thể dùng luôn v1 hoặc 
    // giữ logic cũ nhưng bọc vào component sạch sẽ hơn.
    
    // Ở đây tôi sẽ dùng hook với baseApiUrl là v3 mặc định.
    // Nếu bạn muốn hỗ trợ filter nâng cao cho cả trang Phim mới, 
    // ta sẽ tinh chỉnh hook một chút.
    
    const {
        movies, isLoading, isPageLoading, currentPage, totalPages, isFilterOpen,
        activeFilters, categories, countries, handlePageChange,
        handleFilterChange, handleToggleFilter
    } = useMovieCatalog({
        // Logic switch API nằm trong fetchMovies của hook (đã được tối ưu để xử lý cả v1/v3)
        baseApiUrl: "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3" 
    });

    return (
        <CatalogLayout
            title="Danh sách Phim mới"
            isLoading={isLoading}
            isPageLoading={isPageLoading}
            movies={movies}
            currentPage={currentPage}
            totalPages={totalPages}
            isFilterOpen={isFilterOpen}
            activeFilters={activeFilters}
            categories={categories}
            countries={countries}
            onFilterChange={handleFilterChange}
            onToggleFilter={handleToggleFilter}
            onPageChange={handlePageChange}
        />
    );
}
