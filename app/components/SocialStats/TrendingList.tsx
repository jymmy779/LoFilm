import { TRENDING_MOVIES } from "@/app/data/social-stats";
import { Flame, TrendingUp } from "lucide-react";

export default function TrendingList() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Sôi nổi nhất</h3>
            </div>
            <div className="flex flex-col gap-2">
                {TRENDING_MOVIES.map((movie, index) => (
                    <div key={movie.id} className="flex items-center gap-4 group cursor-pointer h-14">
                        <div className="w-6 text-white/20 font-black text-lg group-hover:text-white transition-colors shrink-0">
                            {index + 1}.
                        </div>
                        <TrendingUp className="w-3 h-3 text-green-400 shrink-0" />
                        <div className="w-10 h-14 rounded-md overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-white/20 transition-all">
                            <img src={movie.poster} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-1">
                            {movie.title}
                        </span>
                    </div>
                ))}
            </div>
            <button className="mt-auto cursor-pointer pt-6 text-[11px] text-white/30 hover:text-amber-400 tracking-widest transition-colors font-medium text-left">
                Xem thêm
            </button>
        </div>
    );
}
