import Container from "@/app/components/UI/Container";
import MovieCardSkeleton from "@/app/components/Movies/MovieCard/MovieCardSkeleton";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";

export default function CatalogSkeleton({ hideSidebar = false }: { hideSidebar?: boolean }) {
    return (
        <main className="pt-24 md:pt-28 pb-12 min-h-screen">
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

                    {/* Filter Button Skeleton */}
                    <div className="mb-8">
                        <Skeleton className="w-[110px] h-[42px]" rounded="full" />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-8">
                        {/* Main Content */}
                        <div className="flex-grow w-full lg:min-w-0">
                            <div className={`grid gap-x-2.5 gap-y-6 sm:gap-x-3 sm:gap-y-8 md:gap-x-3.5 md:gap-y-10 ${hideSidebar
                                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
                                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                                }`}>
                                {[...Array(21)].map((_, i) => (
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
