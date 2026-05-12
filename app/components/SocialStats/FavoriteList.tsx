import { WEEKLY_FAVORITES } from "@/app/data/social-stats";
import { Heart } from "lucide-react";

export default function FavoriteList() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Yêu thích tuần</h3>
            </div>
            <div className="flex flex-col gap-2">
                {WEEKLY_FAVORITES.map((movie, index) => (
                    <div key={movie.id} className="flex items-center gap-4 group cursor-pointer h-14">
                        <div className="w-6 text-white/20 font-black text-lg group-hover:text-white transition-colors shrink-0">
                            {index + 1}.
                        </div>
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-white/20 transition-all">
                            <img src={movie.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-1">
                            {movie.title}
                        </span>
                    </div>
                ))}
            </div>
            <button className="mt-auto pt-6 text-[11px] cursor-pointer text-white/30 hover:text-red-400 tracking-widest transition-colors font-medium text-left">
                Xem thêm
            </button>
        </div>
    );
}
