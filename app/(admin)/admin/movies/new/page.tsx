"use client";
import { useState, useTransition, useEffect } from "react";
import { addExclusiveMovie, previewTMDB, importMovieFromApi } from "@/app/actions/adminMovies";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewMoviePage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Tabs
    const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");

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

    // Helpers for Import images
    const getImportImages = () => {
        if (!importData) return { poster_url: "", thumb_url: "" };
        const movieData = importData.data?.item || importData.movie || {};
        const domain = (
            importData.data?.APP_DOMAIN_CDN_IMAGE || 
            importData.APP_DOMAIN_CDN_IMAGE || 
            importData.data?.pathImage || 
            importData.pathImage || 
            "https://phimimg.com"
        ).replace(/\/$/, "");
        const isOPhim = domain.includes("ophim") || (importData.data?.seoOnPage?.og_url?.includes("ophim") ?? false) || (importData.data?.seoOnPage?.seoSchema?.url?.includes("ophim") ?? false);

        const buildUrl = (path: string) => {
            if (!path) return "";
            let fullUrl = path;
            if (!path.startsWith("http://") && !path.startsWith("https://")) {
                const cleanPath = path.startsWith("/") ? path.slice(1) : path;
                if (cleanPath.startsWith("uploads/")) {
                    fullUrl = `${domain}/${cleanPath}`;
                } else {
                    fullUrl = `${domain}/uploads/movies/${cleanPath}`;
                }
            }
            if (fullUrl.includes("wsrv.nl")) return fullUrl;
            return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&output=webp`;
        };

        const rawPoster = movieData.poster_url || "";
        const rawThumb = movieData.thumb_url || "";

        if (isOPhim) {
            return {
                poster_url: buildUrl(rawThumb || rawPoster),
                thumb_url: buildUrl(rawPoster || rawThumb)
            };
        }

        return {
            poster_url: buildUrl(rawPoster || rawThumb),
            thumb_url: buildUrl(rawThumb || rawPoster)
        };
    };

    // Helper to parse movie data for preview UI
    const getParsedPreviewData = () => {
        if (!importData) return null;
        const rawMovie = importData.data?.item || importData.movie || {};
        
        let parsedCategory = rawMovie.category || [];
        let parsedCountry = rawMovie.country || [];
        let parsedYear = rawMovie.year;
        
        if (rawMovie.category && typeof rawMovie.category === 'object' && !Array.isArray(rawMovie.category)) {
            const catList: any[] = [];
            const countryList: any[] = [];
            Object.values(rawMovie.category).forEach((group: any) => {
                if (group.group?.name === "Thể loại" && group.list) {
                    catList.push(...group.list);
                } else if (group.group?.name === "Quốc gia" && group.list) {
                    countryList.push(...group.list);
                } else if (group.group?.name === "Năm" && group.list) {
                    const parsed = parseInt(group.list[0]?.name);
                    if (!isNaN(parsed)) parsedYear = parsed;
                }
            });
            parsedCategory = catList;
            if (countryList.length > 0) parsedCountry = countryList;
        }

        const episodes = rawMovie.episodes || importData.episodes || [];
        const firstServerEps = episodes[0]?.server_data || episodes[0]?.items || [];

        return {
            name: rawMovie.name,
            origin_name: rawMovie.origin_name || rawMovie.original_name || rawMovie.name,
            year: parsedYear,
            quality: rawMovie.quality || "HD",
            lang: rawMovie.lang || "Vietsub",
            episode_current: rawMovie.episode_current || rawMovie.current_episode || "Tập mới",
            time: rawMovie.time,
            server_name: episodes[0]?.server_name || "",
            country: parsedCountry,
            category: parsedCategory,
            director: typeof rawMovie.director === 'string' ? rawMovie.director.split(',').map((s:string)=>s.trim()) : (rawMovie.director || []),
            actor: typeof rawMovie.actor === 'string' ? rawMovie.actor.split(',').map((s:string)=>s.trim()) : (rawMovie.actor || rawMovie.casts?.split(',').map((s:string)=>s.trim()) || []),
            trailer_url: rawMovie.trailer_url,
            content: rawMovie.content || rawMovie.description || "",
            episodes_list: firstServerEps
        };
    };

    // Link Type State
    const [linkType, setLinkType] = useState<"m3u8" | "embed" | "both">("m3u8");

    // Starred & Exclusive State
    const [isStarred, setIsStarred] = useState(false);
    const [expiresDays, setExpiresDays] = useState("3");
    const [subDocquyenManual, setSubDocquyenManual] = useState(true);
    const [subDocquyenImport, setSubDocquyenImport] = useState(false);

    // Import states
    const [importUrl, setImportUrl] = useState("");
    const [importData, setImportData] = useState<any>(null);
    const [isFetchingImport, setIsFetchingImport] = useState(false);

    const handleFetchImport = async () => {
        if (!importUrl) {
            toast.error("Vui lòng nhập Link API");
            return;
        }
        setIsFetchingImport(true);
        try {
            const res = await fetch(importUrl);
            const data = await res.json();
            if (data.status) {
                setImportData(data);
                toast.success("Đã cào được dữ liệu phim!");
            } else {
                toast.error("Dữ liệu không hợp lệ");
            }
        } catch (err) {
            toast.error("Lỗi khi fetch data từ API");
        } finally {
            setIsFetchingImport(false);
        }
    };

    const handleImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries()) as Record<string, string>;

        startTransition(async () => {
            try {
                const res = await importMovieFromApi(importUrl, data);
                if (res.error) toast.error(res.error);
                else {
                    toast.success("Import phim thành công!");
                    router.push("/admin/dashboard");
                }
            } catch (err: any) {
                toast.error(`Lỗi hệ thống: ${err.message || "Lỗi import"}`);
            }
        });
    };

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
        <div className="bg-[#0F1115] min-h-screen text-white">
            <header className="bg-[#0F1115] border-b border-white/10 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                        <i className="fa-solid fa-arrow-left"></i> Quay lại
                    </Link>
                    <span className="text-white font-medium border-l border-white/20 pl-4">Thêm Phim Mới</span>
                </div>
            </header>
            
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex gap-2 mb-6">
                    <button 
                        onClick={() => setActiveTab('manual')}
                        className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === 'manual' ? 'bg-[#D497FF] text-white shadow-lg' : 'bg-[#0F1115] text-gray-400 hover:bg-white/5 border border-white/10'}`}
                    >
                        Thêm Thủ Công
                    </button>
                    <button 
                        onClick={() => setActiveTab('import')}
                        className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === 'import' ? 'bg-amber-600 text-white shadow-lg' : 'bg-[#0F1115] text-gray-400 hover:bg-white/5 border border-white/10'}`}
                    >
                        <i className="fa-solid fa-cloud-arrow-down"></i> Import từ API OPhim/KKPhim
                    </button>
                </div>

                <div className="bg-[#0F1115] p-6 md:p-8 rounded-xl border border-white/10 shadow-2xl">
                    {activeTab === 'manual' ? (
                    <form onSubmit={handleSaveMovie} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-gray-400 text-sm mb-1.5 block">Loại phim</label>
                                <select name="type" value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-[#0F1115] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D497FF]">
                                    <option value="single">Phim Lẻ</option>
                                    <option value="series">Phim Bộ</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-1.5 block">
                                    TMDB ID {phimApiStatus === 'found' ? <span className="text-green-400 text-xs font-normal ml-2">(Tùy chọn)</span> : <span className="text-red-400 text-xs font-normal ml-2">(*) Bắt buộc</span>}
                                </label>
                                <div className="flex gap-2">
                                    <input name="tmdb_id" type="text" value={tmdbId} onChange={e => setTmdbId(e.target.value)} required={phimApiStatus !== 'found'} className="w-full bg-[#0F1115] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D497FF]" placeholder="Ví dụ: 1139087" />
                                    <button type="button" onClick={() => handlePreview(tmdbId)} disabled={isChecking} className="bg-[#D497FF] hover:bg-[#D497FF] px-5 rounded-lg transition shrink-0 font-medium">
                                        {isChecking ? <i className="fa-solid fa-spinner fa-spin"></i> : "Check"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {previewError && <div className="text-red-500 text-sm">{previewError}</div>}
                        {previewData && (
                            <div className="flex gap-4 bg-[#0F1115] p-4 rounded-xl items-center border border-green-500/30">
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
                                <input name="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full bg-[#0F1115] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D497FF]" placeholder="ten-phim-viet-lien-khong-dau" />
                                <div className="h-5 mt-1.5">
                                    {phimApiStatus === 'checking' && <div className="text-gray-400 text-xs flex items-center gap-1"><i className="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra PhimAPI...</div>}
                                    {phimApiStatus === 'found' && <div className="text-green-400 text-xs flex items-center gap-1"><i className="fa-solid fa-check"></i> Đã có trên PhimAPI</div>}
                                    {phimApiStatus === 'not_found' && <div className="text-red-400 text-xs flex items-center gap-1"><i className="fa-solid fa-xmark"></i> PhimAPI chưa có (Sẽ dùng thông tin từ TMDB)</div>}
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-1.5 block">Trạng thái</label>
                                <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-[#0F1115] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D497FF]">
                                    <option value="draft">Bản nháp</option>
                                    <option value="published">Công khai</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-1.5 block">Tag ngôn ngữ</label>
                                <select name="lang_tag" value={langTag} onChange={(e) => setLangTag(e.target.value)} className="w-full bg-[#0F1115] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D497FF]">
                                    {subDocquyenManual ? (
                                        <>
                                            <option value="Vietsub Độc Quyền">Vietsub Độc Quyền</option>
                                            <option value="Song Ngữ Độc Quyền">Song Ngữ Độc Quyền</option>
                                            <option value="Lồng Tiếng Độc Quyền">Lồng Tiếng Độc Quyền</option>
                                            <option value="Thuyết Minh Độc Quyền">Thuyết Minh Độc Quyền</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Vietsub">Vietsub</option>
                                            <option value="Song Ngữ">Song Ngữ</option>
                                            <option value="Lồng Tiếng">Lồng Tiếng</option>
                                            <option value="Thuyết Minh">Thuyết Minh</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Exclusive Tag Checkbox */}
                        <div className="bg-[#0F1115]/50 border border-purple-500/30 rounded-xl p-5 md:p-6">
                            <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                <div className="relative flex items-center justify-center w-6 h-6">
                                    <input 
                                        type="checkbox" 
                                        name="sub_docquyen" 
                                        checked={subDocquyenManual} 
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setSubDocquyenManual(checked);
                                            setLangTag(prev => checked ? `${prev.replace(" Độc Quyền", "")} Độc Quyền` : prev.replace(" Độc Quyền", ""));
                                        }} 
                                        className="appearance-none w-6 h-6 border-2 border-purple-500/50 rounded bg-transparent checked:bg-purple-600 transition-colors peer cursor-pointer" 
                                    />
                                    <i className="fa-solid fa-check absolute text-white text-xs opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></i>
                                </div>
                                <div className="flex-1">
                                    <span className="font-semibold text-purple-400 group-hover:text-purple-300 transition">👑 Đánh dấu là Phim Độc Quyền</span>
                                    <p className="text-sm text-gray-400 mt-0.5">Hiển thị badge "Độc Quyền" màu nổi bật ở góc trên poster phim</p>
                                </div>
                            </label>
                        </div>

                        {/* Starred UI */}
                        <div className="bg-[#0F1115]/50 border border-[#D497FF]/30 rounded-xl p-5 md:p-6 mt-2">
                            <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                <div className="relative flex items-center justify-center w-6 h-6">
                                    <input 
                                        type="checkbox" 
                                        name="is_starred" 
                                        checked={isStarred} 
                                        onChange={(e) => setIsStarred(e.target.checked)} 
                                        className="appearance-none w-6 h-6 border-2 border-[#D497FF]/50 rounded bg-transparent checked:bg-amber-500 transition-colors peer cursor-pointer" 
                                    />
                                    <i className="fa-solid fa-check absolute text-[#0F1115] text-xs opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></i>
                                </div>
                                <div className="flex-1">
                                    <span className="font-semibold text-amber-400 group-hover:text-amber-300 transition">⭐ Đánh dấu ưu tiên lên Hero Slider</span>
                                    <p className="text-sm text-gray-400 mt-0.5">Phim sẽ được đặt lên vị trí đầu tiên ngoài trang chủ</p>
                                </div>
                            </label>

                            {isStarred && (
                                <div className="mt-4 ml-9 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    <div className="flex-1 max-w-xs">
                                        <label className="text-gray-400 text-sm mb-1.5 block">Thời gian hiển thị (Số ngày)</label>
                                        <input 
                                            name="expires_in_days" 
                                            type="number" 
                                            min="0"
                                            value={expiresDays} 
                                            onChange={(e) => setExpiresDays(e.target.value)} 
                                            className="w-full bg-[#0F1115] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 border border-white/5" 
                                            placeholder="Để trống hoặc 0 nếu không giới hạn" 
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 md:w-1/2 mt-2 md:mt-6">
                                        Sau <span className="text-amber-400 font-bold">{expiresDays || 'vô hạn'}</span> ngày, hệ thống sẽ tự động gỡ phim khỏi Hero Slider.
                                    </p>
                                </div>
                            )}
                        </div>

                        {type === 'single' && (
                            <div className="border border-white/10 rounded-xl p-5 md:p-6 mt-2 bg-[#0F1115]/50">
                                <h4 className="font-semibold mb-4 text-sm text-gray-300 uppercase tracking-wider">Thông tin Video (Phim Lẻ)</h4>
                                
                                <div className="bg-[#0F1115]/50 p-3 rounded-lg border border-white/5 mb-5">
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
                                            Dùng cả hai
                                        </label>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 ${linkType === 'both' ? 'md:grid-cols-2' : ''} gap-5 mb-5`}>
                                    {(linkType === 'm3u8' || linkType === 'both') && (
                                        <div>
                                            <label className="text-gray-400 text-sm mb-1.5 block">Link M3U8 (Video Streaming - R2/B2)</label>
                                            <input name="link_m3u8" type="url" className="w-full bg-[#0F1115] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D497FF]" placeholder="https://pub-xxxx.r2.dev/phim-xxx/index.m3u8" />
                                        </div>
                                    )}
                                    {(linkType === 'embed' || linkType === 'both') && (
                                        <div>
                                            <label className="text-gray-400 text-sm mb-1.5 block">Link Embed (Dự phòng - Loadvid)</label>
                                            <input name="link_embed" type="url" className="w-full bg-[#0F1115] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D497FF]" placeholder="https://cdn.loadvid.com/..." />
                                        </div>
                                    )}
                                </div>

                                {linkType !== 'embed' && (
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1.5 block">
                                            Phụ đề (Song Ngữ) — <span className="text-gray-500 italic">Tùy chọn</span>
                                        </label>
                                        <textarea
                                            name="subtitle_tracks"
                                            rows={4}
                                            className="w-full bg-[#0F1115] text-white rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D497FF] placeholder:text-gray-600"
                                            placeholder={`Tiếng Việt|https://r2.../film-vi.vtt\nEnglish|https://r2.../film-en.vtt\n\n(Mỗi dòng: Tên Ngôn ngữ|URL)`}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">⚠️ Subtitle chỉ áp dụng khi xem bằng link M3U8.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {type === 'series' && (
                            <div className="border border-white/10 rounded-xl p-5 md:p-6 mt-2 bg-[#0F1115]/50">
                                <h4 className="font-semibold mb-2 text-sm text-gray-300 uppercase tracking-wider">Thêm Tập Phim</h4>
                                <p className="text-sm text-gray-400 mb-4">Với phim bộ, sau khi Lưu Phim xong, bạn sẽ được chuyển đến trang Quản lý Tập Phim để thêm các tập.</p>
                            </div>
                        )}

                        <div className="flex justify-end mt-4 pt-6 border-t border-white/10">
                            <button type="submit" disabled={isPending} className="bg-[#D497FF] hover:bg-[#D497FF] px-8 py-3 rounded-lg font-medium transition text-white w-full md:w-auto shadow-lg shadow-[#D497FF]/20">
                                {isPending ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang lưu...</> : "Lưu Phim Mới"}
                            </button>
                        </div>
                    </form>
                    ) : (
                    <form onSubmit={handleImportSubmit} className="flex flex-col gap-6">
                        <div className="bg-[#0F1115]/50 border border-[#D497FF]/30 rounded-xl p-5 md:p-6 mb-2">
                            <h4 className="font-semibold mb-4 text-sm text-gray-300 uppercase tracking-wider">Nhập Link API (OPhim / KKPhim)</h4>
                            <div className="flex flex-col md:flex-row gap-3">
                                <input 
                                    type="url" 
                                    value={importUrl} 
                                    onChange={(e) => setImportUrl(e.target.value)} 
                                    required 
                                    className="flex-1 bg-[#0F1115] text-white rounded-lg p-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#D497FF]" 
                                    placeholder="VD: https://ophim1.com/v1/api/phim/san-lung-tho-ngoc" 
                                />
                                <button type="button" onClick={handleFetchImport} disabled={isFetchingImport} className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg transition font-medium text-white shadow-lg shrink-0">
                                    {isFetchingImport ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang lấy...</> : "Kiểm tra Dữ liệu"}
                                </button>
                            </div>
                        </div>

                        {importData && (
                            <>
                                <div className="border border-green-500/30 bg-green-500/5 p-4 md:p-6 rounded-xl flex flex-col gap-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                                        <i className="fa-solid fa-circle-check"></i> Dữ liệu hợp lệ
                                    </div>
                                    
                                    <div className="flex flex-col lg:flex-row gap-5 items-start">
                                        {/* Images Preview */}
                                        <div className="flex flex-wrap gap-3 shrink-0">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] text-gray-400 font-medium">Poster (Ảnh đứng)</span>
                                                <img src={getImportImages().poster_url} alt="Poster" className="w-24 md:w-28 rounded-lg shadow-lg object-cover aspect-[2/3] border border-white/10" />
                                            </div>
                                            {getImportImages().thumb_url && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[11px] text-gray-400 font-medium">Thumb (Ảnh nằm)</span>
                                                    <img src={getImportImages().thumb_url} alt="Thumb" className="w-40 md:w-44 rounded-lg shadow-lg object-cover aspect-video border border-white/10" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Movie Info */}
                                        <div className="flex-1 w-full">
                                            <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                                                {getParsedPreviewData()?.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm mb-3">
                                                {getParsedPreviewData()?.origin_name} {getParsedPreviewData()?.year ? `(${getParsedPreviewData()?.year})` : ""}
                                            </p>

                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className="bg-[#D497FF]/20 border border-[#D497FF]/30 text-[#D497FF] px-2.5 py-0.5 rounded-md text-xs font-semibold">
                                                    {getParsedPreviewData()?.quality}
                                                </span>
                                                <span className="bg-amber-500/20 border border-[#D497FF]/30 text-amber-400 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                                                    {getParsedPreviewData()?.lang}
                                                </span>
                                                <span className="bg-purple-500/20 border border-purple-500/30 text-purple-400 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                                                    {getParsedPreviewData()?.episode_current}
                                                </span>
                                                {getParsedPreviewData()?.time && (
                                                    <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                                                        <i className="fa-regular fa-clock mr-1"></i>
                                                        {getParsedPreviewData()?.time}
                                                    </span>
                                                )}
                                                {getParsedPreviewData()?.server_name && (
                                                    <span className="bg-rose-500/20 border border-rose-500/30 text-rose-400 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                                                        <i className="fa-solid fa-server mr-1"></i>
                                                        {getParsedPreviewData()?.server_name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Metadata Details Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs bg-black/40 p-3.5 rounded-lg border border-white/5 mb-3">
                                                <div>
                                                    <span className="text-gray-400 font-medium">Quốc gia: </span>
                                                    <span className="text-gray-200">
                                                        {getParsedPreviewData()?.country?.length
                                                            ? getParsedPreviewData()?.country.map((c: any) => c.name).join(", ")
                                                            : "Đang cập nhật"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-medium">Thể loại: </span>
                                                    <span className="text-gray-200">
                                                        {getParsedPreviewData()?.category?.length
                                                            ? getParsedPreviewData()?.category.map((c: any) => c.name).join(", ")
                                                            : "Đang cập nhật"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-medium">Đạo diễn: </span>
                                                    <span className="text-gray-200">
                                                        {getParsedPreviewData()?.director?.filter(Boolean).join(", ") || "Đang cập nhật"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 font-medium">Diễn viên: </span>
                                                    <span className="text-gray-200 line-clamp-1">
                                                        {getParsedPreviewData()?.actor?.filter(Boolean).join(", ") || "Đang cập nhật"}
                                                    </span>
                                                </div>
                                                {getParsedPreviewData()?.trailer_url && (
                                                    <div className="md:col-span-2">
                                                        <span className="text-gray-400 font-medium">Trailer: </span>
                                                        <a href={getParsedPreviewData()?.trailer_url} target="_blank" rel="noreferrer" className="text-[#D497FF] hover:underline">
                                                            {getParsedPreviewData()?.trailer_url}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Overview content */}
                                            <div className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                                                {getParsedPreviewData()?.content?.replace(/<[^>]*>?/gm, '')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1.5 block">Trạng thái sau khi Import</label>
                                        <select name="status" className="w-full bg-[#0F1115] text-white rounded-lg p-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#D497FF]">
                                            <option value="published">Công khai (Hiển thị ngay)</option>
                                            <option value="draft">Bản nháp (Ẩn)</option>
                                        </select>
                                    </div>
                                    <div className="bg-[#0F1115]/50 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-center">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                                                <input 
                                                    type="checkbox" 
                                                    name="sub_docquyen" 
                                                    checked={subDocquyenImport}
                                                    onChange={(e) => setSubDocquyenImport(e.target.checked)}
                                                    className="appearance-none w-5 h-5 border-2 border-purple-500/50 rounded bg-transparent checked:bg-purple-600 transition-colors peer cursor-pointer" 
                                                />
                                                <i className="fa-solid fa-check absolute text-white text-[10px] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></i>
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-medium text-purple-400 group-hover:text-purple-300 transition text-sm">👑 Hiển thị Tag Độc Quyền</span>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="bg-[#0F1115]/50 border border-[#D497FF]/30 rounded-xl p-4 flex flex-col justify-center">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_starred" 
                                                    className="appearance-none w-5 h-5 border-2 border-[#D497FF]/50 rounded bg-transparent checked:bg-amber-500 transition-colors peer cursor-pointer" 
                                                />
                                                <i className="fa-solid fa-check absolute text-[#0F1115] text-[10px] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></i>
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-medium text-amber-400 group-hover:text-amber-300 transition text-sm">⭐ Lên Hero Slider</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="border border-white/10 rounded-xl p-5 mt-2 bg-[#0F1115]/30">
                                    <h4 className="font-semibold mb-4 text-sm text-gray-300 uppercase tracking-wider flex justify-between items-center">
                                        <span>Danh sách Tập Sẽ Import</span>
                                        <span className="bg-white/10 px-2 py-1 rounded text-xs text-white">{getParsedPreviewData()?.episodes_list?.length || 0} tập</span>
                                    </h4>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                        {getParsedPreviewData()?.episodes_list?.map((ep: any, idx: number) => (
                                            <span key={idx} className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-sm">
                                                {ep.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end mt-4 pt-6 border-t border-white/10">
                                    <button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700 px-8 py-3 rounded-lg font-medium transition text-white w-full md:w-auto shadow-lg shadow-amber-900/20">
                                        {isPending ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang Import...</> : <><i className="fa-solid fa-cloud-arrow-down mr-2"></i> Bắt Đầu Import Toàn Bộ</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                    )}
                </div>
            </main>
        </div>
    );
}
