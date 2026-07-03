"use client";
import { useState, useTransition, useEffect } from "react";
import { addExclusiveMovie, previewTMDB } from "@/app/actions/adminMovies";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewMoviePage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Form states
    const [tmdbId, setTmdbId] = useState("");
    const [type, setType] = useState<"single" | "series">("single");
    const [slug, setSlug] = useState("");
    const [status, setStatus] = useState("draft");
    const [langTag, setLangTag] = useState("Vietsub Độc Quyền");
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewError, setPreviewError] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    
    // Auto-check PhimAPI states
    const [phimApiStatus, setPhimApiStatus] = useState<"checking" | "found" | "not_found" | "idle">("idle");
    const [phimApiData, setPhimApiData] = useState<any>(null);

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
        if (!id.trim()) { setPreviewError("Vui lòng nhập TMDB ID"); return; }
        setIsChecking(true); setPreviewError(""); setPreviewData(null);
        const res = await previewTMDB(id, type);
        setIsChecking(false);
        if (res.error) setPreviewError(res.error);
        else setPreviewData(res);
    };

    const handleSaveMovie = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries()) as Record<string, string>;
        
        startTransition(async () => {
            try {
                const res = await addExclusiveMovie(data);
                if (res.error) toast.error(res.error);
                else {
                    toast.success("Thêm phim thành công!");
                    router.push("/admin/dashboard");
                }
            } catch (err: any) {
                toast.error(`Lỗi hệ thống: ${err.message || "Không thể kết nối đến server"}`);
            }
        });
    };

    return (
        <div className="bg-[#0a1628] min-h-screen text-white">
            <header className="bg-[#0d1b2e] border-b border-white/10 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                        <i className="fa-solid fa-arrow-left"></i> Quay lại
                    </Link>
                    <span className="text-white font-medium border-l border-white/20 pl-4">Thêm Phim Mới</span>
                </div>
            </header>
            
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-[#0d1b2e] p-6 md:p-8 rounded-xl border border-white/10 shadow-2xl">
                    <form onSubmit={handleSaveMovie} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-gray-400 text-sm mb-1.5 block">Loại phim</label>
                                <select name="type" value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-[#152740] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="single">Phim Lẻ</option>
                                    <option value="series">Phim Bộ</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-1.5 block">
                                    TMDB ID {phimApiStatus === 'found' ? <span className="text-green-400 text-xs font-normal ml-2">(Tùy chọn)</span> : <span className="text-red-400 text-xs font-normal ml-2">(*) Bắt buộc</span>}
                                </label>
                                <div className="flex gap-2">
                                    <input name="tmdb_id" type="text" value={tmdbId} onChange={e => setTmdbId(e.target.value)} required={phimApiStatus !== 'found'} className="w-full bg-[#152740] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: 1139087" />
                                    <button type="button" onClick={() => handlePreview(tmdbId)} disabled={isChecking} className="bg-blue-600 hover:bg-blue-700 px-5 rounded-lg transition shrink-0 font-medium">
                                        {isChecking ? <i className="fa-solid fa-spinner fa-spin"></i> : "Check"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {previewError && <div className="text-red-500 text-sm">{previewError}</div>}
                        {previewData && (
                            <div className="flex gap-4 bg-[#152740] p-4 rounded-xl items-center border border-green-500/30">
                                {previewData.poster && <img src={previewData.poster} alt={previewData.title} className="w-16 h-24 object-cover rounded-lg shadow-md" />}
                                <div>
                                    <div className="font-bold text-green-400 text-lg">{previewData.title}</div>
                                    <div className="text-sm text-gray-400 line-clamp-2 mt-1">{previewData.overview}</div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-gray-400 text-sm mb-1.5 block">Slug (URL Phim)</label>
                                <input name="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full bg-[#152740] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ten-phim-viet-lien-khong-dau" />
                                <div className="h-5 mt-1.5">
                                    {phimApiStatus === 'checking' && <div className="text-gray-400 text-xs flex items-center gap-1"><i className="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra PhimAPI...</div>}
                                    {phimApiStatus === 'found' && <div className="text-green-400 text-xs flex items-center gap-1"><i className="fa-solid fa-check"></i> Đã có trên PhimAPI</div>}
                                    {phimApiStatus === 'not_found' && <div className="text-red-400 text-xs flex items-center gap-1"><i className="fa-solid fa-xmark"></i> PhimAPI chưa có (Sẽ dùng thông tin từ TMDB)</div>}
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-1.5 block">Trạng thái</label>
                                <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-[#152740] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="draft">Bản nháp</option>
                                    <option value="published">Công khai</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-1.5 block">Tag ngôn ngữ</label>
                                <select name="lang_tag" value={langTag} onChange={(e) => setLangTag(e.target.value)} className="w-full bg-[#152740] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="Vietsub Độc Quyền">Vietsub Độc Quyền</option>
                                    <option value="Song Ngữ Độc Quyền">Song Ngữ Độc Quyền</option>
                                    <option value="Lồng Tiếng Độc Quyền">Lồng Tiếng Độc Quyền</option>
                                    <option value="Thuyết Minh Độc Quyền">Thuyết Minh Độc Quyền</option>
                                </select>
                            </div>
                        </div>

                        {type === 'single' && (
                            <div className="border border-white/10 rounded-xl p-5 md:p-6 mt-2 bg-[#152740]/50">
                                <h4 className="font-semibold mb-4 text-sm text-gray-300 uppercase tracking-wider">Thông tin Video (Phim Lẻ)</h4>
                                
                                <div className="mb-5">
                                    <label className="text-gray-400 text-sm mb-1.5 block">Link M3U8 (Bắt buộc)</label>
                                    <input name="link_m3u8" type="url" required className="w-full bg-[#0a1628] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://pub-xxxx.r2.dev/phim-xxx/index.m3u8" />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm mb-1.5 block">
                                        Phụ đề (Song Ngữ) — <span className="text-gray-500 italic">Tùy chọn</span>
                                    </label>
                                    <textarea
                                        name="subtitle_tracks"
                                        rows={4}
                                        className="w-full bg-[#0a1628] text-white rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                                        placeholder={`Tiếng Việt|https://r2.../film-vi.vtt\nEnglish|https://r2.../film-en.vtt\n\n(Mỗi dòng: Tên Ngôn ngữ|URL)`}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">⚠️ Nếu chỉ có 1 dòng = Vietsub thường. Từ 2 dòng trở lên = Player sẽ có menu thả xuống chọn 2 phụ đề.</p>
                                </div>
                            </div>
                        )}
                        
                        {type === 'series' && (
                            <div className="border border-white/10 rounded-xl p-5 md:p-6 mt-2 bg-[#152740]/50">
                                <h4 className="font-semibold mb-2 text-sm text-gray-300 uppercase tracking-wider">Thêm Tập Phim</h4>
                                <p className="text-sm text-gray-400 mb-4">Với phim bộ, sau khi Lưu Phim xong, bạn sẽ được chuyển đến trang Quản lý Tập Phim để thêm các tập.</p>
                            </div>
                        )}

                        <div className="flex justify-end mt-4 pt-6 border-t border-white/10">
                            <button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition text-white w-full md:w-auto shadow-lg shadow-blue-900/20">
                                {isPending ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang lưu...</> : "Lưu Phim Mới"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
