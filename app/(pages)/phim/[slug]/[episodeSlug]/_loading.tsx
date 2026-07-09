import Container from "@/app/components/Container";
import Skeleton from "@/app/components/Skeleton/Skeleton";

export default function Loading() {
    return (
        <main className="pt-27 pb-12 min-h-screen bg-[#0F1115]">
            {/* Movie Header Skeleton */}
            <Container className="max-w-[1900px] mx-auto px-5 lg:px-12 mb-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-4" rounded="full" />
                    <Skeleton className="h-6 w-32 opacity-50" />
                </div>
            </Container>

            {/* Video Player Skeleton */}
            <div className="max-w-[1900px] mx-auto px-5 lg:px-12">
                <div className="aspect-video w-full bg-black/40 border border-white/5 rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-white/5 animate-pulse flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-white/10 border-b-[10px] border-b-transparent ml-1" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex gap-4">
                        <Skeleton className="h-2 w-full" rounded="full" />
                    </div>
                </div>
            </div>

            {/* Info & Sidebar Skeleton */}
            <Container className="max-w-[1900px] mx-auto px-5 lg:px-12 mt-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Content */}
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                                <Skeleton className="h-10 w-32" rounded="full" />
                                <Skeleton className="h-10 w-10" rounded="full" />
                                <Skeleton className="h-10 w-10" rounded="full" />
                            </div>
                            <Skeleton className="h-10 w-24" rounded="xl" />
                        </div>
                        <div className="bg-[#0F1115]/50 p-6 rounded-2xl border border-white/5">
                            <Skeleton className="h-8 w-1/3 mb-4" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-full lg:w-[400px] shrink-0">
                        <div className="bg-[#0F1115]/50 p-6 rounded-2xl border border-white/5">
                            <Skeleton className="h-6 w-full mb-6" />
                            <div className="grid grid-cols-4 gap-3">
                                {[...Array(12)].map((_, i) => (
                                    <Skeleton key={i} className="aspect-square w-full" rounded="lg" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </main>
    );
}
