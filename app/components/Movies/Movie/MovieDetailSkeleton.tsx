import Container from "@/app/components/UI/Container";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import MovieCardSkeleton from "@/app/components/Movies/MovieCard/MovieCardSkeleton";

export default function MovieDetailSkeleton() {
    return (
        <main className="min-h-screen bg-[#0F1115] text-white pb-20 overflow-hidden relative">
            {/* Backdrop Hero Skeleton */}
            <div className="relative w-full h-[55vh] md:h-[65vh] lg:h-[75vh] max-h-[700px] overflow-hidden bg-white/[0.02]">
                <Skeleton className="w-full h-full opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F1115] via-[#0F1115]/40 to-transparent" />
            </div>

            {/* Main Content Layout */}
            <Container className="relative -mt-48 md:-mt-64 z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left: Poster Skeleton */}
                    <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center md:items-start">
                        <div className="w-[200px] sm:w-[240px] md:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
                            <Skeleton className="w-full h-full" />
                        </div>
                        {/* Action buttons skeleton */}
                        <div className="w-full mt-5 space-y-3">
                            <Skeleton className="h-12 w-full" rounded="xl" />
                            <div className="grid grid-cols-2 gap-3">
                                <Skeleton className="h-10 w-full" rounded="xl" />
                                <Skeleton className="h-10 w-full" rounded="xl" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Skeleton */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-6 pt-4">
                        {/* Title & Origin Name */}
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-[70%]" rounded="lg" />
                            <Skeleton className="h-6 w-[40%]" rounded="md" />
                        </div>

                        {/* Badges / Meta tags */}
                        <div className="flex flex-wrap gap-2.5">
                            <Skeleton className="h-7 w-20" rounded="full" />
                            <Skeleton className="h-7 w-16" rounded="full" />
                            <Skeleton className="h-7 w-24" rounded="full" />
                            <Skeleton className="h-7 w-28" rounded="full" />
                        </div>

                        {/* Description */}
                        <div className="space-y-2.5 pt-2">
                            <Skeleton className="h-4 w-full" rounded="sm" />
                            <Skeleton className="h-4 w-[95%]" rounded="sm" />
                            <Skeleton className="h-4 w-[85%]" rounded="sm" />
                            <Skeleton className="h-4 w-[60%]" rounded="sm" />
                        </div>

                        {/* Episode List Box Skeleton */}
                        <div className="pt-6">
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-36" rounded="md" />
                                    <Skeleton className="h-6 w-24" rounded="md" />
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2.5 pt-2">
                                    {[...Array(16)].map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" rounded="lg" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Suggested Movies Row Skeleton */}
                        <div className="pt-8 space-y-4">
                            <Skeleton className="h-7 w-48" rounded="md" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {[...Array(5)].map((_, i) => (
                                    <MovieCardSkeleton key={i} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </main>
    );
}
