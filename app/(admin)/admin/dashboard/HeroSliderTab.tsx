"use client";
import { useState, useTransition } from "react";
import { addStarredMovie, removeStarredMovie, updateStarredPriority } from "@/app/actions/adminStarred";
import toast from "react-hot-toast";
import Image from "next/image";

export default function HeroSliderTab({ initialStarredMovies }: { initialStarredMovies: any[] }) {
    const [starredMovies, setStarredMovies] = useState(initialStarredMovies);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchKeyword.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`/api/search?keyword=${encodeURIComponent(searchKeyword)}&limit=10`);
            const data = await res.json();
            if (data?.data?.items) {
                setSearchResults(data.data.items);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            toast.error("Lỗi khi tìm kiếm phim");
        } finally {
            setIsSearching(false);
        }
    };

    const handleStarMovie = (movie: any) => {
        if (starredMovies.length >= 8) {
            toast.error("Chỉ có thể đánh dấu tối đa 8 phim!");
            return;
        }
        
        if (starredMovies.some(m => m.slug === movie.slug)) {
            toast.error("Phim này đã được đánh dấu!");
            return;
        }

        const daysStr = prompt("Nhập số ngày muốn phim này được ưu tiên (để trống hoặc 0 nếu không giới hạn):", "3");
        let expires_in_days: number | null = null;
        if (daysStr && !isNaN(Number(daysStr)) && Number(daysStr) > 0) {
            expires_in_days = Number(daysStr);
        }

        startTransition(async () => {
            const res = await addStarredMovie(
                movie.slug,
                movie.name,
                `https://phimimg.com/${movie.thumb_url}`,
                `https://phimimg.com/${movie.poster_url}`,
                expires_in_days
            );
            if (res.error) {
                toast.error("Lỗi: " + res.error);
            } else {
                toast.success("Đã thêm phim vào Hero Slider!");
                // Optimistic update
                setStarredMovies([
                    ...starredMovies,
                    {
                        id: res.id, // Use real ID from DB
                        slug: movie.slug,
                        name: movie.name,
                        thumb_url: `https://phimimg.com/${movie.thumb_url}`,
                        poster_url: `https://phimimg.com/${movie.poster_url}`,
                        priority: res.priority,
                        expires_at: expires_in_days ? new Date(Date.now() + expires_in_days * 86400000).toISOString() : null
                    }
                ]);
            }
        });
    };

    const handleRemove = (id: string) => {
        if (confirm("Bỏ đánh dấu phim này?")) {
            startTransition(async () => {
                const res = await removeStarredMovie(id);
                if (res.error) {
                    toast.error("Lỗi: " + res.error);
                } else {
                    toast.success("Đã bỏ đánh dấu!");
                    setStarredMovies(starredMovies.filter(m => m.id !== id));
                }
            });
        }
    };

    const handleMovePriority = (id: string, currentPriority: number, direction: 'up' | 'down' | number) => {
        let newPriority: number;
        if (typeof direction === 'number') {
            newPriority = direction;
        } else {
            newPriority = direction === 'up' ? currentPriority - 1 : currentPriority + 1;
        }
        
        if (newPriority < 0) {
            toast.error("Vị trí không thể nhỏ hơn 0 (0 là vị trí hiển thị đầu tiên)");
            return;
        }

        if (newPriority === currentPriority) return;

        const duplicateMovie = starredMovies.find(m => m.id !== id && m.priority === newPriority);

        startTransition(async () => {
            if (duplicateMovie) {
                // Swap priorities
                const res1 = await updateStarredPriority(id, newPriority);
                const res2 = await updateStarredPriority(duplicateMovie.id, currentPriority);
                
                if (res1.error || res2.error) {
                    toast.error("Lỗi cập nhật vị trí");
                } else {
                    setStarredMovies(prev => 
                        prev.map(m => {
                            if (m.id === id) return { ...m, priority: newPriority };
                            if (m.id === duplicateMovie.id) return { ...m, priority: currentPriority };
                            return m;
                        }).sort((a, b) => a.priority - b.priority)
                    );
                }
            } else {
                const res = await updateStarredPriority(id, newPriority);
                if (res.error) {
                    toast.error("Lỗi: " + res.error);
                } else {
                    setStarredMovies(prev => 
                        prev.map(m => m.id === id ? { ...m, priority: newPriority } : m)
                            .sort((a, b) => a.priority - b.priority)
                    );
                }
            }
        });
    };

    const handleManualEditPriority = (movie: any) => {
        const input = prompt(`Nhập vị trí ưu tiên mới cho phim "${movie.name}" (0 là cao nhất):`, movie.priority.toString());
        if (!input) return;
        const newPriority = parseInt(input, 10);
        
        if (isNaN(newPriority)) {
            toast.error("Vui lòng nhập một số hợp lệ!");
            return;
        }
        
        handleMovePriority(movie.id, movie.priority, newPriority);
    };

    return (
        <div className="space-y-8">
            {/* Search Section */}
            <div className="bg-[#0d1b2e] rounded-lg p-6 border border-white/5">
                <h3 className="text-xl font-semibold mb-4">Tìm và đánh dấu phim mới</h3>
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Nhập tên phim cần tìm (VD: Mai, Đào Phở...)"
                        className="flex-1 bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 border border-white/10"
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="bg-amber-500 hover:bg-amber-600 text-[#0a1628] px-6 py-2 rounded font-bold transition-colors disabled:opacity-50"
                    >
                        {isSearching ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-search"></i>}
                        Tìm kiếm
                    </button>
                </form>

                {searchResults.length > 0 && (
                    <div className="space-y-3">
                        {searchResults.map((movie: any) => (
                            <div key={movie.slug} className="bg-[#152740] rounded-lg border border-white/10 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-lg text-white mb-1">{movie.name}</h4>
                                    <p className="text-sm text-gray-400 mb-2">{movie.origin_name} ({movie.year})</p>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                                            {movie.type === 'single' ? 'Phim Lẻ' : movie.type === 'series' ? 'Phim Bộ' : movie.type === 'hoathinh' ? 'Hoạt Hình' : movie.type === 'tvshows' ? 'TV Shows' : movie.type}
                                        </span>
                                        {movie.quality && (
                                            <span className="bg-white/10 text-gray-300 px-2 py-1 rounded border border-white/10">
                                                {movie.quality}
                                            </span>
                                        )}
                                        {movie.lang && (
                                            <span className="bg-white/10 text-gray-300 px-2 py-1 rounded border border-white/10">
                                                {movie.lang}
                                            </span>
                                        )}
                                        {movie.episode_current && (
                                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30">
                                                {movie.episode_current}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleStarMovie(movie)}
                                    disabled={isPending}
                                    className="bg-amber-500 hover:bg-amber-600 text-[#0a1628] px-4 py-2 rounded font-bold transition-colors w-full md:w-auto shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <i className="fa-solid fa-star"></i> Đánh dấu
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* List Section */}
            <div className="bg-[#0d1b2e] rounded-lg p-6 border border-white/5">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xl font-semibold">Phim đang được ưu tiên ({starredMovies.length}/8)</h3>
                    <p className="text-sm text-white/50">Phim hết hạn sẽ tự động biến mất</p>
                </div>
                
                {starredMovies.length === 0 ? (
                    <div className="text-center py-10 text-white/50 bg-[#152740] rounded-lg">
                        Chưa có phim nào được đánh dấu.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {starredMovies.map((movie) => (
                            <div key={movie.id} className="flex items-center gap-4 bg-[#152740] p-3 rounded-lg border border-white/5">

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-amber-400">{movie.name}</p>
                                    <div className="text-xs text-white/50 truncate flex items-center gap-2 mt-1">
                                        <span>Hết hạn: {movie.expires_at ? new Date(movie.expires_at).toLocaleDateString('vi-VN') : 'Vô hạn'}</span>
                                        {movie.expires_at && (
                                            <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                Còn {Math.max(0, Math.ceil((new Date(movie.expires_at).getTime() - Date.now()) / 86400000))} ngày
                                            </span>
                                        )}
                                    </div>
                                </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="flex flex-col gap-1 mr-2">
                                            <button onClick={() => handleMovePriority(movie.id, movie.priority, 'up')} className="text-white/40 hover:text-white p-1" title="Tăng ưu tiên (Lên trên)">
                                                <i className="fa-solid fa-chevron-up"></i>
                                            </button>
                                            <button onClick={() => handleMovePriority(movie.id, movie.priority, 'down')} className="text-white/40 hover:text-white p-1" title="Giảm ưu tiên (Xuống dưới)">
                                                <i className="fa-solid fa-chevron-down"></i>
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => handleManualEditPriority(movie)}
                                            className="text-xs bg-black/40 hover:bg-black/60 transition-colors px-2 py-1 flex items-center gap-1.5 rounded text-white/70 mr-2" 
                                            title="Bấm để sửa vị trí"
                                        >
                                            Vị trí: {movie.priority}
                                            <i className="fa-solid fa-pen text-[10px] text-amber-500/80"></i>
                                        </button>
                                        <button
                                            onClick={() => handleRemove(movie.id)}
                                            disabled={isPending}
                                        className="text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 p-2 rounded transition"
                                        title="Bỏ đánh dấu"
                                    >
                                        <i className="fa-solid fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
