import Container from "@/app/components/UI/Container";
import TopCommentsSlider from "./TopCommentsSlider";
import StatsGrid from "./StatsGrid";
import { SocialDataProvider } from "./SocialDataContext";

export default function SocialStatsSection() {
    return (
        <SocialDataProvider>
            <Container as="section" className="relative z-30">
                <div className="bg-[#12151C]/60 border border-white/10 rounded-3xl relative group overflow-hidden shadow-xl">
                    <div className="relative z-10 p-4 sm:p-5 md:p-6 lg:p-8">
                        <TopCommentsSlider />
                        
                        <div className="mt-6 pt-6 sm:mt-8 sm:pt-8 md:mt-10 md:pt-8 border-t border-white/10 relative">
                            <StatsGrid />
                        </div>
                    </div>
                </div>
            </Container>
        </SocialDataProvider>
    );
}

