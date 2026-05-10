import React from "react";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import Container from "@/app/components/Container";

export default function ReunificationEventSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            <div className="relative w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white/[0.02] border border-white/5 p-5 md:p-10 lg:p-12">
                {/* Banner Content Header */}
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 mb-10 border-b border-white/5 pb-4 lg:pb-8">
                    <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
                        <Skeleton className="w-[320px] h-10" rounded="xl" />
                        <Skeleton className="w-[200px] h-4" rounded="md" />
                    </div>
                    <Skeleton className="w-16 h-16 md:w-20 md:h-20" rounded="full" />
                </div>

                {/* Movies Grid */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
                    {[...Array(6)].map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center space-y-3">
                            <Skeleton className="aspect-[2/3] w-full" rounded="2xl" />
                            <div className="w-full flex flex-col items-center space-y-2">
                                <Skeleton className="h-3 w-4/5" />
                                <Skeleton className="h-3 w-2/3 opacity-50" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Banner Footer */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-10 w-32" rounded="full" />
                </div>
            </div>
        </Container>
    );
}
