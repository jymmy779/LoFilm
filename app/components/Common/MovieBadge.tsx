import { Movie } from "@/app/types/movie";
import { getEpisodeStatus } from "@/app/utils/movieUtils";

interface MovieBadgeProps {
    movie: Movie;
    variant?: "solid" | "glass" | "glass-exclusive" | "solid-exclusive";
    className?: string;
}

export function MovieQualityBadge({ movie, className = "" }: MovieBadgeProps) {
    return (
        <div className={`flex items-center justify-center whitespace-nowrap font-bold tracking-tighter leading-none ${className}`}>
            {movie.quality || "HD"}
        </div>
    );
}

export function MovieLangBadge({ movie, className = "" }: MovieBadgeProps) {
    const formatLang = (lang: string) => {
        return lang.replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM").replace(" Độc Quyền", "");
    };
    return (
        <div className={`flex items-center justify-center whitespace-nowrap font-bold tracking-tighter leading-none ${className}`}>
            {formatLang(movie.lang || "Vietsub")}
        </div>
    );
}

export function MovieEpisodeBadge({ movie, className = "" }: MovieBadgeProps) {
    return (
        <div className={`flex items-center justify-center whitespace-nowrap font-bold tracking-tighter leading-none ${className}`}>
            {getEpisodeStatus(movie)}
        </div>
    );
}

export function MovieExclusiveBadge({ movie, className = "" }: MovieBadgeProps) {
    const isExclusive = (movie as any).is_exclusive || movie.sub_docquyen;
    if (!isExclusive) return null;

    const getExclusiveBadgeStyle = (tag: string) => {
        if (tag?.includes("Song Ngữ")) return "bg-fuchsia-600/90 border-fuchsia-500/30";
        if (tag?.includes("Thuyết Minh")) return "bg-blue-600/90 border-blue-500/30";
        if (tag?.includes("Lồng Tiếng")) return "bg-emerald-600/90 border-emerald-500/30";
        if (tag?.includes("RAW")) return "bg-orange-600/90 border-orange-500/30";
        return "bg-red-600/90 border-red-500/30"; // Mặc định Vietsub là Đỏ
    };

    return (
        <div className={`${getExclusiveBadgeStyle(movie.lang || "")} backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-md border tracking-wide uppercase flex items-center gap-1 ${className}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            {movie.lang || "Vietsub Độc Quyền"}
        </div>
    );
}
