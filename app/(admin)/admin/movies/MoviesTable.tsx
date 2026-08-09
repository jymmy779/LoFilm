"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";

export default function MoviesTable({ 
    movies, 
    currentPage, 
    totalPages,
    totalItems,
    search 
}: { 
    movies: any[], 
    currentPage: number, 
    totalPages: number,
    totalItems: number,
    search: string
}) {
    const router = useRouter();
    const [searchValue, setSearchValue] = useState(search);
    const [isPending, startTransition] = useTransition();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/admin/movies?page=1&search=${encodeURIComponent(searchValue)}`);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        router.push(`/admin/movies?page=${page}&search=${encodeURIComponent(search)}`);
    };

    const handleDeleteMovie = async (id: string) => {
        if (confirm("Bạn có chắc muốn xóa phim này? Mọi tập phim và server bên trong cũng sẽ bị xóa vĩnh viễn!")) {
            startTransition(async () => {
                const supabase = createClient();
                // Because exclusive_episodes and cms_movie_sources have ON DELETE CASCADE (hopefully), 
                // deleting the movie will delete everything related to it.
                const { error } = await supabase.from('exclusive_movies').delete().eq('id', id);
                if (error) {
                    alert("Lỗi xóa phim: " + error.message);
                } else {
                    router.refresh();
                }
            });
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-semibold mb-1">Danh sách phim</h2>
                    <p className="text-sm text-gray-400">Hiển thị {movies.length} / {totalItems} phim</p>
                </div>
                
                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-96">
                    <input 
                        type="text" 
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Tìm kiếm phim theo tên, slug..."
                        className="flex-1 bg-[#0F1115] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#D497FF] transition"
                    />
                    <button type="submit" className="bg-[#D497FF]/10 text-[#D497FF] hover:bg-[#D497FF]/20 px-4 py-2 rounded-lg transition">
                        <i className="fa-solid fa-search"></i>
                    </button>
                </form>
            </div>

            {movies.length === 0 ? (
                <div className="text-gray-400 text-center py-20 bg-[#0F1115] rounded-xl border border-white/5">
                    Không tìm thấy bộ phim nào phù hợp.
                </div>
            ) : (
                <div className="bg-[#0F1115] rounded-xl border border-white/5 overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="p-4 font-medium text-gray-400">Phim</th>
                                    <th className="p-4 font-medium text-gray-400">Slug</th>
                                    <th className="p-4 font-medium text-gray-400">Loại</th>
                                    <th className="p-4 font-medium text-gray-400">Trạng thái</th>
                                    <th className="p-4 font-medium text-gray-400 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {movies.map((movie: any) => (
                                    <tr key={movie.id} className="hover:bg-white/5 transition group">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                                {movie.poster_url && (
                                                    <img src={movie.poster_url} alt={movie.name} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white truncate max-w-[200px] md:max-w-[300px]" title={movie.name}>
                                                    {movie.name}
                                                </div>
                                                <div className="text-xs text-gray-500">{movie.year || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-sm text-[#D497FF] truncate max-w-[150px]">{movie.slug}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-400">
                                                {movie.type === 'single' ? 'Phim lẻ' : movie.type === 'series' ? 'Phim bộ' : movie.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs ${movie.status === 'completed' || movie.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {movie.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2 justify-end opacity-50 group-hover:opacity-100 transition">
                                                <Link href={`/admin/movies/${movie.id}`} className="w-8 h-8 rounded bg-white/10 hover:bg-[#D497FF] hover:text-black flex items-center justify-center transition" title="Sửa phim">
                                                    <i className="fa-solid fa-pen"></i>
                                                </Link>
                                                <button onClick={() => handleDeleteMovie(movie.id)} disabled={isPending} className="w-8 h-8 rounded bg-white/10 hover:bg-red-500 hover:text-white flex items-center justify-center transition" title="Xóa">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-10 h-10 rounded-lg bg-[#0F1115] border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-[#0F1115] transition"
                    >
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    
                    <div className="text-sm px-4">
                        Trang <span className="text-[#D497FF] font-bold">{currentPage}</span> / {totalPages}
                    </div>

                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 rounded-lg bg-[#0F1115] border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-[#0F1115] transition"
                    >
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            )}
        </>
    );
}
