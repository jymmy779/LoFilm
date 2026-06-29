"use client";
import { useState, useTransition, useEffect } from "react";
import { addExclusiveMovie, deleteExclusiveMovie, previewTMDB, updateExclusiveMovie, addEpisode, updateEpisode, deleteEpisode } from "@/app/actions/adminMovies";
import { updateSiteSetting } from "@/app/actions/adminSettings";

export default function AdminDashboard({ initialMovies, initialSettings }: { initialMovies: any[], initialSettings: any }) {
    const [movies, setMovies] = useState(initialMovies);
    const [settings, setSettings] = useState(initialSettings);
    const [activeTab, setActiveTab] = useState<"movies" | "settings">("movies");
    const [isPending, startTransition] = useTransition();

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<any>(null);
    const [showEpisodesModal, setShowEpisodesModal] = useState<any>(null);
    const [editingEpisode, setEditingEpisode] = useState<any>(null);

    // Form states for Add/Edit Movie
    const [tmdbId, setTmdbId] = useState("");
    const [type, setType] = useState<"single" | "series">("single");
    const [slug, setSlug] = useState("");
    const [status, setStatus] = useState("published");
    const [langTag, setLangTag] = useState("Vietsub Độc Quyền");
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewError, setPreviewError] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    
    // Auto-check PhimAPI states
    const [phimApiStatus, setPhimApiStatus] = useState<"checking" | "found" | "not_found" | "idle">("idle");
    const [phimApiData, setPhimApiData] = useState<any>(null);

    // Bulk Add states
    const [episodeTab, setEpisodeTab] = useState<"single" | "bulk">("single");

    // Check PhimAPI when slug changes
    useEffect(() => {
        if (!slug.trim()) {
            setPhimApiStatus("idle");
            setPhimApiData(null);
            return;
        }
        const timer = setTimeout(async () => {
            setPhimApiStatus("checking");
            try {
                const res = await fetch(`https://phimapi.com/v1/api/phim/${slug.trim()}`);
                const data = await res.json();
                if (data.status) {
                    setPhimApiStatus("found");
                    setPhimApiData(data);
                    // NẾU CÓ TMDB ID TỪ PHIMAPI THÌ FILL LUÔN
                    const tmdbIdFromApi = data.data?.item?.tmdb?.id || data.movie?.tmdb?.id;
                    if (tmdbIdFromApi) {
                        setTmdbId(prev => prev ? prev : tmdbIdFromApi);
                    }
                } else {
                    setPhimApiStatus("not_found");
                    setPhimApiData(null);
                }
            } catch (error) {
                setPhimApiStatus("not_found");
                setPhimApiData(null);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [slug]);

    const generateSlug = (str: string) => {
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    };

    const handlePreview = async (id: string) => {
        if (!id) return;
        setIsChecking(true);
        setPreviewError("");
        setPreviewData(null);
        
        const res = await previewTMDB(id, type);
        if (res.error) setPreviewError(res.error);
        else {
            setPreviewData(res);
            if (res.title && !slug) setSlug(generateSlug(res.title));
        }
        setIsChecking(false);
    };

    const handleSaveMovie = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            let res;
            if (showEditModal) {
                res = await updateExclusiveMovie(showEditModal.id, formData);
                
                // If it's a single movie and it has an episode, update its link
                if (type === 'single' && showEditModal.exclusive_episodes?.length > 0) {
                    const { updateEpisode } = await import("@/app/actions/adminMovies");
                    await updateEpisode(showEditModal.exclusive_episodes[0].id, formData);
                }
            } else {
                res = await addExclusiveMovie(formData);
            }
            if (res?.error) alert(res.error);
            else {
                alert("Lưu thành công!");
                window.location.reload();
            }
        });
    };

    const handleDeleteMovie = async (id: string) => {
        if (confirm("Bạn có chắc muốn xóa phim này?")) {
            startTransition(async () => {
                const res = await deleteExclusiveMovie(id);
                if (res?.error) alert(res.error);
                else window.location.reload();
            });
        }
    };

    const handleSaveEpisode = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            let res;
            if (editingEpisode) {
                res = await updateEpisode(editingEpisode.id, formData);
            } else {
                res = await addEpisode(showEpisodesModal.id, formData);
            }
            if (res?.error) alert(res.error);
            else window.location.reload();
        });
    };

    const handleDeleteEpisode = async (id: string) => {
        if (confirm("Xóa tập phim này?")) {
            startTransition(async () => {
                const res = await deleteEpisode(id);
                if (res?.error) alert(res.error);
                else window.location.reload();
            });
        }
    };

    const openEditModal = (movie: any) => {
        setShowEditModal(movie);
        setTmdbId(movie.tmdb_id);
        setType(movie.type);
        setSlug(movie.slug);
        setStatus(movie.status);
        setLangTag(movie.lang_tag || "Vietsub");
        handlePreview(movie.tmdb_id);
    };

    const saveSettings = (key: string, value: any) => {
        setSettings({ ...settings, [key]: value });
        startTransition(async () => {
            await updateSiteSetting(key, value);
        });
    };

    return (
        <div>
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
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
            </div>

            {/* Settings Tab */}
            {activeTab === "settings" && (
                <div className="bg-[#0d1b2e] rounded-lg p-6 border border-white/5 max-w-2xl">
                    <h3 className="text-xl mb-6 font-semibold">Cấu hình chung</h3>
                    
                    <div className="mb-6 flex items-center justify-between p-4 bg-[#152740] rounded-lg">
                        <div>
                            <div className="font-medium text-lg">Chế độ Bảo trì</div>
                            <div className="text-sm text-gray-400">Đóng website tạm thời, chuyển tất cả traffic về trang /maintenance</div>
                        </div>
                        <button 
                            disabled={isPending}
                            onClick={() => saveSettings('maintenance_mode', !settings.maintenance_mode)}
                            className={`w-14 h-7 rounded-full transition-colors relative ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-600'}`}
                        >
                            <span className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full transition-all ${settings.maintenance_mode ? 'right-1' : 'left-1'}`}></span>
                        </button>
                    </div>

                    <div className="p-4 bg-[#152740] rounded-lg">
                        <div className="mb-3">
                            <div className="font-medium text-lg">Sự kiện Đặc biệt (Hiệu ứng)</div>
                            <div className="text-sm text-gray-400">Kích hoạt các hiệu ứng đặc biệt trên toàn trang web.</div>
                        </div>
                        <select 
                            value={settings.active_event || 'none'}
                            onChange={(e) => saveSettings('active_event', e.target.value)}
                            disabled={isPending}
                            className="w-full bg-[#0a1628] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="none">Không có sự kiện (Mặc định)</option>
                            <option value="reunification">Giải phóng Miền Nam 30/4</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Movies Tab */}
            {activeTab === "movies" && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl">Danh sách phim</h2>
                        <button 
                            onClick={() => {
                                setShowEditModal(null);
                                setTmdbId("");
                                setSlug("");
                                setPreviewData(null);
                                setShowAddModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                        >
                            <i className="fa-solid fa-plus mr-2"></i> Thêm phim mới
                        </button>
                    </div>
                    
                    {movies.length === 0 ? (
                        <div className="text-gray-400 text-center py-10 bg-[#0d1b2e] rounded-lg border border-white/5">
                            Chưa có phim độc quyền nào.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left bg-[#0d1b2e] rounded-lg overflow-hidden whitespace-nowrap">
                                <thead className="bg-[#152740]">
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
                                    {movies.map(movie => (
                                        <tr key={movie.id} className="border-t border-white/5 hover:bg-white/5 transition">
                                            <td className="p-4">{movie.slug}</td>
                                            <td className="p-4 font-mono text-blue-400">{movie.tmdb_id}</td>
                                            <td className="p-4">{movie.type === 'single' ? 'Phim Lẻ' : 'Phim Bộ'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs ${movie.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                    {movie.status === 'published' ? 'Công khai' : 'Nháp'}
                                                </span>
                                            </td>
                                            <td className="p-4">{movie.type === 'single' ? '-' : (movie.exclusive_episodes?.length || 0)}</td>
                                            <td className="p-4 flex gap-3 justify-end">
                                                {movie.type !== 'single' && (
                                                    <button onClick={() => setShowEpisodesModal(movie)} className="text-blue-400 hover:text-blue-300 transition" title="Quản lý tập">
                                                        <i className="fa-solid fa-list"></i>
                                                    </button>
                                                )}
                                                <button onClick={() => openEditModal(movie)} className="text-yellow-400 hover:text-yellow-300 transition" title="Sửa">
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button onClick={() => handleDeleteMovie(movie.id)} disabled={isPending} className="text-red-400 hover:text-red-300 transition" title="Xóa">
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

            {/* Add / Edit Movie Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0d1b2e] p-6 rounded-lg w-full max-w-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto relative">
                        <button onClick={() => { setShowAddModal(false); setShowEditModal(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10">
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                        <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-3">{showEditModal ? "Sửa phim" : "Thêm phim độc quyền mới"}</h3>
                        
                        <form onSubmit={handleSaveMovie} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-gray-400 text-sm mb-1 block">Loại phim</label>
                                    <select name="type" value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="single">Phim Lẻ</option>
                                        <option value="series">Phim Bộ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-1 block">
                                        TMDB ID {phimApiStatus === 'found' ? <span className="text-green-400 text-xs font-normal ml-2">(Tùy chọn)</span> : <span className="text-red-400 text-xs font-normal ml-2">(*) Bắt buộc</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <input name="tmdb_id" type="text" value={tmdbId} onChange={e => setTmdbId(e.target.value)} required={phimApiStatus !== 'found'} className="w-full bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: 1139087" />
                                        <button type="button" onClick={() => handlePreview(tmdbId)} disabled={isChecking} className="bg-blue-600 hover:bg-blue-700 px-4 rounded transition shrink-0">
                                            {isChecking ? <i className="fa-solid fa-spinner fa-spin"></i> : "Check"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {previewError && <div className="text-red-500 text-sm">{previewError}</div>}
                            {previewData && (
                                <div className="flex gap-4 bg-[#152740] p-4 rounded-lg items-center border border-green-500/30">
                                    {previewData.poster && <img src={previewData.poster} alt={previewData.title} className="w-16 h-24 object-cover rounded" />}
                                    <div>
                                        <div className="font-bold text-green-400">{previewData.title}</div>
                                        <div className="text-sm text-gray-400 line-clamp-2 mt-1">{previewData.overview}</div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-gray-400 text-sm mb-1 block">Slug (URL Phim)</label>
                                    <input name="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ten-phim-viet-lien-khong-dau" />
                                    <div className="h-4 mt-1">
                                        {phimApiStatus === 'checking' && <div className="text-gray-400 text-xs">Đang kiểm tra PhimAPI...</div>}
                                        {phimApiStatus === 'found' && <div className="text-green-400 text-xs"><i className="fa-solid fa-check"></i> Đã có trên PhimAPI</div>}
                                        {phimApiStatus === 'not_found' && <div className="text-red-400 text-xs"><i className="fa-solid fa-xmark"></i> PhimAPI chưa có</div>}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-1 block">Trạng thái</label>
                                    <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="published">Công khai</option>
                                        <option value="draft">Bản nháp</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-1 block">Tag ngôn ngữ</label>
                                    <select name="lang_tag" value={langTag} onChange={(e) => setLangTag(e.target.value)} className="w-full bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="Vietsub Độc Quyền">Vietsub Độc Quyền</option>
                                        <option value="Song Ngữ Độc Quyền">Song Ngữ Độc Quyền</option>
                                        <option value="Lồng Tiếng Độc Quyền">Lồng Tiếng Độc Quyền</option>
                                        <option value="Thuyết Minh Độc Quyền">Thuyết Minh Độc Quyền</option>
                                    </select>
                                </div>
                            </div>

                            {(!showEditModal || type === 'single' || (type === 'series' && !showEditModal)) && (
                                <div className="border border-white/10 rounded-lg p-4 mt-2">
                                    <h4 className="font-semibold mb-3 text-sm text-gray-300">Thông tin {type === 'single' ? 'Video' : 'Tập phim'} {!showEditModal ? '(Mặc định ban đầu)' : ''}</h4>
                                    
                                    {(!showEditModal) && type === 'series' && (
                                        <div className="grid gap-4 mb-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-gray-400 text-sm mb-1 block">Danh sách M3U8 (Mỗi link 1 dòng)</label>
                                                    <textarea name="bulk_links" rows={5} className="w-full bg-[#152740] text-white rounded p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap overflow-x-auto" placeholder="https://link1.m3u8&#10;https://link2.m3u8"></textarea>
                                                </div>
                                                <div>
                                                    <label className="text-gray-400 text-sm mb-1 block">Danh sách VTT tương ứng (Tuỳ chọn)</label>
                                                    <textarea name="bulk_vtt_links" rows={5} className="w-full bg-[#152740] text-white rounded p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap overflow-x-auto" placeholder="https://sub1.vtt&#10;https://sub2.vtt&#10;(Để trống dòng nếu tập đó ko có sub)"></textarea>
                                                </div>
                                            </div>
                                            <div className="text-center text-sm text-gray-500 font-bold border-b border-white/5 pb-2">HOẶC THÊM NHANH 1 TẬP (Bỏ trống 2 ô trên)</div>
                                        </div>
                                    )}

                                    {showEditModal && type === 'single' && (
                                        <>
                                            <input type="hidden" name="name" value={showEditModal.exclusive_episodes?.[0]?.name || "Full"} />
                                            <input type="hidden" name="slug" value={showEditModal.exclusive_episodes?.[0]?.slug || "tap-full"} />
                                            <input type="hidden" name="order" value={showEditModal.exclusive_episodes?.[0]?.order || 1} />
                                        </>
                                    )}

                                    {(!showEditModal || type === 'single') && (
                                        <>
                                            <div className="mb-4">
                                                <label className="text-gray-400 text-sm mb-1 block">Link M3U8 (Video) {type === 'single' ? '' : '- 1 Tập'}</label>
                                                <input name="link_m3u8" type="url" defaultValue={showEditModal ? (showEditModal.exclusive_episodes?.[0]?.link_m3u8 || "") : ""} required={type === 'single'} className="w-full bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                                            </div>
                                            <div>
                                                <label className="text-gray-400 text-sm mb-1 block">Link VTT (Phụ đề Netflix) - <i>Không bắt buộc</i></label>
                                                <input name="link_vtt" type="url" defaultValue={showEditModal ? (showEditModal.exclusive_episodes?.[0]?.link_vtt || "") : ""} className="w-full bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(null); }} className="bg-[#152740] hover:bg-white/10 px-5 py-2 rounded transition">Hủy</button>
                                <button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded transition">
                                    {isPending ? "Đang lưu..." : "Lưu phim"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Episodes Modal */}
            {showEpisodesModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0d1b2e] p-6 rounded-lg w-full max-w-4xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-6 relative">
                        <button onClick={() => { setShowEpisodesModal(null); setEditingEpisode(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10">
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                        
                        {/* List Episodes */}
                        <div className="flex-1">
                            <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-3 pr-6">
                                {showEpisodesModal.type === 'single' ? 'Video: ' : 'Tập phim: '} <span className="text-blue-400">{showEpisodesModal.slug}</span>
                            </h3>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                {(showEpisodesModal.exclusive_episodes || []).sort((a: any, b: any) => a.order - b.order).map((ep: any) => (
                                    <div key={ep.id} className={`p-3 rounded-lg border flex justify-between items-center ${editingEpisode?.id === ep.id ? 'bg-blue-900/20 border-blue-500' : 'bg-[#152740] border-transparent'}`}>
                                        <div>
                                            <div className="font-medium text-sm">{ep.name} <span className="text-gray-500 text-xs ml-2">#{ep.order}</span></div>
                                            <div className="text-xs text-gray-400 mt-1 line-clamp-1">{ep.link_m3u8}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingEpisode(ep)} className="text-blue-400 p-2 hover:bg-white/5 rounded transition"><i className="fa-solid fa-pen"></i></button>
                                            <button onClick={() => handleDeleteEpisode(ep.id)} className="text-red-400 p-2 hover:bg-white/5 rounded transition"><i className="fa-solid fa-trash"></i></button>
                                        </div>
                                    </div>
                                ))}
                                {showEpisodesModal.exclusive_episodes?.length === 0 && (
                                    <div className="text-center text-gray-500 py-4">Chưa có tập nào</div>
                                )}
                            </div>
                        </div>

                        {/* Edit/Add Form */}
                        {!(showEpisodesModal.type === 'single' && !editingEpisode && (showEpisodesModal.exclusive_episodes?.length || 0) > 0) && (
                        <div className="flex-1 bg-[#152740] p-4 rounded-lg">
                            <div className="flex gap-4 mb-4 border-b border-white/10 pb-2">
                                <button type="button" onClick={() => setEpisodeTab("single")} className={`pb-2 px-2 font-medium text-sm transition ${episodeTab === 'single' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                                    {editingEpisode ? "Sửa tập" : "Thêm 1 tập"}
                                </button>
                                {!editingEpisode && showEpisodesModal.type !== 'single' && (
                                    <button type="button" onClick={() => setEpisodeTab("bulk")} className={`pb-2 px-2 font-medium text-sm transition ${episodeTab === 'bulk' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                                        Thêm nhiều tập (Bulk)
                                    </button>
                                )}
                            </div>

                            {episodeTab === 'single' ? (
                                <form onSubmit={handleSaveEpisode} className="flex flex-col gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">Tên {showEpisodesModal.type === 'single' ? 'Video' : 'tập'}</label>
                                            <input name="name" type="text" defaultValue={editingEpisode?.name || ""} required className="w-full bg-[#0a1628] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Tập 1" onChange={(e) => {
                                                if (!editingEpisode) {
                                                    const slugInput = e.target.form?.elements.namedItem("slug") as HTMLInputElement;
                                                    if (slugInput) slugInput.value = generateSlug(e.target.value);
                                                }
                                            }}/>
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">Slug</label>
                                            <input name="slug" type="text" defaultValue={editingEpisode?.slug || ""} required className="w-full bg-[#0a1628] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="tap-1" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs mb-1 block">Link M3U8</label>
                                        <input name="link_m3u8" type="url" defaultValue={editingEpisode?.link_m3u8 || ""} required className="w-full bg-[#0a1628] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs mb-1 block">Link VTT</label>
                                        <input name="link_vtt" type="url" defaultValue={editingEpisode?.link_vtt || ""} className="w-full bg-[#0a1628] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs mb-1 block">Thứ tự (Sắp xếp)</label>
                                        <input name="order" type="number" defaultValue={editingEpisode?.order || (showEpisodesModal.exclusive_episodes?.length || 0) + 1} required className="w-full bg-[#0a1628] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {editingEpisode && showEpisodesModal.type !== 'single' && (
                                            <button type="button" onClick={() => setEditingEpisode(null)} className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded text-sm transition">Hủy sửa</button>
                                        )}
                                        <button type="submit" disabled={isPending} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded text-sm transition">
                                            {isPending ? "Đang lưu..." : "Lưu"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    startTransition(async () => {
                                        const { bulkAddExclusiveEpisodes } = await import("@/app/actions/adminMovies");
                                        const res = await bulkAddExclusiveEpisodes(showEpisodesModal.id, parseInt(formData.get("start_episode") as string), formData.get("links") as string, formData.get("vtt_links") as string);
                                        if (res?.error) alert(res.error);
                                        else window.location.reload();
                                    });
                                }} className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-gray-400 text-xs mb-1 block">Bắt đầu từ tập số</label>
                                        <input name="start_episode" type="number" defaultValue={(showEpisodesModal.exclusive_episodes?.length || 0) + 1} required className="w-full bg-[#0a1628] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">Danh sách Link M3U8 (Mỗi link 1 dòng)</label>
                                            <textarea name="links" rows={6} required className="w-full bg-[#0a1628] text-white rounded p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 whitespace-nowrap overflow-x-auto" placeholder="https://link1.m3u8&#10;https://link2.m3u8"></textarea>
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">Danh sách VTT tương ứng (Tuỳ chọn)</label>
                                            <textarea name="vtt_links" rows={6} className="w-full bg-[#0a1628] text-white rounded p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 whitespace-nowrap overflow-x-auto" placeholder="https://sub1.vtt&#10;https://sub2.vtt&#10;(Để trống nếu ko có sub)"></textarea>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm transition font-medium">
                                            {isPending ? "Đang xử lý..." : "Thêm Hàng Loạt"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
