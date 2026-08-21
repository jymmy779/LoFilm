import Container from "@/app/components/UI/Container";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import MovieCardSkeleton from "@/app/components/Movies/MovieCard/MovieCardSkeleton";

export default function WatchPlayerSkeleton() {
    return (
        <main className="min-h-screen bg-[#0F1115] text-white pt-20 pb-20 overflow-hidden">
            <Container>
                <div className="space-y-8">
                    {/* Video Player Frame Skeleton */}
                    <div className="w-full aspect-video md:aspect-[21/9] max-h-[640px] rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden relative shadow-2xl">
                        <Skeleton className="w-full h-full opacity-40" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 animate-pulse flex items-center justify-center">
                                <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[14px] border-l-white/20 ml-1" />
                            </div>
                        </div>
                    </div>

                    {/* Movie info under player */}
                    <div className="space-y-4 pt-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-72" rounded="lg" />
                                <Skeleton className="h-5 w-44" rounded="md" />
                            </div>
                            <div className="flex gap-3">
                                <Skeleton className="h-10 w-28" rounded="xl" />
                                <Skeleton className="h-10 w-28" rounded="xl" />
                            </div>
                        </div>
                    </div>

                    {/* Server & Episode Selector Skeleton */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
                        <div className="flex gap-3">
                            <Skeleton className="h-9 w-32" rounded="xl" />
                            <Skeleton className="h-9 w-32" rounded="xl" />
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-2.5 pt-2">
                            {[...Array(24)].map((_, i) => (
                                <Skeleton key={i} className="h-9 w-full" rounded="lg" />
                            ))}
                        </div>
                    </div>

                    {/* Suggested Row */}
                    <div className="pt-6 space-y-4">
                        <Skeleton className="h-7 w-48" rounded="md" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <MovieCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </Container>
        </main>
    );
}
