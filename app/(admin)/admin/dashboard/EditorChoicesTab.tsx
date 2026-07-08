"use client";
import { useState, useTransition } from "react";
import { updateEditorChoicesConfig } from "@/app/actions/adminEditorChoices";
import toast from "react-hot-toast";

export default function EditorChoicesTab({ initialConfig }: { initialConfig: any }) {
    const [config, setConfig] = useState(initialConfig || { mode: "manual", autoCount: 30, movies: [] });
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

    const handleAddMovie = (movie: any) => {
        if (config.movies.some((m: any) => m.slug === movie.slug)) {
            toast.error("Phim này đã có trong danh sách!");
            return;
        }

        const newMovies = [
            {
                slug: movie.slug,
                name: movie.name,
                thumb_url: movie.thumb_url,
                poster_url: movie.poster_url
            },
            ...config.movies
        ];

        setConfig({ ...config, movies: newMovies });
        toast.success("Đã thêm vào danh sách, nhớ bấm Lưu cấu hình nhé!");
    };

    const handleRemoveMovie = (slug: string) => {
        setConfig({ ...config, movies: config.movies.filter((m: any) => m.slug !== slug) });
    };

    const handleMoveMovie = (index: number, direction: 'up' | 'down') => {
        const newMovies = [...config.movies];
        if (direction === 'up' && index > 0) {
            [newMovies[index - 1], newMovies[index]] = [newMovies[index], newMovies[index - 1]];
        } else if (direction === 'down' && index < newMovies.length - 1) {
            [newMovies[index + 1], newMovies[index]] = [newMovies[index], newMovies[index + 1]];
        }
        setConfig({ ...config, movies: newMovies });
    };

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateEditorChoicesConfig(config);
            if (res.error) {
                toast.error("Lỗi: " + res.error);
            } else {
                toast.success("Đã lưu cấu hình Editor Choices!");
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="bg-[#0F1115] rounded-lg p-6 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Cấu hình Editor's Choices</h3>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isPending ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-save"></i>}
                        Lưu Cấu Hình
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6 mb-8 p-4 bg-[#0F1115] rounded-lg border border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="mode"
                            checked={config.mode === 'manual'}
                            onChange={() => setConfig({ ...config, mode: 'manual' })}
                            className="w-5 h-5 accent-blue-500"
                        />
                        <span className="font-medium">Thủ công (Tự chọn phim)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="mode"
                            checked={config.mode === 'auto'}
                            onChange={() => setConfig({ ...config, mode: 'auto' })}
                            className="w-5 h-5 accent-blue-500"
                        />
                        <span className="font-medium">Tự động (Lấy phim nhiều lượt xem nhất)</span>
                    </label>
                </div>

                {config.mode === 'auto' && (
                    <div className="p-4 bg-[#0F1115] rounded-lg border border-white/10 flex items-center gap-4">
                        <label className="font-medium">Số lượng phim muốn hiển thị:</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={config.autoCount}
                            onChange={(e) => setConfig({ ...config, autoCount: parseInt(e.target.value) || 10 })}
                            className="bg-[#0F1115] text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10 w-24 text-center"
                        />
                        <span className="text-sm text-gray-400">Hệ thống sẽ lấy danh sách từ bảng movie_views</span>
                    </div>
                )}
            </div>

            {config.mode === 'manual' && (
                <>
                    {/* Search Section */}
                    <div className="bg-[#0F1115] rounded-lg p-6 border border-white/5">
                        <h3 className="text-lg font-semibold mb-4">Tìm và thêm phim</h3>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Nhập tên phim cần tìm..."
                                className="flex-1 bg-[#0F1115] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10"
                            />
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold transition-colors disabled:opacity-50"
                            >
                                {isSearching ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-search"></i>}
                                Tìm kiếm
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className="space-y-3">
                                {searchResults.map((movie: any) => (
                                    <div key={movie.slug} className="bg-[#0F1115] rounded-lg border border-white/10 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-white mb-1">{movie.name}</h4>
                                            <p className="text-sm text-gray-400 mb-2">{movie.origin_name} ({movie.year})</p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                                                    {movie.type}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddMovie(movie)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors w-full md:w-auto shrink-0 flex items-center justify-center gap-2"
                                        >
                                            <i className="fa-solid fa-plus"></i> Thêm
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* List Section */}
                    <div className="bg-[#0F1115] rounded-lg p-6 border border-white/5">
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-lg font-semibold">Danh sách đã chọn ({config.movies.length})</h3>
                        </div>
                        
                        {config.movies.length === 0 ? (
                            <div className="text-center py-10 text-white/50 bg-[#0F1115] rounded-lg">
                                Chưa có phim nào trong danh sách.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {config.movies.map((movie: any, index: number) => (
                                    <div key={movie.slug} className="flex items-center gap-4 bg-[#0F1115] p-3 rounded-lg border border-white/5">
                                        <div className="text-gray-500 font-mono w-6 text-center">{index + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-blue-400">{movie.name}</p>
                                            <p className="text-xs text-white/50 truncate">{movie.slug}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex flex-col gap-1 mr-2">
                                                <button onClick={() => handleMoveMovie(index, 'up')} disabled={index === 0} className="text-white/40 hover:text-white p-1 disabled:opacity-30">
                                                    <i className="fa-solid fa-chevron-up"></i>
                                                </button>
                                                <button onClick={() => handleMoveMovie(index, 'down')} disabled={index === config.movies.length - 1} className="text-white/40 hover:text-white p-1 disabled:opacity-30">
                                                    <i className="fa-solid fa-chevron-down"></i>
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMovie(movie.slug)}
                                                className="text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 p-2 rounded transition"
                                                title="Xóa"
                                            >
                                                <i className="fa-solid fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
