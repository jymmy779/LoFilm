"use client";
import { useState, useTransition, useEffect } from "react";
import { deleteExclusiveMovie } from "@/app/actions/adminMovies";
import { updateSiteSetting } from "@/app/actions/adminSettings";
import Link from "next/link";
import toast from "react-hot-toast";
import HeroSliderTab from "./HeroSliderTab";
import EditorChoicesTab from "./EditorChoicesTab";

export default function AdminDashboard({ initialMovies, initialSettings, initialStarredMovies }: { initialMovies: any[], initialSettings: any, initialStarredMovies?: any[] }) {
    const [movies, setMovies] = useState(initialMovies);
    const [settings, setSettings] = useState(initialSettings);
    const [activeTab, setActiveTab] = useState<"movies" | "settings" | "hero" | "editor">("movies");
    const [isPending, startTransition] = useTransition();
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setMovies(initialMovies);
    }, [initialMovies]);

    useEffect(() => {
        setSettings(initialSettings);
        setHasChanges(false);
    }, [initialSettings]);

    const handleChangeSetting = (key: string, value: any) => {
        setSettings({ ...settings, [key]: value });
        setHasChanges(true);
    };

    const saveAllSettings = () => {
        startTransition(async () => {
            const keysToSave = Object.keys(settings);
            let hasError = false;
            
            for (const key of keysToSave) {
                if (settings[key] !== initialSettings[key]) {
                    const res = await updateSiteSetting(key, settings[key]);
                    if (res?.error) hasError = true;
                }
            }
            
            if (hasError) {
                toast.error("Có lỗi xảy ra khi lưu một số cài đặt!");
            } else {
                toast.success("Đã lưu tất cả cấu hình thành công!");
                setHasChanges(false);
            }
        });
    };

    const handleDeleteMovie = async (id: string) => {
        if (confirm("Bạn có chắc muốn xóa phim này? Mọi tập phim bên trong cũng sẽ bị xóa!")) {
            startTransition(async () => {
                const res = await deleteExclusiveMovie(id);
                if (res?.error) alert(res.error);
                else window.location.reload();
            });
        }
    };

    return (
        <div>
            {/* Tabs */}
            <div className="flex flex-wrap gap-4 mb-6 border-b border-white/10 pb-2">
                <button 
                    onClick={() => setActiveTab("movies")}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'movies' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-film mr-2"></i> Quản lý Phim
                </button>
                <button 
                    onClick={() => setActiveTab("settings")}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-cog mr-2"></i> Cấu hình Website
                </button>
                <button 
                    onClick={() => setActiveTab("hero")}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'hero' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-star mr-2"></i> Hero Slider
                </button>
                <button 
                    onClick={() => setActiveTab("editor")}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'editor' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-award mr-2"></i> Editor's Choices
                </button>
            </div>

            {/* Editor Choices Tab */}
            {activeTab === "editor" && (
                <EditorChoicesTab initialConfig={initialSettings?.editor_choices || { mode: "manual", autoCount: 30, movies: [] }} />
            )}

            {/* Hero Slider Tab */}
            {activeTab === "hero" && (
                <HeroSliderTab initialStarredMovies={initialStarredMovies || []} />
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
                <div className="bg-[#0F1115] rounded-lg p-6 border border-white/5 max-w-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold">Cấu hình chung</h3>
                        {hasChanges && (
                            <button
                                onClick={saveAllSettings}
                                disabled={isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm animate-fade-in"
                            >
                                {isPending ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-save"></i>}
                                Lưu thay đổi
                            </button>
                        )}
                    </div>
                    
                    <div className="mb-6 flex items-center justify-between p-4 bg-[#0F1115] rounded-lg">
                        <div>
                            <div className="font-medium text-lg">Chế độ Bảo trì</div>
                            <div className="text-sm text-gray-400">Đóng website tạm thời, chuyển tất cả traffic về trang /maintenance</div>
                        </div>
                        <button 
                            disabled={isPending}
                            onClick={() => handleChangeSetting('maintenance_mode', !settings.maintenance_mode)}
                            className={`w-14 h-7 rounded-full transition-colors relative ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-600'}`}
                        >
                            <span className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full transition-all ${settings.maintenance_mode ? 'right-1' : 'left-1'}`}></span>
                        </button>
                    </div>

                    <div className="p-4 bg-[#0F1115] rounded-lg mb-6">
                        <div className="mb-3">
                            <div className="font-medium text-lg">Sự kiện Đặc biệt (Hiệu ứng)</div>
                            <div className="text-sm text-gray-400">Kích hoạt các hiệu ứng đặc biệt trên toàn trang web.</div>
                        </div>
                        <select 
                            value={settings.active_event || 'none'}
                            onChange={(e) => handleChangeSetting('active_event', e.target.value)}
                            disabled={isPending}
                            className="w-full bg-[#0F1115] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="none">Không có sự kiện (Mặc định)</option>
                            <option value="reunification">Giải phóng Miền Nam 30/4</option>
                        </select>
                    </div>

                    <h3 className="text-xl mb-6 font-semibold border-t border-white/10 pt-6">Thông tin liên hệ & Mạng xã hội</h3>
                    
                    <div className="space-y-4">
                        {[
                            { key: 'contact_telegram', label: 'Telegram URL', icon: 'fa-telegram', color: 'text-[#0088cc]' },
                            { key: 'contact_telegram_name', label: 'Telegram Name (hiển thị)', icon: 'fa-telegram', color: 'text-[#0088cc]' },
                            { key: 'contact_discord', label: 'Discord URL', icon: 'fa-discord', color: 'text-[#5865F2]' },
                            { key: 'contact_facebook', label: 'Facebook URL', icon: 'fa-facebook', color: 'text-[#1877F2]' },
                            { key: 'contact_twitter', label: 'X (Twitter) URL', icon: 'fa-x-twitter', color: 'text-white' },
                            { key: 'contact_threads', label: 'Threads URL', icon: 'fa-threads', color: 'text-white' },
                            { key: 'contact_youtube', label: 'YouTube URL', icon: 'fa-youtube', color: 'text-[#FF0000]' },
                        ].map((field) => (
                            <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0F1115] rounded-lg gap-4">
                                <div className="flex items-center gap-3 w-1/3">
                                    <i className={`fa-brands ${field.icon} text-2xl ${field.color}`}></i>
                                    <div className="font-medium">{field.label}</div>
                                </div>
                                <input
                                    type="text"
                                    value={settings[field.key] || ''}
                                    placeholder={`Nhập ${field.label}...`}
                                    onChange={(e) => handleChangeSetting(field.key, e.target.value)}
                                    disabled={isPending}
                                    className="flex-1 bg-[#0F1115] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Movies Tab */}
            {activeTab === "movies" && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl">Danh sách phim</h2>
                        <Link 
                            href="/admin/movies/new"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition flex items-center"
                        >
                            <i className="fa-solid fa-plus mr-2"></i> Thêm phim mới
                        </Link>
                    </div>
                    
                    {movies.length === 0 ? (
                        <div className="text-gray-400 text-center py-10 bg-[#0F1115] rounded-lg border border-white/5">
                            Chưa có phim độc quyền nào.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left bg-[#0F1115] rounded-lg overflow-hidden whitespace-nowrap">
                                <thead className="bg-[#0F1115]">
                                    <tr>
                                        <th className="p-4">Slug</th>
                                        <th className="p-4">TMDB ID</th>
                                        <th className="p-4">Loại</th>
                                        <th className="p-4">Trạng thái</th>
                                        <th className="p-4">Số Tập</th>
                                        <th className="p-4 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movies.map((movie: any) => (
                                        <tr key={movie.id} className="border-t border-white/5 hover:bg-white/5 transition">
                                            <td className="p-4">{movie.slug}</td>
                                            <td className="p-4 font-mono text-blue-400">{movie.tmdb_id}</td>
                                            <td className="p-4">{movie.type === 'single' ? 'Phim Lẻ' : 'Phim Bộ'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs ${movie.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                    {movie.status === 'published' ? 'Công khai' : 'Nháp'}
                                                </span>
                                            </td>
                                            <td className="p-4">{movie.type === 'single' ? '-' : `${movie.exclusive_episodes?.filter((ep: any) => ep.status === 'published' || !ep.status).length || 0} / ${movie.exclusive_episodes?.length || 0}`}</td>
                                            <td className="p-4 flex gap-3 justify-end items-center">
                                                <Link href={`/admin/movies/${movie.id}`} className="text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 px-3 py-1.5 rounded transition flex items-center gap-2" title="Quản lý & Sửa phim">
                                                    <i className="fa-solid fa-pen-to-square"></i> Sửa / Quản lý tập
                                                </Link>
                                                <button onClick={() => handleDeleteMovie(movie.id)} disabled={isPending} className="text-red-400 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded transition" title="Xóa">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
