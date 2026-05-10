import Container from "@/app/components/Container";
import MovieCardSkeleton from "@/app/components/MovieCard/MovieCardSkeleton";
import Skeleton from "@/app/components/Skeleton/Skeleton";

export default function CatalogSkeleton({ hideSidebar = false }: { hideSidebar?: boolean }) {
    return (
        <main className="pt-30 md:pt-40 pb-12 min-h-screen">
            <Container>
                <div className="catalog-page">
                    {/* Header */}
                    <div className="mb-6">
                        <Skeleton className="w-[120px] h-4" />
                    </div>
                    <div className="mb-8 md:mb-10">
                        <Skeleton className="h-10 w-[300px]" rounded="xl" />
                        <div className="h-1 w-20 bg-white/5 rounded-full mt-2" />
                    </div>

                    {/* Filter */}
                    <div className="mb-8 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="flex flex-wrap gap-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="w-[120px] h-9" rounded="full" />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-8">
                        {/* Main Content */}
                        <div className="flex-grow w-full lg:min-w-0">
                            <div className={`grid gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 ${hideSidebar
                                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
                                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                                }`}>
                                {[...Array(18)].map((_, i) => (
                                    <MovieCardSkeleton key={i} />
                                ))}
                            </div>
                        </div>

                        {/* Sidebar */}
                        {!hideSidebar && (
                            <div className="w-full lg:w-[320px] shrink-0 space-y-8">
                                <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                                    <Skeleton className="h-6 w-[60%] mb-6" />
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex gap-4 mb-5">
                                            <Skeleton className="w-[50px] h-[70px]" rounded="xl" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-3 w-1/2 opacity-50" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </main>
    );
}
