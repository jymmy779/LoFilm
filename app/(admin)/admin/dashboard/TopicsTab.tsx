"use client";

import { useState, useTransition } from "react";
import { updateSiteSetting } from "@/app/actions/adminSettings";
import { mockTopics, getIconComponent } from "@/app/(pages)/chu-de/TopicsClient";
import toast from "react-hot-toast";
import { Plus, Trash, ArrowUp, ArrowDown, Edit2, Check, X, ChevronRight, Eye } from "lucide-react";

interface TopicItem {
    id: string;
    title: string;
    href: string;
    bgColor: string;
    icon: string;
    imageUrl: string;
}

// Preset gradients
const PRESET_GRADIENTS = [
    { name: "Đỏ lửa", value: "from-[#d94a38] to-[#ab3024]" },
    { name: "Xanh ngọc", value: "from-[#0a8ea0] to-[#065b66]" },
    { name: "Hồng tím", value: "from-[#f4689b] to-[#6042e6]" },
    { name: "Cam đất", value: "from-[#f5a623] to-[#d68400]" },
    { name: "Xanh nước biển", value: "from-[#41d8cd] to-[#3f88f2]" },
    { name: "Tím huyền bí", value: "from-[#7123d4] to-[#2b085c]" },
    { name: "Đỏ đô", value: "from-[#b53018] to-[#59160a]" },
    { name: "Xanh lục bảo", value: "from-[#40a373] to-[#1f5f5b]" },
];

// Preset icons
const PRESET_ICONS = [
    { name: "Lửa (Hot)", value: "Flame" },
    { name: "Cuộn phim (Phim lẻ)", value: "Film" },
    { name: "Máy ảnh (Hàn Quốc)", value: "Camera" },
    { name: "Vương miện (Cổ trang)", value: "Crown" },
    { name: "Gamepad (Hoạt hình)", value: "Gamepad2" },
    { name: "Con ma (Kinh dị)", value: "Ghost" },
    { name: "Quả địa cầu (Âu Mỹ)", value: "Globe" },
    { name: "Lấp lánh (Trung Quốc)", value: "Sparkles" },
    { name: "Trái tim (Tình cảm)", value: "Heart" },
    { name: "Cúp (Giải thưởng)", value: "Award" },
    { name: "Tivi (TV Shows)", value: "Tv" },
    { name: "Bảng clapper (Phim ngắn)", value: "Clapperboard" },
];

export default function TopicsTab({ initialTopics }: { initialTopics?: any[] }) {
    const [topics, setTopics] = useState<any[]>(() => {
        if (!initialTopics || initialTopics.length === 0) {
            // Chuẩn hóa icon sang dạng string của mockTopics tĩnh
            return mockTopics.map(topic => ({
                ...topic,
                icon: typeof topic.icon === "string" ? topic.icon : (topic.icon.name || "Film")
            }));
        }
        return initialTopics.map(topic => ({
            ...topic,
            icon: typeof topic.icon === "string" ? topic.icon : "Film"
        }));
    });

    const [isPending, startTransition] = useTransition();

    // State for the item being edited or added
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form states
    const [id, setId] = useState("");
    const [title, setTitle] = useState("");
    const [href, setHref] = useState("");
    const [bgColor, setBgColor] = useState(PRESET_GRADIENTS[0].value);
    const [icon, setIcon] = useState(PRESET_ICONS[0].value);
    const [imageUrl, setImageUrl] = useState("");

    // Start editing an item
    const startEdit = (index: number) => {
        const topic = topics[index];
        setEditingIndex(index);
        setIsAdding(false);
        setId(topic.id);
        setTitle(topic.title);
        setHref(topic.href);
        setBgColor(topic.bgColor);
        setIcon(typeof topic.icon === "string" ? topic.icon : "Film");
        setImageUrl(topic.imageUrl);
    };

    // Start adding a new item
    const startAdd = () => {
        setEditingIndex(null);
        setIsAdding(true);
        setId("");
        setTitle("");
        setHref("");
        setBgColor(PRESET_GRADIENTS[0].value);
        setIcon(PRESET_ICONS[0].value);
        setImageUrl("");
    };

    // Cancel edit or add
    const cancelForm = () => {
        setEditingIndex(null);
        setIsAdding(false);
    };

    // Save form data (either edit or add)
    const saveForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!id.trim() || !title.trim() || !href.trim() || !imageUrl.trim()) {
            toast.error("Vui lòng điền đầy đủ các thông tin!");
            return;
        }

        const newTopic = { id, title, href, bgColor, icon, imageUrl };

        if (isAdding) {
            // Check duplicate id
            if (topics.some(t => t.id === id)) {
                toast.error("Mã chủ đề đã tồn tại!");
                return;
            }
            setTopics([...topics, newTopic]);
            toast.success("Đã thêm chủ đề vào danh sách tạm!");
        } else if (editingIndex !== null) {
            const updated = [...topics];
            updated[editingIndex] = newTopic;
            setTopics(updated);
            toast.success("Đã cập nhật chủ đề vào danh sách tạm!");
        }

        cancelForm();
    };

    // Delete a topic
    const deleteTopic = (index: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa chủ đề này?")) {
            setTopics(topics.filter((_, i) => i !== index));
            if (editingIndex === index) {
                cancelForm();
            } else if (editingIndex !== null && editingIndex > index) {
                setEditingIndex(editingIndex - 1);
            }
            toast.success("Đã xóa khỏi danh sách tạm!");
        }
    };

    // Reorder topics
    const moveTopic = (index: number, direction: "up" | "down") => {
        const newTopics = [...topics];
        if (direction === "up" && index > 0) {
            [newTopics[index - 1], newTopics[index]] = [newTopics[index], newTopics[index - 1]];
            if (editingIndex === index) setEditingIndex(index - 1);
            else if (editingIndex === index - 1) setEditingIndex(index);
        } else if (direction === "down" && index < topics.length - 1) {
            [newTopics[index + 1], newTopics[index]] = [newTopics[index], newTopics[index + 1]];
            if (editingIndex === index) setEditingIndex(index + 1);
            else if (editingIndex === index + 1) setEditingIndex(index);
        }
        setTopics(newTopics);
    };

    // Save to Database
    const handleSaveToDb = () => {
        if (topics.length === 0) {
            toast.error("Danh sách chủ đề không được để trống!");
            return;
        }

        startTransition(async () => {
            const res = await updateSiteSetting("home_topics", topics);
            if (res.error) {
                toast.error("Lỗi khi lưu cấu hình: " + res.error);
            } else {
                toast.success("Đã lưu và cập nhật trang chủ đề thành công! 🎉");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left/Middle Column: List of Topics */}
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-[#0F1115] rounded-lg p-6 border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold">Danh sách Chủ đề ({topics.length})</h3>
                            <p className="text-sm text-gray-400 mt-1">Sắp xếp, thêm hoặc xóa các danh mục hiển thị ở trang chủ</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={startAdd}
                                className="bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm"
                            >
                                <Plus size={16} /> Thêm mới
                            </button>
                            <button
                                onClick={handleSaveToDb}
                                disabled={isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-2 text-sm"
                            >
                                {isPending ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                                Lưu cấu hình DB
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {topics.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                Chưa có chủ đề nào trong danh sách. Hãy nhấn "Thêm mới" để bắt đầu.
                            </div>
                        ) : (
                            topics.map((topic, index) => {
                                const IconComponent = getIconComponent(topic.icon);
                                const isCurrentEditing = editingIndex === index;

                                return (
                                    <div
                                        key={topic.id}
                                        className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border transition gap-4 ${
                                            isCurrentEditing
                                                ? "bg-blue-600/5 border-blue-500/40"
                                                : "bg-[#14171c] hover:bg-[#181c24] border-white/5"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            {/* Preview Card Mini */}
                                            <div
                                                className={`relative overflow-hidden rounded-xl w-36 h-20 bg-gradient-to-br ${topic.bgColor} shrink-0 border border-white/10 flex items-center justify-between p-2.5`}
                                            >
                                                <div className="z-10 flex flex-col justify-between h-full w-[60%]">
                                                    <div className="w-6 h-6 rounded bg-black/20 flex items-center justify-center">
                                                        <IconComponent size={12} className="text-white" />
                                                    </div>
                                                    <h4 className="text-white font-bold text-[10px] line-clamp-1 leading-tight">{topic.title}</h4>
                                                </div>
                                                <div className="absolute right-0 top-0 h-full w-[70%] select-none pointer-events-none">
                                                    <div
                                                        className="w-full h-full opacity-80"
                                                        style={{
                                                            WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
                                                            maskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)"
                                                        }}
                                                    >
                                                        <img
                                                            src={topic.imageUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "/images/fallback-poster.webp";
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-white text-base truncate">{topic.title}</h4>
                                                    <span className="text-xs font-mono bg-white/5 border border-white/10 rounded px-1.5 text-gray-400">
                                                        {topic.id}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 font-mono truncate">{topic.href}</p>
                                                <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1.5">
                                                    <span>Icon: <strong>{topic.icon}</strong></span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[200px]">Màu: <span className="font-mono text-gray-400">{topic.bgColor}</span></span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                                            {/* Reorder Buttons */}
                                            <div className="flex gap-1 mr-2">
                                                <button
                                                    onClick={() => moveTopic(index, "up")}
                                                    disabled={index === 0}
                                                    className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 transition"
                                                    title="Di chuyển lên"
                                                >
                                                    <ArrowUp size={15} />
                                                </button>
                                                <button
                                                    onClick={() => moveTopic(index, "down")}
                                                    disabled={index === topics.length - 1}
                                                    className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 transition"
                                                    title="Di chuyển xuống"
                                                >
                                                    <ArrowDown size={15} />
                                                </button>
                                            </div>

                                            {/* Action Buttons */}
                                            <button
                                                onClick={() => startEdit(index)}
                                                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition"
                                                title="Sửa thông tin"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => deleteTopic(index)}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition"
                                                title="Xóa"
                                            >
                                                <Trash size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Add/Edit Panel */}
            <div className="space-y-6">
                {(isAdding || editingIndex !== null) ? (
                    <div className="bg-[#0F1115] rounded-lg p-6 border border-white/5 sticky top-24">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                <Eye size={18} /> {isAdding ? "Thêm Chủ đề mới" : `Sửa Chủ đề: ${topics[editingIndex!].title}`}
                            </h3>
                            <button onClick={cancelForm} className="text-gray-400 hover:text-white p-1 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={saveForm} className="space-y-5">
                            {/* ID */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mã định danh (ID/Slug)</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!isAdding}
                                    placeholder="Ví dụ: phim-moi, co-trang..."
                                    value={id}
                                    onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                                    className="w-full bg-[#14171c] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10 disabled:opacity-50 font-mono text-sm"
                                />
                                {isAdding && <p className="text-[10px] text-gray-500 mt-1">Chỉ chứa chữ thường không dấu, số, gạch nối và gạch dưới.</p>}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tiêu đề hiển thị</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Phim Mới, Cổ Trang..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-[#14171c] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10"
                                />
                            </div>

                            {/* Href */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Đường dẫn liên kết (Href)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: /danh-sach/phim-moi, /the-loai/co-trang..."
                                    value={href}
                                    onChange={(e) => setHref(e.target.value)}
                                    className="w-full bg-[#14171c] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10 font-mono text-sm"
                                />
                            </div>

                            {/* Icon selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Icon hiển thị</label>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {PRESET_ICONS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => setIcon(preset.value)}
                                            className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center gap-2 transition ${
                                                icon === preset.value
                                                    ? "bg-blue-600/10 text-blue-400 border-blue-500/40"
                                                    : "bg-[#14171c] text-gray-400 border-white/5 hover:bg-[#181c24]"
                                            }`}
                                        >
                                            <span className="shrink-0 font-mono text-[9px] text-gray-500 bg-white/5 border border-white/10 px-1 rounded">
                                                {preset.value}
                                            </span>
                                            <span className="truncate">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Tên icon Lucide tùy chỉnh..."
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full bg-[#14171c] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10 font-mono text-sm"
                                />
                            </div>

                            {/* Bg Gradient Selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Màu nền Gradient</label>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {PRESET_GRADIENTS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => setBgColor(preset.value)}
                                            className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center gap-2 transition ${
                                                bgColor === preset.value
                                                    ? "bg-blue-600/10 text-blue-400 border-blue-500/40"
                                                    : "bg-[#14171c] text-gray-400 border-white/5 hover:bg-[#181c24]"
                                            }`}
                                        >
                                            <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${preset.value} shrink-0`}></span>
                                            <span>{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Class Tailwind Gradient tùy chỉnh..."
                                    value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    className="w-full bg-[#14171c] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10 font-mono text-sm"
                                />
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Đường dẫn ảnh nền (Backdrop URL)</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://image.tmdb.org/t/p/w500/..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full bg-[#14171c] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10 font-mono text-sm"
                                />
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> {isAdding ? "Thêm vào danh sách" : "Cập nhật thay đổi"}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelForm}
                                    className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-lg transition"
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-[#0F1115] rounded-lg p-6 border border-white/5 text-center py-16 text-gray-500 sticky top-24">
                        Chọn một chủ đề bên trái để chỉnh sửa hoặc nhấn "Thêm mới" để tạo một chủ đề mới cho trang chủ.
                    </div>
                )}
            </div>
        </div>
    );
}
