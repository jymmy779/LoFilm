import Container from "@/app/components/Container";
import TopCommentsSlider from "./TopCommentsSlider";
import StatsGrid from "./StatsGrid";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";

export default function SocialStatsSection() {
    return (
        <Container as="section" className="relative z-30 animate-fade-in py-8">
            <div className="border border-white/5 rounded-[2rem] relative group">
                <div className="relative z-10 p-6 md:p-8">
                    <TopCommentsSlider />
                    
                    <div className="mt-12 pt-10 border-t border-white/5 relative">
                        <StatsGrid />
                    </div>
                </div>

                <SwiperNavButtons
                    prevClassName="btn-prev-top-comments"
                    nextClassName="btn-next-top-comments"
                    className="!top-1/2 md:!top-[160px] !-translate-y-1/2 !bg-[#050a14] !text-white/40 !border-white/10 hover:!text-white hover:!border-white/20 !absolute !z-50"
                />
            </div>
        </Container>
    );
}
