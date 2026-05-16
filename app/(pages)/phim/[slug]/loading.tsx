import Container from "@/app/components/Container";
import Skeleton from "@/app/components/Skeleton/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen pb-20 bg-[#0a1628]">
      {/* Skeleton Banner Area */}
      <div className="relative w-full h-[40vh] md:h-[50vh] xl:h-[80vh] bg-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] to-transparent z-10" />
      </div>

      {/* Skeleton Content Area */}
      <Container className="p-[20px] -mt-45 lg:-mt-48 relative z-30">
        <div className="flex flex-col xl:flex-row gap-6 md:gap-8">
          
          {/* Left Column Skeleton (Poster & Side info) */}
          <div className="w-full xl:w-[440px] shrink-0">
            <div className="p-[20px] lg:p-[40px] bg-[#0d192b]/50 border border-white/5 rounded-3xl">
              <div className="flex justify-center xl:block mb-6">
                <Skeleton className="w-[120px] h-[180px] lg:w-[160px] lg:h-[240px]" rounded="2xl" />
              </div>
              <Skeleton className="h-8 w-3/4 mb-4 mx-auto xl:mx-0" />
              <Skeleton className="h-4 w-1/2 mb-8 mx-auto xl:mx-0 opacity-50" />
              
              <div className="hidden xl:block space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-24 w-full" rounded="xl" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
          </div>

          {/* Right Column Skeleton (Buttons & Tabs) */}
          <div className="w-full flex-1">
            <div className="p-[20px] lg:p-[40px] bg-[#0d192b]/50 border border-white/5 rounded-3xl">
              <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                <div className="flex gap-4">
                  <Skeleton className="h-14 w-40" rounded="full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-14 w-14" rounded="full" />
                    <Skeleton className="h-14 w-14" rounded="full" />
                  </div>
                </div>
                <Skeleton className="h-14 w-32" rounded="2xl" />
              </div>

              <div className="flex gap-8 border-b border-white/5 mb-8 pb-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>

              <div className="space-y-4">
                 <Skeleton className="h-12 w-full" rounded="xl" />
                 <Skeleton className="h-12 w-full" rounded="xl" />
                 <Skeleton className="h-12 w-full" rounded="xl" />
                 <Skeleton className="h-12 w-full" rounded="xl" />
              </div>
            </div>
          </div>

        </div>
      </Container>
    </main>
  );
}
