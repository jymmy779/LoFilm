"use client";
import { useState, useEffect, useTransition } from "react";
import { updateExclusiveMovie, addEpisode, updateEpisode, deleteEpisode, bulkAddExclusiveEpisodes } from "@/app/actions/adminMovies";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function MovieWorkspaceClient({ movie }: { movie: any }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Movie Edit State
    const [isEditingMovie, setIsEditingMovie] = useState(false);
    const [tmdbId, setTmdbId] = useState(movie.tmdb_id || "");
    const [type, setType] = useState<"single" | "series">(movie.type);
    const [slug, setSlug] = useState(movie.slug);
    const [status, setStatus] = useState(movie.status);
    const [langTag, setLangTag] = useState(movie.lang_tag || "Vietsub Độc Quyền");
    const [isStarred, setIsStarred] = useState(false);
    const [expiresDays, setExpiresDays] = useState("3");

    // Episodes State
    const [editingEpisode, setEditingEpisode] = useState<any>(null);
    const [episodeTab, setEpisodeTab] = useState<"single" | "bulk">("single");
    const [linkType, setLinkType] = useState<"m3u8" | "embed" | "both">("m3u8");
    const [bulkLinkType, setBulkLinkType] = useState<"m3u8" | "embed" | "both">("m3u8");

    useEffect(() => {
        if (editingEpisode) {
            if (editingEpisode.link_m3u8 && editingEpisode.link_embed) setLinkType("both");
            else if (editingEpisode.link_embed && !editingEpisode.link_m3u8) setLinkType("embed");
            else setLinkType("m3u8");
        } else {
            setLinkType("m3u8");
        }
    }, [editingEpisode]);

    // Sort episodes
    const episodes = [...(movie.exclusive_episodes || [])].sort((a: any, b: any) => a.order - b.order);

    const generateSlug = (str: string) => {
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    };

    const handleSaveMovie = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const data = {
            tmdb_id: tmdbId,
            type: type,
            slug: slug,
            status: status,
            lang_tag: langTag,
            is_starred: isStarred ? "true" : "false",
            expires_in_days: expiresDays
        };
        
        startTransition(async () => {
            try {
                const res = await updateExclusiveMovie(movie.id, data);
                if (res.error) toast.error(res.error);
                else {
                    toast.success("Cập nhật thông tin phim thành công");
                    setIsEditingMovie(false);
                    router.refresh();
                }
            } catch (err: any) {
                toast.error(`Lỗi: ${err?.message || "Vui lòng thử lại."}`);
            }
        });
    };

    const handleSaveEpisode = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries()) as Record<string, string>;
        
        startTransition(async () => {
            try {
                if (editingEpisode) {
                    const res = await updateEpisode(editingEpisode.id, data);
                    if (res.error) toast.error(res.error);
                    else {
                        toast.success("Đã cập nhật tập thành công!");
                        setEditingEpisode(null);
                        form.reset();
                        router.refresh();
                    }
                } else {
                    const res = await addEpisode(movie.id, data);
                    if (res.error) toast.error(res.error);
                    else {
                        toast.success("Đã thêm tập mới thành công!");
                        form.reset();
                        router.refresh();
                    }
                }
            } catch (err: any) {
                toast.error(`Lỗi: ${err?.message || "Không xác định được lỗi. Vui lòng thử lại."}`);
            }
        });
    };

    const handleBulkSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const links = formData.get("bulk_links") as string;
        const vttLinks = formData.get("bulk_vtt_links") as string;
        const embedLinks = formData.get("bulk_embed_links") as string;
        const status = formData.get("status") as string || "published";
        const startEpisode = (episodes.length || 0) + 1;

        startTransition(async () => {
            try {
                const res = await bulkAddExclusiveEpisodes(movie.id, startEpisode, links, vttLinks, embedLinks, status);
                if (res.error) toast.error(res.error);
                else {
                    toast.success("Đã thêm hàng loạt thành công!");
                    setEpisodeTab("single");
                    form.reset();
                    router.refresh();
                }
            } catch (err: any) {
                toast.error(`Lỗi: ${err?.message || "Vui lòng thử lại."}`);
            }
        });
    };

    const handleDeleteEpisode = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa tập này?")) return;
        startTransition(async () => {
            const res = await deleteEpisode(id);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Xóa tập thành công");
                if (editingEpisode?.id === id) setEditingEpisode(null);
                router.refresh();
            }
        });
    };

    return (
        <div className="bg-[#0F1115] min-h-screen text-white">
            <header className="bg-[#0F1115] border-b border-white/10 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                            <i className="fa-solid fa-arrow-left"></i> Danh sách phim
                        </Link>
                        <span className="text-white font-medium border-l border-white/20 pl-4">Quản lý Phim: {movie.slug}</span>
                    </div>
                    <Link href={`/phim/${movie.slug}?preview=true`} target="_blank" className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg transition font-medium text-sm flex items-center gap-2">
                        <i className="fa-solid fa-eye"></i> Xem trước trang khách
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">

                {/* --- MOVIE INFO SECTION --- */}
                <div className="bg-[#0F1115] p-6 rounded-xl border border-white/10 shadow-lg mb-6">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <i className="fa-solid fa-film text-blue-400"></i> Thông tin chung
                        </h2>
                        <button onClick={() => setIsEditingMovie(!isEditingMovie)} className="text-blue-400 hover:text-white transition text-sm flex items-center gap-2">
                            <i className={`fa-solid ${isEditingMovie ? 'fa-xmark' : 'fa-pen'}`}></i>
                            {isEditingMovie ? 'Hủy sửa' : 'Sửa thông tin'}
                        </button>
                    </div>

                    {isEditingMovie ? (
                        <form onSubmit={handleSaveMovie} className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">TMDB ID</label>
                                <input value={tmdbId} onChange={e => setTmdbId(e.target.value)} className="w-full bg-[#0F1115] rounded p-2 text-sm focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Slug</label>
                                <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full bg-[#0F1115] rounded p-2 text-sm focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Loại</label>
                                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-[#0F1115] rounded p-2 text-sm">
                                    <option value="single">Phim Lẻ</option>
                                    <option value="series">Phim Bộ</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Ngôn ngữ</label>
                                <select value={langTag} onChange={e => setLangTag(e.target.value)} className="w-full bg-[#0F1115] rounded p-2 text-sm">
                                    <option value="Vietsub Độc Quyền">Vietsub Độc Quyền</option>
                                    <option value="Song Ngữ Độc Quyền">Song Ngữ Độc Quyền</option>
                                    <option value="Lồng Tiếng Độc Quyền">Lồng Tiếng Độc Quyền</option>
                                    <option value="Thuyết Minh Độc Quyền">Thuyết Minh Độc Quyền</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Trạng thái</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#0F1115] rounded p-2 text-sm">
                                    <option value="draft">Bản nháp</option>
                                    <option value="published">Công khai</option>
                                </select>
                            </div>
                            
                            <div className="col-span-1 md:col-span-6 bg-[#0F1115]/50 border border-amber-500/30 rounded p-4 mt-2">
                                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                    <input 
                                        type="checkbox" 
                                        checked={isStarred} 
                                        onChange={(e) => setIsStarred(e.target.checked)} 
                                        className="w-4 h-4 accent-amber-500" 
                                    />
                                    <span className="font-semibold text-amber-400 text-sm">⭐ Đánh dấu ưu tiên lên Hero Slider (Ghi đè nếu đã có)</span>
                                </label>

                                {isStarred && (
                                    <div className="mt-3 ml-7 flex items-center gap-3">
                                        <label className="text-gray-400 text-xs">Số ngày hiển thị:</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={expiresDays} 
                                            onChange={(e) => setExpiresDays(e.target.value)} 
                                            className="w-24 bg-[#0F1115] text-white rounded p-1.5 text-sm focus:ring-1 focus:ring-amber-500 border border-white/5" 
                                            placeholder="Vô hạn" 
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-end col-span-1 md:col-span-6">
                                <button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm transition font-medium">
                                    {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div><div className="text-gray-400 text-xs mb-1">TMDB ID</div><div className="font-mono text-blue-400">{movie.tmdb_id}</div></div>
                            <div><div className="text-gray-400 text-xs mb-1">Slug</div><div>{movie.slug}</div></div>
                            <div><div className="text-gray-400 text-xs mb-1">Loại</div><div>{movie.type === 'single' ? 'Phim Lẻ' : 'Phim Bộ'}</div></div>
                            <div><div className="text-gray-400 text-xs mb-1">Ngôn ngữ</div><div><span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">{movie.lang_tag}</span></div></div>
                            <div>
                                <div className="text-gray-400 text-xs mb-1">Trạng thái</div>
                                <div>
                                    <span className={`px-2 py-0.5 rounded text-xs ${movie.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {movie.status === 'published' ? 'Công khai' : 'Bản nháp'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- EPISODES SECTION --- */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* LEFT COLUMN: EPISODES LIST */}
                    <div className="w-full lg:w-1/3 bg-[#0F1115] p-6 rounded-xl border border-white/10 shadow-lg shrink-0">
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <i className="fa-solid fa-list text-amber-400"></i> Danh sách tập ({episodes.length})
                            </h2>
                            <button
                                onClick={() => { setEditingEpisode(null); setEpisodeTab("single"); }}
                                className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition"
                            >
                                <i className="fa-solid fa-plus"></i> Thêm mới
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {episodes.map((ep: any) => (
                                <div key={ep.id} className={`p-3 rounded-lg border transition-all ${editingEpisode?.id === ep.id ? 'bg-blue-900/30 border-blue-500/50 shadow-inner' : 'bg-[#0F1115] border-transparent hover:border-white/10'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 overflow-hidden pr-2">
                                            <div className="font-medium text-sm flex items-center gap-2">
                                                {ep.name} <span className="text-gray-500 text-xs font-mono">#{ep.order}</span>
                                                {ep.subtitles && ep.subtitles.length > 1 && (
                                                    <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 text-[10px] rounded uppercase font-bold tracking-wider">Song ngữ</span>
                                                )}
                                                <span className={`px-1.5 py-0.5 text-[10px] rounded uppercase font-bold tracking-wider ${ep.status === 'draft' ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {ep.status === 'draft' ? 'Nháp' : 'Công khai'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 line-clamp-1 truncate" title={ep.link_m3u8}>{ep.link_m3u8}</div>
                                        </div>
                                        <div className="flex gap-1 shrink-0 items-center">
                                            <Link href={`/phim/${movie.slug}/${ep.slug}?preview=true`} target="_blank" className="text-green-400 p-1.5 hover:bg-white/10 rounded transition inline-flex" title="Xem trước tập này">
                                                <i className="fa-solid fa-eye text-sm"></i>
                                            </Link>
                                            <button onClick={() => { setEditingEpisode(ep); setEpisodeTab("single"); }} className="text-blue-400 p-1.5 hover:bg-white/10 rounded transition" title="Sửa"><i className="fa-solid fa-pen text-sm"></i></button>
                                            <button onClick={() => handleDeleteEpisode(ep.id)} disabled={isPending} className="text-red-400 p-1.5 hover:bg-white/10 rounded transition" title="Xóa"><i className="fa-solid fa-trash text-sm"></i></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {episodes.length === 0 && (
                                <div className="text-center text-gray-500 py-10 border border-dashed border-white/10 rounded-lg">
                                    Chưa có tập nào.<br />Hãy thêm tập đầu tiên bên phải.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: WORKSPACE FORM */}
                    <div className="w-full lg:w-2/3 bg-[#0F1115] p-6 rounded-xl border border-white/10 shadow-lg">
                        <div className="flex gap-6 mb-6 border-b border-white/10 pb-3">
                            <button
                                onClick={() => setEpisodeTab("single")}
                                className={`pb-3 -mb-3 px-2 font-medium text-sm transition-all ${episodeTab === 'single' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                            >
                                <i className="fa-solid fa-file-video mr-2"></i>
                                {editingEpisode ? `Đang sửa: ${editingEpisode.name}` : `Thêm 1 tập mới`}
                            </button>

                            {!editingEpisode && movie.type !== 'single' && (
                                <button
                                    onClick={() => setEpisodeTab("bulk")}
                                    className={`pb-3 -mb-3 px-2 font-medium text-sm transition-all ${episodeTab === 'bulk' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <i className="fa-solid fa-layer-group mr-2"></i>
                                    Thêm nhiều tập (Bulk)
                                </button>
                            )}
                        </div>

                        {episodeTab === 'single' ? (
                            <form onSubmit={handleSaveEpisode} className="flex flex-col gap-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1.5 block">Tên {movie.type === 'single' ? 'Video' : 'tập'}</label>
                                        <input name="name" type="text" defaultValue={editingEpisode?.name || ""} required className="w-full bg-[#0F1115] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Tập 1" onChange={(e) => {
                                            if (!editingEpisode) {
                                                const slugInput = e.target.form?.elements.namedItem("slug") as HTMLInputElement;
                                                if (slugInput) slugInput.value = generateSlug(e.target.value);
                                            }
                                        }} />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1.5 block">Slug</label>
                                        <input name="slug" type="text" defaultValue={editingEpisode?.slug || ""} required className="w-full bg-[#0F1115] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="tap-1" />
                                    </div>
                                </div>

                                {/* Link Type Selector */}
                                <div className="bg-[#0F1115]/50 p-3 rounded-lg border border-white/5 mb-2">
                                    <label className="text-gray-300 text-sm font-medium mb-2 block">Nguồn Video (Server phát)</label>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-white text-gray-400 transition">
                                            <input type="radio" name="linkTypeGroup" value="m3u8" checked={linkType === 'm3u8'} onChange={() => setLinkType('m3u8')} className="accent-blue-500 w-4 h-4" />
                                            Chỉ M3U8 (R2/B2)
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-white text-gray-400 transition">
                                            <input type="radio" name="linkTypeGroup" value="embed" checked={linkType === 'embed'} onChange={() => setLinkType('embed')} className="accent-blue-500 w-4 h-4" />
                                            Chỉ Embed (Loadvid)
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-white text-gray-400 transition">
                                            <input type="radio" name="linkTypeGroup" value="both" checked={linkType === 'both'} onChange={() => setLinkType('both')} className="accent-blue-500 w-4 h-4" />
                                            Dùng cả hai (Song song)
                                        </label>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 ${linkType === 'both' ? 'md:grid-cols-2' : ''} gap-5 mb-5`}>
                                    {(linkType === 'm3u8' || linkType === 'both') && (
                                        <div>
                                            <label className="text-gray-400 text-sm mb-1.5 block">Link M3U8 (Video Streaming - R2/B2)</label>
                                            <input name="link_m3u8" type="url" defaultValue={editingEpisode?.link_m3u8 || ""} className="w-full bg-[#0F1115] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" placeholder="https://pub-xxxx.r2.dev/.../index.m3u8" />
                                        </div>
                                    )}
                                    {(linkType === 'embed' || linkType === 'both') && (
                                        <div>
                                            <label className="text-gray-400 text-sm mb-1.5 block">Link Embed (Dự phòng - Loadvid)</label>
                                            <input name="link_embed" type="url" defaultValue={editingEpisode?.link_embed || ""} className="w-full bg-[#0F1115] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" placeholder="https://cdn.loadvid.com/..." />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-5 items-start">
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1.5 block">Thứ tự sắp xếp</label>
                                        <input name="order" type="number" defaultValue={editingEpisode?.order || episodes.length + 1} required className="w-full bg-[#0F1115] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-center" />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1.5 block">Trạng thái</label>
                                        <select name="status" defaultValue={editingEpisode?.status || "published"} className="w-full bg-[#0F1115] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                            <option value="draft">Bản nháp</option>
                                            <option value="published">Công khai</option>
                                        </select>
                                    </div>
                                </div>

                                {linkType !== 'embed' && (
                                    <div className="bg-[#0F1115]/50 border border-white/5 p-4 rounded-xl mt-2">
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="text-gray-300 font-medium block">
                                                Phụ đề (Song Ngữ)
                                            </label>
                                            <span className="text-xs text-amber-400/80 bg-amber-400/10 px-2 py-1 rounded"><i className="fa-solid fa-circle-info mr-1"></i>Mỗi dòng: Tên|URL</span>
                                        </div>
                                        <textarea
                                            name="subtitle_tracks"
                                            rows={6}
                                            defaultValue={(editingEpisode?.subtitles || [])
                                                .map((s: any) => `${s.label}|${s.url}`)
                                                .join('\n')}
                                            className="w-full bg-[#0F1115] text-white rounded-lg p-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600 leading-relaxed custom-scrollbar"
                                            placeholder={`Tiếng Việt|https://r2.../film-vi.vtt\nEnglish|https://r2.../film-en.vtt\n中文|https://r2.../film-zh.vtt`}
                                        />
                                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                                            <i className="fa-solid fa-lightbulb text-amber-500/70"></i>
                                            <span>Gõ từng ngôn ngữ xuống dòng. Subtitle chỉ áp dụng khi xem bằng link M3U8.</span>
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-white/5">
                                    {editingEpisode && (
                                        <button type="button" onClick={() => setEditingEpisode(null)} className="bg-transparent border border-white/20 hover:bg-white/10 px-6 py-2.5 rounded-lg text-sm transition">Hủy sửa</button>
                                    )}
                                    <button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 px-8 py-2.5 rounded-lg font-medium transition text-white shadow-lg shadow-blue-900/20">
                                        {isPending ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang lưu...</> : (editingEpisode ? "Lưu thay đổi" : "Thêm tập mới")}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleBulkSave} className="flex flex-col gap-5">
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-200/80 mb-2">
                                    Chế độ Bulk giúp bạn thêm nhanh hàng chục tập phim cùng lúc. Tên tập và Slug sẽ được tự động tạo theo thứ tự (Tập 1, Tập 2...).
                                </div>
                                
                                <div className="bg-[#0F1115]/50 p-3 rounded-lg border border-white/5 mb-2">
                                    <label className="text-gray-300 text-sm font-medium mb-2 block">Nguồn Video (Hàng loạt)</label>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-white text-gray-400 transition">
                                            <input type="radio" name="bulkLinkTypeGroup" value="m3u8" checked={bulkLinkType === 'm3u8'} onChange={() => setBulkLinkType('m3u8')} className="accent-blue-500 w-4 h-4" />
                                            Chỉ M3U8 (R2/B2)
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-white text-gray-400 transition">
                                            <input type="radio" name="bulkLinkTypeGroup" value="embed" checked={bulkLinkType === 'embed'} onChange={() => setBulkLinkType('embed')} className="accent-blue-500 w-4 h-4" />
                                            Chỉ Embed (Loadvid)
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-white text-gray-400 transition">
                                            <input type="radio" name="bulkLinkTypeGroup" value="both" checked={bulkLinkType === 'both'} onChange={() => setBulkLinkType('both')} className="accent-blue-500 w-4 h-4" />
                                            Dùng cả hai
                                        </label>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 ${bulkLinkType === 'both' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-5`}>
                                    {(bulkLinkType === 'm3u8' || bulkLinkType === 'both') && (
                                        <div>
                                            <label className="text-gray-400 text-sm mb-1.5 block">Danh sách M3U8 (Mỗi link 1 dòng)</label>
                                            <textarea name="bulk_links" rows={12} className="w-full bg-[#0F1115] text-white rounded-lg p-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 whitespace-nowrap overflow-x-auto custom-scrollbar" placeholder="https://link1.m3u8&#10;https://link2.m3u8"></textarea>
                                        </div>
                                    )}
                                    {(bulkLinkType === 'embed' || bulkLinkType === 'both') && (
                                        <div>
                                            <label className="text-gray-400 text-sm mb-1.5 block">Danh sách Embed Loadvid</label>
                                            <textarea name="bulk_embed_links" rows={12} className="w-full bg-[#0F1115] text-white rounded-lg p-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 whitespace-nowrap overflow-x-auto custom-scrollbar" placeholder="https://cdn.loadvid.com...&#10;https://cdn.loadvid.com..."></textarea>
                                        </div>
                                    )}
                                    {bulkLinkType !== 'embed' && (
                                        <div>
                                            <label className="text-gray-400 text-sm mb-1.5 block flex justify-between">
                                                Danh sách VTT tương ứng
                                                <span className="text-xs text-gray-500 font-normal italic">(Chỉ hỗ trợ 1 VTT/tập)</span>
                                            </label>
                                            <textarea name="bulk_vtt_links" rows={12} className="w-full bg-[#0F1115] text-white rounded-lg p-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 whitespace-nowrap overflow-x-auto custom-scrollbar" placeholder="https://sub1.vtt&#10;https://sub2.vtt&#10;&#10;(Bỏ trống dòng nếu tập đó ko có)"></textarea>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-1.5 block">Trạng thái mặc định</label>
                                    <select name="status" defaultValue="published" className="w-48 bg-[#0F1115] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                        <option value="draft">Bản nháp</option>
                                        <option value="published">Công khai</option>
                                    </select>
                                </div>
                                <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
                                    <button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 px-8 py-2.5 rounded-lg font-medium transition text-white shadow-lg shadow-green-900/20">
                                        {isPending ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang xử lý...</> : "Thêm tất cả vào danh sách"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
