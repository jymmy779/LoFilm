import Container from "@/app/components/Container";
import TopCommentsSlider from "./TopCommentsSlider";
import StatsGrid from "./StatsGrid";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";

export default function SocialStatsSection() {
    return (
        <Container as="section" className="relative z-30 py-4 sm:py-6 md:py-8">
            <div className="border border-white/5 rounded-2xl sm:rounded-3xl md:rounded-[2rem] relative group">
                <div className="relative z-10 p-4 sm:p-6 md:p-8">
                    <TopCommentsSlider />
                    
                    <div className="mt-6 pt-6 sm:mt-8 sm:pt-8 md:mt-12 md:pt-10 border-t border-white/5 relative">
                        <StatsGrid />
                    </div>
                </div>

                <SwiperNavButtons
                    prevClassName="btn-prev-top-comments"
                    nextClassName="btn-next-top-comments"
                    className="!w-8 !h-8 md:!w-10 md:!h-10 !top-1/2 md:!top-[182px] !-translate-y-1/2 !bg-[#0F1115] !text-white/40 !border-white/10 hover:!text-white hover:!border-white/20 !absolute !z-50"
                />
            </div>
        </Container>
    );
}
