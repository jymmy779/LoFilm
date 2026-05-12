import { HOT_GENRES } from "@/app/data/social-stats";
import { Folder } from "lucide-react";

export default function GenreList() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
                <Folder className="w-5 h-5 text-blue-500 fill-blue-500" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Thể loại Hot</h3>
            </div>
            <div className="flex flex-col gap-2">
                {HOT_GENRES.map((genre, index) => (
                    <div key={genre.id} className="flex items-center gap-4 group cursor-pointer h-14">
                        <div className="w-6 text-white/20 font-black text-lg group-hover:text-white transition-colors shrink-0">
                            {index + 1}.
                        </div>
                        <div className="w-3 h-3 flex items-center justify-center shrink-0">
                            {genre.trend === 'up' ? (
                                <span className="text-green-400 text-[8px]">▲</span>
                            ) : genre.trend === 'down' ? (
                                <span className="text-red-400 text-[8px]">▼</span>
                            ) : (
                                <span className="text-white/20 text-[8px]">-</span>
                            )}
                        </div>
                        <div
                            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
                            style={{
                                backgroundColor: genre.color + '22',
                                color: genre.color,
                                border: `1px solid ${genre.color}44`,
                            }}
                        >
                            {genre.name}
                        </div>
                    </div>
                ))}
            </div>
            <button className="mt-auto cursor-pointer pt-6 text-[11px] text-white/30 hover:text-blue-400 tracking-widest transition-colors font-medium text-left">
                Xem thêm
            </button>
        </div>
    );
}
